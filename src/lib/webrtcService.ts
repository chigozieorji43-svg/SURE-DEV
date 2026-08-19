import {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from './firebase';
import { CallSession } from '../types';

function cleanPayload<T = any>(obj: T): T {
  if (obj === null || obj === undefined) return obj as any;
  if (Array.isArray(obj)) {
    return obj.map(cleanPayload).filter((item) => item !== undefined) as any;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanPayload(val);
      }
    }
    return cleaned;
  }
  return obj;
}

// WebRTC ICE Servers Configuration (STUN + Configurable TURN)
export const getIceServers = (): RTCConfiguration => {
  const defaultStunServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ];

  const turnUrl = import.meta.env.VITE_TURN_SERVER_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnPassword = import.meta.env.VITE_TURN_PASSWORD;

  if (turnUrl && turnUsername && turnPassword) {
    defaultStunServers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnPassword,
    });
  }

  return {
    iceServers: defaultStunServers,
    iceCandidatePoolSize: 10,
  };
};

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: string | null = null;
  private unsubCallDoc: (() => void) | null = null;
  private unsubCandidates: (() => void) | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('suredev_webrtc_signaling');
    }
  }

  // Generate synthetic silent audio & canvas video fallback stream for testing/permission-denied scenarios
  private createSyntheticStream(callType: 'audio' | 'video'): MediaStream {
    const tracks: MediaStreamTrack[] = [];
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.connect(dst);
        osc.start();
        const audioTrack = dst.stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false; // start muted
          tracks.push(audioTrack);
        }
      }
    } catch (e) {
      console.warn('Synthetic audio creation failed:', e);
    }

    if (callType === 'video') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Media Permission Fallback', 320, 220);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '14px sans-serif';
          ctx.fillText('Allow camera/mic in browser settings for live video', 320, 260);
        }
        const videoStream = (canvas as any).captureStream ? (canvas as any).captureStream(10) : null;
        if (videoStream && videoStream.getVideoTracks().length > 0) {
          tracks.push(videoStream.getVideoTracks()[0]);
        }
      } catch (e) {
        console.warn('Synthetic video creation failed:', e);
      }
    }

    return new MediaStream(tracks);
  }

  // Request browser media stream with error handling & graceful fallback
  public async getLocalMedia(callType: 'audio' | 'video'): Promise<MediaStream> {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('MediaDevices API not supported on this browser');
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (err: any) {
      console.warn('Primary media stream acquisition failed:', err);

      // If video failed, attempt audio-only first
      if (callType === 'video' && navigator?.mediaDevices?.getUserMedia) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.localStream = audioStream;
          return audioStream;
        } catch (audioErr) {
          console.warn('Audio fallback also failed:', audioErr);
        }
      }

      // If hardware or permissions are restricted, return synthetic media stream so call session works
      console.warn('Using synthetic media stream as fallback');
      const fallbackStream = this.createSyntheticStream(callType);
      this.localStream = fallbackStream;
      return fallbackStream;
    }
  }

  // Initialize Caller Connection
  public async startCall(
    sessionData: Omit<CallSession, 'id' | 'status' | 'createdAt'>,
    onRemoteStream: (stream: MediaStream) => void,
    onStatusChange: (status: CallSession['status']) => void
  ): Promise<{ callId: string; localStream: MediaStream }> {
    const stream = await this.getLocalMedia(sessionData.type);
    const callId = `call_${sessionData.projectId}_${Date.now()}`;
    this.callId = callId;

    this.peerConnection = new RTCPeerConnection(getIceServers());
    this.remoteStream = new MediaStream();

    // Add local tracks
    stream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, stream);
    });

    // Handle incoming remote tracks
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      onRemoteStream(this.remoteStream!);
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      if (state === 'connected') {
        onStatusChange('connected');
        this.updateCallStatus(callId, 'connected');
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        onStatusChange('ended');
      }
    };

    // Save initial Call Document
    const newCall: CallSession = cleanPayload({
      ...sessionData,
      id: callId,
      status: 'calling',
      createdAt: new Date().toISOString(),
    });

    if (db) {
      await setDoc(doc(db, 'calls', callId), newCall);
    } else {
      localStorage.setItem(`suredev_call_${callId}`, JSON.stringify(newCall));
    }

    // ICE Candidates handling
    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        const candidateData = cleanPayload(event.candidate.toJSON());
        if (db) {
          try {
            await addDoc(collection(db, 'calls', callId, 'callerCandidates'), candidateData);
          } catch (e) {
            console.warn("Error adding caller candidate:", e);
          }
        }
        this.broadcastChannel?.postMessage({ type: 'CALLER_CANDIDATE', callId, candidate: candidateData });
      }
    };

    // Create SDP Offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    const offerPayload = cleanPayload({ type: offer.type, sdp: offer.sdp });
    if (db) {
      await updateDoc(doc(db, 'calls', callId), offerPayload ? { offer: offerPayload } : {});
    } else {
      const stored = JSON.parse(localStorage.getItem(`suredev_call_${callId}`) || '{}');
      stored.offer = offerPayload;
      localStorage.setItem(`suredev_call_${callId}`, JSON.stringify(stored));
    }

    this.broadcastChannel?.postMessage({ type: 'CALL_OFFER', call: { ...newCall, offer: offerPayload } });

    // Listen for Answer & Receiver ICE candidates
    if (db) {
      this.unsubCallDoc = onSnapshot(doc(db, 'calls', callId), async (snapshot) => {
        const data = snapshot.data() as CallSession | undefined;
        if (!data) return;

        if (data.status === 'declined' || data.status === 'ended' || data.status === 'cancelled') {
          onStatusChange(data.status);
          this.cleanup();
          return;
        }

        if (data.answer && this.peerConnection && !this.peerConnection.currentRemoteDescription) {
          const rtcAnswer = new RTCSessionDescription(data.answer as RTCSessionDescriptionInit);
          await this.peerConnection.setRemoteDescription(rtcAnswer);
          onStatusChange('connecting');
        }
      });

      this.unsubCandidates = onSnapshot(collection(db, 'calls', callId, 'receiverCandidates'), (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            await this.peerConnection?.addIceCandidate(candidate);
          }
        });
      });
    }

    // BroadcastChannel fallback for multi-tab testing
    if (this.broadcastChannel) {
      this.broadcastChannel.onmessage = async (e) => {
        const { type, callId: msgCallId, answer, candidate } = e.data;
        if (msgCallId !== callId) return;

        if (type === 'CALL_ANSWER' && answer && this.peerConnection && !this.peerConnection.currentRemoteDescription) {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          onStatusChange('connecting');
        } else if (type === 'RECEIVER_CANDIDATE' && candidate) {
          await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
        } else if (type === 'CALL_DECLINED' || type === 'CALL_ENDED') {
          onStatusChange(type === 'CALL_DECLINED' ? 'declined' : 'ended');
          this.cleanup();
        }
      };
    }

    return { callId, localStream: stream };
  }

  // Initialize Receiver Connection (Answer Call)
  public async answerCall(
    callSession: CallSession,
    onRemoteStream: (stream: MediaStream) => void,
    onStatusChange: (status: CallSession['status']) => void
  ): Promise<{ localStream: MediaStream }> {
    const stream = await this.getLocalMedia(callSession.type);
    this.callId = callSession.id;

    this.peerConnection = new RTCPeerConnection(getIceServers());
    this.remoteStream = new MediaStream();

    stream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, stream);
    });

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      onRemoteStream(this.remoteStream!);
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      if (state === 'connected') {
        onStatusChange('connected');
        this.updateCallStatus(callSession.id, 'connected');
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        onStatusChange('ended');
      }
    };

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        const candidateData = cleanPayload(event.candidate.toJSON());
        if (db) {
          try {
            await addDoc(collection(db, 'calls', callSession.id, 'receiverCandidates'), candidateData);
          } catch (e) {
            console.warn("Error adding receiver candidate:", e);
          }
        }
        this.broadcastChannel?.postMessage({ type: 'RECEIVER_CANDIDATE', callId: callSession.id, candidate: candidateData });
      }
    };

    // Set Remote Description from Offer
    if (callSession.offer) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(callSession.offer as RTCSessionDescriptionInit));
    }

    // Create SDP Answer
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    const answerPayload = cleanPayload({ type: answer.type, sdp: answer.sdp });
    if (db) {
      await updateDoc(doc(db, 'calls', callSession.id), {
        answer: answerPayload,
        status: 'connecting',
      });
    } else {
      const stored = JSON.parse(localStorage.getItem(`suredev_call_${callSession.id}`) || '{}');
      stored.answer = answerPayload;
      stored.status = 'connecting';
      localStorage.setItem(`suredev_call_${callSession.id}`, JSON.stringify(stored));
    }

    this.broadcastChannel?.postMessage({ type: 'CALL_ANSWER', callId: callSession.id, answer: answerPayload });

    // Listen for Caller ICE Candidates and Session status changes
    if (db) {
      this.unsubCallDoc = onSnapshot(doc(db, 'calls', callSession.id), (snapshot) => {
        const data = snapshot.data() as CallSession | undefined;
        if (data && (data.status === 'ended' || data.status === 'cancelled')) {
          onStatusChange(data.status);
          this.cleanup();
        }
      });

      this.unsubCandidates = onSnapshot(collection(db, 'calls', callSession.id, 'callerCandidates'), (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            await this.peerConnection?.addIceCandidate(candidate);
          }
        });
      });
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.onmessage = async (e) => {
        const { type, callId: msgCallId, candidate } = e.data;
        if (msgCallId !== callSession.id) return;

        if (type === 'CALLER_CANDIDATE' && candidate) {
          await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
        } else if (type === 'CALL_ENDED' || type === 'CALL_CANCELLED') {
          onStatusChange('ended');
          this.cleanup();
        }
      };
    }

    return { localStream: stream };
  }

  // Toggle audio track
  public toggleMicrophone(enabled: boolean): boolean {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
    return enabled;
  }

  // Toggle video track
  public toggleCamera(enabled: boolean): boolean {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
    return enabled;
  }

  // Screen Sharing
  public async toggleScreenShare(enable: boolean): Promise<MediaStream | null> {
    if (!this.peerConnection) return null;

    if (enable) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];

        const senders = this.peerConnection.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');

        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        } else {
          this.peerConnection.addTrack(screenTrack, displayStream);
        }

        screenTrack.onended = () => {
          this.toggleScreenShare(false);
        };

        return displayStream;
      } catch (err) {
        console.error('Screen sharing error:', err);
        return null;
      }
    } else {
      // Switch back to camera
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0];
        const senders = this.peerConnection.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender && videoTrack) {
          videoSender.replaceTrack(videoTrack);
        }
      }
      return null;
    }
  }

  // End or Decline Call
  public async endCall(callId?: string, action: 'ended' | 'declined' | 'cancelled' = 'ended') {
    const targetCallId = callId || this.callId;
    if (targetCallId) {
      await this.updateCallStatus(targetCallId, action);
      this.broadcastChannel?.postMessage({
        type: action === 'declined' ? 'CALL_DECLINED' : 'CALL_ENDED',
        callId: targetCallId,
      });
    }
    this.cleanup();
  }

  private async updateCallStatus(callId: string, status: CallSession['status']) {
    try {
      if (db) {
        await updateDoc(doc(db, 'calls', callId), {
          status,
          endedAt: new Date().toISOString(),
        });
      } else {
        const stored = JSON.parse(localStorage.getItem(`suredev_call_${callId}`) || '{}');
        stored.status = status;
        stored.endedAt = new Date().toISOString();
        localStorage.setItem(`suredev_call_${callId}`, JSON.stringify(stored));
      }
    } catch (err) {
      console.warn('Call status update error:', err);
    }
  }

  // Cleanup all media streams & connections
  public cleanup() {
    if (this.unsubCallDoc) {
      this.unsubCallDoc();
      this.unsubCallDoc = null;
    }
    if (this.unsubCandidates) {
      this.unsubCandidates();
      this.unsubCandidates = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((t) => t.stop());
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.callId = null;
  }
}

export const webrtcService = new WebRTCManager();
