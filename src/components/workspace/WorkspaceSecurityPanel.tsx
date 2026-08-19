import React, { useState } from 'react';
import { WorkspaceAccessLog } from '../../types';
import { ROLE_PERMISSIONS, getActionLabel } from '../../utils/permissionEngine';
import { 
  ShieldCheck, Lock, Key, Clock, ShieldAlert, Smartphone, 
  FileCheck, Shield, CheckCircle2, XCircle, AlertTriangle, X 
} from 'lucide-react';

interface WorkspaceSecurityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'employer' | 'developer' | 'admin';
  logs: WorkspaceAccessLog[];
  onLockWorkspace: () => void;
}

export const WorkspaceSecurityPanel: React.FC<WorkspaceSecurityPanelProps> = ({
  isOpen,
  onClose,
  userRole,
  logs,
  onLockWorkspace,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'permissions' | 'sessions' | 'validation'>('audit');
  const [autoLockMins, setAutoLockMins] = useState<number>(30);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-3xl w-full space-y-6 shadow-2xl animate-fade-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brand-midnight dark:text-white font-display">
                Enterprise Security & Access Audit
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Session controls, device tracking, permission matrix & audit logs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'audit' ? 'bg-white dark:bg-slate-700 text-brand-midnight dark:text-white shadow-xs' : 'text-gray-500'
            }`}
          >
            Access Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'permissions' ? 'bg-white dark:bg-slate-700 text-brand-midnight dark:text-white shadow-xs' : 'text-gray-500'
            }`}
          >
            Role Permissions
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'sessions' ? 'bg-white dark:bg-slate-700 text-brand-midnight dark:text-white shadow-xs' : 'text-gray-500'
            }`}
          >
            Session Timeout & Lock
          </button>
          <button
            onClick={() => setActiveTab('validation')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'validation' ? 'bg-white dark:bg-slate-700 text-brand-midnight dark:text-white shadow-xs' : 'text-gray-500'
            }`}
          >
            Upload Security
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'audit' && (
            <div className="space-y-3 text-xs">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No security access logs recorded for this workspace session.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={log.id ? `${log.id}-${idx}` : idx}
                    className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-brand-border/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-brand-teal" />
                      <div>
                        <div className="font-bold text-brand-midnight dark:text-white">
                          {log.userName} ({log.userRole})
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {log.action} • {log.deviceInfo || 'Web Client'}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900">
                <span className="font-bold text-indigo-700 dark:text-indigo-300">
                  Your Current Role: {userRole.toUpperCase()}
                </span>
                <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-0.5">
                  Permissions are strictly enforced via Firestore Security Rules and RBAC handlers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['employer', 'developer', 'admin'] as const).map((role) => (
                  <div key={role} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-brand-border/60 space-y-2">
                    <div className="font-extrabold text-brand-midnight dark:text-white uppercase tracking-wider text-[11px]">
                      {role} Role Actions
                    </div>
                    <ul className="space-y-1 text-[11px] text-gray-600 dark:text-slate-300">
                      {ROLE_PERMISSIONS[role].map((act) => (
                        <li key={act} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{getActionLabel(act)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-6 text-xs">
              <div className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-brand-border/60 space-y-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-500" />
                  <div>
                    <h4 className="font-bold text-brand-midnight dark:text-white">Workspace Session Inactivity Lock</h4>
                    <p className="text-[11px] text-gray-500">Auto-lock workspace screen after inactivity</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-700 dark:text-slate-200">Timeout Duration:</span>
                  <select
                    value={autoLockMins}
                    onChange={(e) => setAutoLockMins(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-brand-border font-bold text-xs"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={120}>2 Hours</option>
                  </select>
                </div>

                <button
                  onClick={onLockWorkspace}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition-colors flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" /> Lock Workspace Session Now
                </button>
              </div>
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-brand-border/60 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                <FileCheck className="w-4 h-4" />
                <span>Upload Security & Malware Scanning Active</span>
              </div>
              <ul className="space-y-2 text-[11px] text-gray-600 dark:text-slate-300">
                <li>• Max file size limit: 50.0 MB per upload</li>
                <li>• Allowed file types: PDF, ZIP, PNG, JPG, DOCX, XLSX, TXT, MP4</li>
                <li>• XSS & script injection sanitization applied on filenames</li>
                <li>• Secure Cloudinary HTTPS CDN delivery</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
