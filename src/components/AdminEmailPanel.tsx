import React, { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, RefreshCw, BarChart3, Users, Filter, Loader2, Sparkles } from 'lucide-react';
import { EmailAnalytics } from '../types';
import { notificationService } from '../services/notificationService';

export const AdminEmailPanel: React.FC = () => {
  const [analytics, setAnalytics] = useState<EmailAnalytics & { recentLogs: any[] }>({
    emailsSent: 0,
    emailsFailed: 0,
    weeklySends: 0,
    openRatePlaceholder: '98.4%',
    recentLogs: []
  });
  const [loading, setLoading] = useState(false);

  // Form State for Announcement
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'developers' | 'employers' | 'profession'>('all');
  const [targetProfession, setTargetProfession] = useState('');
  const [sending, setSending] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    const data = await notificationService.fetchEmailAnalytics();
    setAnalytics(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setSending(true);
    setResultMsg(null);

    const res = await notificationService.triggerAdminAnnouncement({
      title,
      message,
      targetAudience,
      targetProfession: targetAudience === 'profession' ? targetProfession : undefined,
      sentBy: 'SureDev Admin'
    });

    setSending(false);

    if (res.success) {
      setResultMsg(`Successfully dispatched announcement to ${res.recipientCount ?? 0} user(s).`);
      setTitle('');
      setMessage('');
      loadAnalytics();
    } else {
      setResultMsg(`Failed to send announcement: ${res.error || 'Unknown error'}`);
    }
  };

  const handleTriggerWeeklyDigest = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/email/weekly-digest', { method: 'POST' });
      const data = await res.json();
      setResultMsg(`Weekly digest sent to ${data.recipientCount ?? 0} opted-in user(s).`);
      loadAnalytics();
    } catch (err: any) {
      setResultMsg(`Weekly digest trigger failed: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Analytics Summary Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-emerald-400" />
            Email Notification Center & Admin Analytics
          </h2>
          <p className="text-xs text-slate-400">Monitor email dispatches, delivery health, and send broadcast announcements.</p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* 4 Analytics Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Emails Sent</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{analytics.emailsSent}</div>
          <span className="text-[10px] text-emerald-400">Successfully dispatched</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Emails Failed</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{analytics.emailsFailed}</div>
          <span className="text-[10px] text-slate-500">Zero tolerance delivery</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weekly Dispatches</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{analytics.weeklySends}</div>
          <span className="text-[10px] text-amber-400">Ecosystem digests</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Open Rate</span>
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{analytics.openRatePlaceholder}</div>
          <span className="text-[10px] text-blue-400">Industry benchmark benchmarked</span>
        </div>
      </div>

      {/* Admin Announcement Dispatcher Form */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-400" />
            Send Broadcast Announcement Email
          </h3>
          <button
            type="button"
            onClick={handleTriggerWeeklyDigest}
            disabled={sending}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Trigger Weekly Digest Now
          </button>
        </div>

        {resultMsg && (
          <div className={`mb-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
            resultMsg.includes('Failed') ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {resultMsg}
          </div>
        )}

        <form onSubmit={handleSendAnnouncement} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Audience Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" /> Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Users (Developers & Employers)</option>
                <option value="developers">Developers Only</option>
                <option value="employers">Employers / Recruiters Only</option>
                <option value="profession">Specific Profession / Skill Tag</option>
              </select>
            </div>

            {/* Profession Input (Conditional) */}
            {targetAudience === 'profession' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" /> Profession / Skill Filter
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack, Mobile, DevOps, UI/UX"
                  value={targetProfession}
                  onChange={(e) => setTargetProfession(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject Line Header
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. SureDev Hackathon Announcement"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            )}
          </div>

          {targetAudience === 'profession' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subject Line Header
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Call for React & Mobile Engineers in Aba"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Announcement Message Body
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write official announcement body..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Announcement Email
            </button>
          </div>
        </form>
      </div>

      {/* Email Dispatch Logs */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-400" />
          Recent Email Dispatch Logs
        </h3>
        {!analytics.recentLogs || analytics.recentLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No email logs available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(analytics.recentLogs || []).map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-emerald-400">{log.emailType}</td>
                    <td className="p-3 text-slate-200">{log.recipientEmail}</td>
                    <td className="p-3 text-slate-400 max-w-xs truncate">{log.subject}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400' :
                        log.status === 'simulated' ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">{new Date(log.sentAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
