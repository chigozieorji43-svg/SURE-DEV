import React from 'react';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthMismatchModalProps {
  onSwitchPortal?: (targetRole: 'developer' | 'employer') => void;
}

export const AuthMismatchModal: React.FC<AuthMismatchModalProps> = ({ onSwitchPortal }) => {
  const { authMismatch, clearMismatch } = useAuth();

  if (!authMismatch) return null;

  const handleRedirect = () => {
    const targetRole = authMismatch.userRole;
    clearMismatch();
    if (onSwitchPortal) {
      onSwitchPortal(targetRole);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-rose-950">
                Portal Access Mismatch
              </h3>
              <p className="text-[11px] text-rose-700">Account Role Verification</p>
            </div>
          </div>
          <button
            onClick={clearMismatch}
            className="p-1 rounded-lg hover:bg-rose-100 text-rose-400 hover:text-rose-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {authMismatch.userRole === 'developer' ? (
              <p>
                This account is registered as a <strong className="text-brand-green uppercase font-mono">Developer</strong>. Please continue using the Developer portal.
              </p>
            ) : (
              <p>
                This account is registered as an <strong className="text-brand-midnight uppercase font-mono">Employer</strong>. Please continue using the Employer portal.
              </p>
            )}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Your stored account role in Firestore is immutable to protect profile security and prevent duplicate credentials.
          </p>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={clearMismatch}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleRedirect}
              className="px-5 py-2.5 bg-brand-midnight hover:bg-black text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Go to {authMismatch.userRole === 'developer' ? 'Developer' : 'Employer'} Portal</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
