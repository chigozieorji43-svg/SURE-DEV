import React, { useState, useEffect, useRef } from 'react';
import { ContractMeeting, ManagedProject } from '../../types';
import { dbService } from '../../lib/firebaseService';
import { 
  Video, Mic, MicOff, VideoOff, MonitorUp, PhoneOff, PhoneCall, 
  Users, MessageSquare, Shield, Clock, Wifi, Calendar, Plus, Play, CheckCircle, Phone
} from 'lucide-react';
import { CallOverlay } from './CallOverlay';

interface VideoAudioMeetingProps {
  projectId: string;
  projectTitle: string;
  project?: ManagedProject;
  userId: string;
  userName: string;
  userRole: 'employer' | 'developer';
  meetings: ContractMeeting[];
  isReadOnly?: boolean;
  onStartCall?: (callData: any) => void;
}

export const VideoAudioMeeting: React.FC<VideoAudioMeetingProps> = ({
  projectId,
  projectTitle,
  project,
  userId,
  userName,
  userRole,
  meetings,
  isReadOnly = false,
  onStartCall,
}) => {
  const [activeCall, setActiveCall] = useState<ContractMeeting | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'Strong' | 'Fair' | 'Poor'>('Strong');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [outgoingCall, setOutgoingCall] = useState<{
    projectId: string;
    projectTitle: string;
    callType: 'audio' | 'video';
    receiverId: string;
    receiverName: string;
    receiverRole: 'employer' | 'developer';
  } | null>(null);

  // Form for new meeting
  const [newTitle, setNewTitle] = useState('Sync & Architecture Review');
  const [newType, setNewType] = useState<'video' | 'audio'>('video');
  const [newScheduledAt, setNewScheduledAt] = useState(new Date().toISOString().slice(0, 16));

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (activeCall) {
      timerRef.current = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCallSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [activeCall]);

  const handleStartCall = async (meeting: ContractMeeting) => {
    setActiveCall(meeting);
    await dbService.updateMeetingStatus(meeting.id, projectId, 'live', userId, userName, userRole);
  };

  const handleEndCall = async () => {
    if (!activeCall) return;
    await dbService.updateMeetingStatus(activeCall.id, projectId, 'ended', userId, userName, userRole);
    setActiveCall(null);
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.scheduleContractMeeting({
        projectId,
        title: newTitle,
        type: newType,
        scheduledAt: newScheduledAt,
        status: 'scheduled',
        hostId: userId,
        hostName: userName,
        participants: [userName, userRole === 'employer' ? 'Developer Lead' : 'Employer Representative'],
      }, userRole);
      setShowScheduleModal(false);
    } catch (err) {
      console.error('Error scheduling meeting:', err);
    }
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Active Live Call Stage */}
      {activeCall ? (
        <div className="bg-slate-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-slate-800 space-y-6 animate-in fade-in">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {activeCall.title}
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-bold uppercase">
                    {activeCall.type} Session • Live
                  </span>
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-brand-teal" /> {formatDuration(callSeconds)}</span>
                  <span className="flex items-center gap-1 text-emerald-400"><Wifi className="w-3.5 h-3.5" /> Signal: {connectionQuality}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">2 Participants Connected</span>
            </div>
          </div>

          {/* Video Grid Canvas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[380px]">
            {/* Remote Participant Box */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center group">
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 z-10">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {userRole === 'employer' ? 'Developer Lead' : 'Employer Representative'}
              </div>
              
              {/* Video Canvas Simulation */}
              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-brand-teal/20 border-2 border-brand-teal text-brand-teal flex items-center justify-center text-2xl font-bold font-display shadow-lg mb-3">
                  {userRole === 'employer' ? 'DEV' : 'EMP'}
                </div>
                <div className="text-sm font-bold text-slate-200">
                  {userRole === 'employer' ? 'Developer Lead' : 'Employer'}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Audio active
                </div>
              </div>
            </div>

            {/* Local User Box */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 z-10">
                <span className="w-2 h-2 rounded-full bg-brand-teal" /> You ({userName})
              </div>

              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                {isVideoOn ? (
                  <div className="w-full h-full bg-slate-800/80 rounded-xl border border-slate-700/60 flex flex-col items-center justify-center p-4">
                    <div className="w-16 h-16 rounded-full bg-slate-700 text-white flex items-center justify-center text-xl font-bold mb-2">
                      {userName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold">HD Camera Stream Operational</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <VideoOff className="w-12 h-12 text-slate-600 mb-2" />
                    <span className="text-xs text-slate-400">Camera Off</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meeting Control Dock */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-4 rounded-2xl transition-all cursor-pointer ${
                isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
              }`}
              title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-4 rounded-2xl transition-all cursor-pointer ${
                isVideoOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
              }`}
              title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              className={`p-4 rounded-2xl transition-all cursor-pointer ${
                isScreenSharing ? 'bg-brand-teal text-brand-midnight font-bold' : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title="Share Screen"
            >
              <MonitorUp className="w-5 h-5" />
            </button>

            <button
              onClick={handleEndCall}
              className="px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <PhoneOff className="w-5 h-5" /> End Call Session
            </button>
          </div>
        </div>
      ) : (
        /* Scheduled Meetings & History */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-brand-border dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-brand-teal" /> Collaborative Video & Voice Call Center
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Schedule and launch HD video calls, screen-shares, and standups.
              </p>
            </div>

            {!isReadOnly && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const receiverRole = userRole === 'employer' ? 'developer' : 'employer';
                    const receiverId = userRole === 'employer' ? (project?.developerId || 'dev_target') : (project?.employerId || 'emp_target');
                    const receiverName = userRole === 'employer' ? (project?.developerName || 'Developer Lead') : (project?.employerName || 'Employer Client');
                    const callPayload = {
                      projectId,
                      projectTitle: project?.title || projectTitle,
                      callType: 'audio' as const,
                      receiverId,
                      receiverName,
                      receiverRole,
                    };
                    if (onStartCall) {
                      onStartCall(callPayload);
                    } else {
                      setOutgoingCall(callPayload);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Start Audio Standup Call"
                >
                  <Phone className="w-3.5 h-3.5" /> Audio Call
                </button>

                <button
                  onClick={() => {
                    const receiverRole = userRole === 'employer' ? 'developer' : 'employer';
                    const receiverId = userRole === 'employer' ? (project?.developerId || 'dev_target') : (project?.employerId || 'emp_target');
                    const receiverName = userRole === 'employer' ? (project?.developerName || 'Developer Lead') : (project?.employerName || 'Employer Client');
                    const callPayload = {
                      projectId,
                      projectTitle: project?.title || projectTitle,
                      callType: 'video' as const,
                      receiverId,
                      receiverName,
                      receiverRole,
                    };
                    if (onStartCall) {
                      onStartCall(callPayload);
                    } else {
                      setOutgoingCall(callPayload);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Start HD Video Conference"
                >
                  <Video className="w-3.5 h-3.5" /> Video Call
                </button>

                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Schedule
                </button>
              </div>
            )}
          </div>

          {/* Meetings List */}
          {meetings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-brand-border/80 dark:border-slate-800 p-6 space-y-3">
              <Calendar className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-brand-midnight dark:text-slate-200">No Scheduled Meetings</div>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                Schedule a video conference or audio call to review project deliverables, clear roadblocks, or hold sprint planning sessions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetings.map((m, mIdx) => (
                <div
                  key={m.id ? `${m.id}-${mIdx}` : mIdx}
                  className="bg-gray-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-brand-border/60 dark:border-slate-700/60 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                        {m.type}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        Host: {m.hostName}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-brand-midnight dark:text-white">{m.title}</h4>
                    <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Scheduled: {new Date(m.scheduledAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-brand-border/40 dark:border-slate-700/40 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 capitalize">
                      Status: {m.status}
                    </span>

                    {m.status !== 'ended' && !isReadOnly && (
                      <button
                        onClick={() => handleStartCall(m)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> Launch Call
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-teal" /> Schedule Collaborative Call
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleScheduleMeeting} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Meeting Agenda / Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Session Format *</label>
                <select
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  <option value="video">HD Video Conference + Screen Share</option>
                  <option value="audio">Voice Audio Only Standup</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={newScheduledAt}
                  onChange={(e) => setNewScheduledAt(e.target.value)}
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2.5 rounded-xl border text-gray-600 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight font-bold cursor-pointer"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time WebRTC Call Overlay */}
      <CallOverlay
        currentUserId={userId}
        currentUserName={userName}
        currentUserRole={userRole}
        activeProject={{
          id: projectId,
          title: projectTitle,
          employerId: userRole === 'employer' ? userId : 'emp_target',
          employerName: userRole === 'employer' ? userName : 'Employer Client',
          developerId: userRole === 'developer' ? userId : 'dev_target',
          developerName: userRole === 'developer' ? userName : 'Developer Lead',
        }}
        outgoingCallData={outgoingCall}
        onCloseCall={() => setOutgoingCall(null)}
      />
    </div>
  );
};
