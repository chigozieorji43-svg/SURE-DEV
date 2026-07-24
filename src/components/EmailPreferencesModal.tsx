import React, { useState, useEffect } from 'react';
import { X, Mail, Shield, Handshake, Sparkles, Check, Loader2 } from 'lucide-react';
import { EmailPreferences } from '../types';
import { notificationService } from '../services/notificationService';

interface EmailPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export const EmailPreferencesModal: React.FC<EmailPreferencesModalProps> = ({
  isOpen,
  onClose,
  currentUserId
}) => {
  const [prefs, setPrefs] = useState<EmailPreferences>({
    weeklyEmails: true,
    securityAlerts: true,
    collaborationEmails: true,
    marketingEmails: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (isOpen && currentUserId) {
      setLoading(true);
      notificationService.fetchUserEmailPreferences(currentUserId).then(res => {
        setPrefs(res);
        setLoading(false);
      });
    }
  }, [isOpen, currentUserId]);

  const handleToggle = (key: keyof EmailPreferences) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!currentUserId) return;
    setSaving(true);
    await notificationService.saveUserEmailPreferences(currentUserId, prefs);
    setSaving(false);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 flex justify-center items-start sm:items-center min-h-screen animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 my-auto max-h-[90vh] flex flex-col overflow-hidden">
        {/* Sticky Header with Close Button */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Email Preferences</h3>
              <p className="text-[11px] text-slate-400">Manage notification dispatches from SureDev</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs"
            aria-label="Close preferences"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <span>Loading preferences...</span>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {/* Weekly Updates */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Weekly Ecosystem Digest</h4>
                  <p className="text-xs text-slate-400">Top developers, new projects, and trending skills in Abia State.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.weeklyEmails}
                onChange={() => handleToggle('weeklyEmails')}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
              />
            </div>

            {/* Security Alerts */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Security & Login Alerts</h4>
                  <p className="text-xs text-slate-400">Immediate alerts when a new device or browser logs into your account.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.securityAlerts}
                onChange={() => handleToggle('securityAlerts')}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
              />
            </div>

            {/* Collaboration & Messages */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-start gap-3">
                <Handshake className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Collaboration & Message Emails</h4>
                  <p className="text-xs text-slate-400">Notifications when peer developers send requests or private messages.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.collaborationEmails}
                onChange={() => handleToggle('collaborationEmails')}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
              />
            </div>

            {/* Marketing & Announcements */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Guild Announcements & News</h4>
                  <p className="text-xs text-slate-400">Official updates, tech meetups, and platform announcements.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.marketingEmails}
                onChange={() => handleToggle('marketingEmails')}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
              />
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-2 font-medium">
            <Check className="w-4 h-4" /> Email preferences saved successfully!
          </div>
        )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
