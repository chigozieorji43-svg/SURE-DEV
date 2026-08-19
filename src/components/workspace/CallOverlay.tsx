import React, { useState, useEffect, useRef } from 'react';
import { CallSession } from '../../types';
import { webrtcService } from '../../lib/webrtcService';
import { db, collection, query, where, onSnapshot } from '../../lib/firebase';
import {
  Video, Mic, MicOff, VideoOff, MonitorUp, PhoneOff, PhoneCall,
  ShieldCheck, Clock, Wifi, AlertTriangle, X, Check, Volume2, User
} from 'lucide-react';

interface CallOverlayProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'employer' | 'developer';
  activeProject?: {
    id: string;
    title: string;
    employerId: string;
    employerName: string;
    developerId: string;
    developerName: string;
  };
  // Explicitly trigger outgoing call
  outgoingCallData?: {
    projectId: string;
    projectTitle: string;
    callType: 'audio' | 'video';
    receiverId: string;
    receiverName: string;
    receiverRole: 'employer' | 'developer';
    receiverAvatar?: string;
  } | null;
  onCloseCall?: () => void;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({
  currentUserId,
  currentUserName,
  currentUserRole,
  activeProject,
  outgoingCallData,
  onCloseCall,
}) => {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [callStatus, setCallStatus] = useState<CallSession['status']>('calling');
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<any>(null);

  // 1. Listen for Real-Time Incoming Calls via Firestore or BroadcastChannel
  useEffect(() => {
    if (!currentUserId) return;

    let unsub: (() => void) | null = null;

    if (db) {
      const q = query(
        collection(db, 'calls'),
        where('status', '==', 'calling')
      );

      unsub = onSnapshot(q, (snapshot) => {
        let matchedCall: CallSession | null = null;

        snapshot.docs.forEach((docSnap) => {
          const docData = { ...docSnap.data(), id: docSnap.id } as CallSession;
          // Skip calls placed by the current user
          if (docData.callerId === currentUserId) return;

          const isDirectReceiver = docData.receiverId === currentUserId;
          const isProjectMatch = activeProject?.id && docData.projectId === activeProject.id;
          const isRoleMatch = docData.receiverRole === currentUserRole;
          const isGenericMatch =
            (currentUserRole === 'developer' && docData.receiverId === 'dev_target') ||
            (currentUserRole === 'employer' && docData.receiverId === 'emp_target');

          if (isDirectReceiver || isProjectMatch || isGenericMatch || isRoleMatch) {
            matchedCall = docData;
          }
        });

        if (!activeCall) {
          setIncomingCall(matchedCall);
        }
      }, (err) => {
        console.warn("CallOverlay Firestore listener warning:", err);
      });
    }

    // BroadcastChannel listener fallback for local multi-tab testing
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('suredev_webrtc_signaling');
      bc.onmessage = (e) => {
        const { type, call } = e.data;
        if (type === 'CALL_OFFER' && call && call.callerId !== currentUserId) {
          if (!activeCall) {
            setIncomingCall(call);
          }
        } else if (type === 'CALL_CANCELLED' || type === 'CALL_ENDED') {
          if (incomingCall?.id === e.data.callId) {
            setIncomingCall(null);
          }
        }
      };
    }

    return () => {
      if (unsub) unsub();
      if (bc) bc.close();
    };
  }, [currentUserId, activeCall, incomingCall, activeProject?.id, currentUserRole]);

  // 2. Initiate Outgoing Call when prop changes
  useEffect(() => {
    if (outgoingCallData) {
      initiateOutgoingCall(outgoingCallData);
    }
  }, [outgoingCallData]);

  // 3. Call Duration Timer
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [callStatus]);

  const initiateOutgoingCall = async (data: NonNullable<CallOverlayProps['outgoingCallData']>) => {
    setErrorMessage(null);
    setIsMicOn(true);
    setIsVideoOn(data.callType === 'video');

    try {
      const { callId, localStream } = await webrtcService.startCall(
        {
          projectId: data.projectId,
          projectTitle: data.projectTitle,
          type: data.callType,
          callerId: currentUserId,
          callerName: currentUserName,
          callerRole: currentUserRole,
          receiverId: data.receiverId,
          receiverName: data.receiverName,
          receiverRole: data.receiverRole,
          receiverAvatar: data.receiverAvatar,
        },
        (remoteStream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch(e => console.warn('Remote audio play warning:', e));
          }
        },
        (status) => {
          setCallStatus(status);
          if (status === 'ended' || status === 'declined' || status === 'cancelled') {
            setTimeout(() => handleCleanExit(), 2000);
          }
        }
      );

      if (localVideoRef.current && data.callType === 'video') {
        localVideoRef.current.srcObject = localStream;
      }

      setActiveCall({
        id: callId,
        projectId: data.projectId,
        projectTitle: data.projectTitle,
        type: data.callType,
        callerId: currentUserId,
        callerName: currentUserName,
        callerRole: currentUserRole,
        receiverId: data.receiverId,
        receiverName: data.receiverName,
        receiverRole: data.receiverRole,
        receiverAvatar: data.receiverAvatar,
        status: 'calling',
        createdAt: new Date().toISOString(),
      });
      setCallStatus('calling');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start call');
      setCallStatus('ended');
    }
  };

  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    setErrorMessage(null);
    setActiveCall(incomingCall);
    setIncomingCall(null);
    setIsMicOn(true);
    setIsVideoOn(incomingCall.type === 'video');

    try {
      const { localStream } = await webrtcService.answerCall(
        incomingCall,
        (remoteStream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch(e => console.warn('Remote audio play warning:', e));
          }
        },
        (status) => {
          setCallStatus(status);
          if (status === 'ended' || status === 'cancelled') {
            setTimeout(() => handleCleanExit(), 2000);
          }
        }
      );

      if (localVideoRef.current && incomingCall.type === 'video') {
        localVideoRef.current.srcObject = localStream;
      }
      setCallStatus('connecting');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to answer call');
      setCallStatus('ended');
    }
  };

  const handleDeclineIncomingCall = async () => {
    if (!incomingCall) return;
    await webrtcService.endCall(incomingCall.id, 'declined');
    setIncomingCall(null);
  };

  const handleEndActiveCall = async () => {
    if (activeCall) {
      await webrtcService.endCall(activeCall.id, callStatus === 'calling' ? 'cancelled' : 'ended');
    }
    handleCleanExit();
  };

  const handleCleanExit = () => {
    webrtcService.cleanup();
    setActiveCall(null);
    setIncomingCall(null);
    setCallStatus('calling');
    setErrorMessage(null);
    if (onCloseCall) onCloseCall();
  };

  const toggleMic = () => {
    const nextState = !isMicOn;
    webrtcService.toggleMicrophone(nextState);
    setIsMicOn(nextState);
  };

  const toggleCamera = () => {
    const nextState = !isVideoOn;
    webrtcService.toggleCamera(nextState);
    setIsVideoOn(nextState);
  };

  const toggleShareScreen = async () => {
    const displayStream = await webrtcService.toggleScreenShare(!isScreenSharing);
    setIsScreenSharing(!!displayStream);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Hidden Audio element for remote audio stream playback
  return (
    <>
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* 1. INCOMING CALL OVERLAY */}
      {incomingCall && !activeCall && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 md:p-8 max-w-md w-full text-center text-white shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 animate-pulse" />

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              {incomingCall.type === 'video' ? <Video className="w-3.5 h-3.5 animate-bounce" /> : <PhoneCall className="w-3.5 h-3.5 animate-bounce" />}
              Incoming {incomingCall.type.toUpperCase()} Call
            </div>

            <div className="space-y-3">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-2xl font-bold font-display text-white relative shadow-xl overflow-hidden">
                  {incomingCall.callerAvatar ? (
                    <img src={incomingCall.callerAvatar} alt={incomingCall.callerName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{incomingCall.callerName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">{incomingCall.callerName}</h3>
                <p className="text-xs text-emerald-400 font-medium capitalize mt-0.5">
                  {incomingCall.callerRole} • {incomingCall.projectTitle}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Encrypted peer-to-peer WebRTC connection
            </p>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={handleDeclineIncomingCall}
                className="flex-1 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <PhoneOff className="w-4 h-4" /> Decline
              </button>
              <button
                onClick={handleAcceptIncomingCall}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg animate-pulse"
              >
                <PhoneCall className="w-4 h-4" /> Accept Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVE / OUTGOING CALL MODAL */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col h-[85vh] relative">
            
            {/* Top Header Bar */}
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${callStatus === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`} />
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {activeCall.projectTitle}
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono font-bold uppercase">
                      {activeCall.type} Session
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    {callStatus === 'connected' && (
                      <span className="flex items-center gap-1 font-mono text-emerald-400">
                        <Clock className="w-3.5 h-3.5" /> {formatTime(callDuration)}
                      </span>
                    )}
                    <span className="capitalize text-slate-300">
                      Status: <strong className="text-white">{callStatus}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-medium hidden sm:flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> WebRTC Secure
                </span>
              </div>
            </div>

            {/* Error Message Notice */}
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs flex items-center justify-between px-6">
                <span className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMessage}
                </span>
                <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Video Streams Canvas Grid */}
            <div className="flex-1 bg-slate-900 relative overflow-hidden p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Remote Participant Canvas */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center group shadow-inner">
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 z-20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {activeCall.callerId === currentUserId ? activeCall.receiverName : activeCall.callerName}
                </div>

                {callStatus === 'calling' && (
                  <div className="text-center space-y-3 z-10">
                    <div className="w-20 h-20 rounded-full bg-indigo-500/15 border-2 border-indigo-500 flex items-center justify-center text-2xl font-bold text-indigo-400 mx-auto animate-pulse">
                      {activeCall.receiverName.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-xs text-slate-400 font-medium animate-pulse">Calling {activeCall.receiverName}...</p>
                  </div>
                )}

                {/* HTML Video Element for Remote Video */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${activeCall.type === 'audio' ? 'hidden' : ''}`}
                />

                {/* Placeholder for Audio Call or Remote Video Off */}
                {activeCall.type === 'audio' && (
                  <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl font-bold font-display text-white shadow-xl">
                      {(activeCall.callerId === currentUserId ? activeCall.receiverName : activeCall.callerName).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {activeCall.callerId === currentUserId ? activeCall.receiverName : activeCall.callerName}
                      </h4>
                      <p className="text-xs text-emerald-400 mt-1 flex items-center justify-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 animate-pulse" /> WebRTC High-Definition Audio Active
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Local Participant Canvas */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center group shadow-inner">
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 z-20">
                  <span className="w-2 h-2 rounded-full bg-brand-teal" /> You ({currentUserName})
                </div>

                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isVideoOn || activeCall.type === 'audio' ? 'hidden' : ''}`}
                />

                {(!isVideoOn || activeCall.type === 'audio') && (
                  <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold text-slate-300">
                      {currentUserName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {activeCall.type === 'audio' ? 'Microphone Active' : 'Camera Muted'}
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Control Dock */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3 sm:gap-6 shrink-0">
              <button
                onClick={toggleMic}
                className={`p-4 rounded-2xl transition-all cursor-pointer ${
                  isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white animate-pulse'
                }`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              {activeCall.type === 'video' && (
                <button
                  onClick={toggleCamera}
                  className={`p-4 rounded-2xl transition-all cursor-pointer ${
                    isVideoOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
                  }`}
                  title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              )}

              {activeCall.type === 'video' && (
                <button
                  onClick={toggleShareScreen}
                  className={`p-4 rounded-2xl transition-all cursor-pointer ${
                    isScreenSharing ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                  title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
                >
                  <MonitorUp className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={handleEndActiveCall}
                className="px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <PhoneOff className="w-5 h-5" />
                <span>{callStatus === 'calling' ? 'Cancel Call' : 'End Call'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
