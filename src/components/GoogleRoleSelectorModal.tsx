import React, { useState } from 'react';
import { Code2, Building2, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const GoogleRoleSelectorModal: React.FC = () => {
  const { googleNewUserPending, completeGoogleRegistration, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'developer' | 'employer' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!googleNewUserPending) return null;

  const handleConfirmRole = async () => {
    if (!selectedRole) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await completeGoogleRegistration(selectedRole);
    } catch (err: any) {
      setError(err.message || "Failed to finalize account role selection.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl border border-brand-border shadow-2xl max-w-xl w-full overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-brand-midnight via-slate-900 to-black text-white p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-gold/20 text-brand-gold border border-brand-gold/30 mb-3">
            <Sparkles size={24} />
          </div>
          <h2 className="font-display font-bold text-xl text-white">
            Welcome to SureDev Abia!
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            You signed in with Google as <span className="text-brand-gold font-mono font-bold">{googleNewUserPending.email}</span>. Select your account type to set up your profile.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Developer Option Card */}
            <button
              type="button"
              onClick={() => setSelectedRole('developer')}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[180px] ${
                selectedRole === 'developer'
                  ? 'border-brand-green bg-emerald-50/50 shadow-md ring-2 ring-brand-green/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              {selectedRole === 'developer' && (
                <div className="absolute top-3 right-3 text-brand-green">
                  <CheckCircle2 size={20} fill="currentColor" className="text-white" />
                </div>
              )}
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center mb-3">
                  <Code2 size={20} />
                </div>
                <h3 className="font-display font-bold text-sm text-brand-midnight">
                  Developer Account
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Build your verified engineering profile, list tech stack, display portfolio projects, and receive contract offers from Abia employers.
                </p>
              </div>
              <span className="mt-3 text-[10px] font-bold uppercase tracking-wider text-brand-green">
                For Tech Talent
              </span>
            </button>

            {/* Employer Option Card */}
            <button
              type="button"
              onClick={() => setSelectedRole('employer')}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[180px] ${
                selectedRole === 'employer'
                  ? 'border-brand-midnight bg-slate-100 shadow-md ring-2 ring-brand-midnight/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              {selectedRole === 'employer' && (
                <div className="absolute top-3 right-3 text-brand-midnight">
                  <CheckCircle2 size={20} fill="currentColor" className="text-white" />
                </div>
              )}
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-midnight/10 text-brand-midnight flex items-center justify-center mb-3">
                  <Building2 size={20} />
                </div>
                <h3 className="font-display font-bold text-sm text-brand-midnight">
                  Employer Account
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Post software projects, discover vetted local developers in Aba & Umuahia, and send direct hiring & collaboration requests.
                </p>
              </div>
              <span className="mt-3 text-[10px] font-bold uppercase tracking-wider text-brand-midnight">
                For Companies & Brands
              </span>
            </button>

          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => logout()}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel & Sign Out
            </button>

            <button
              type="button"
              disabled={!selectedRole || isSubmitting}
              onClick={handleConfirmRole}
              className="px-6 py-2.5 bg-brand-green hover:bg-brand-green-dark text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Creating Profile...' : `Continue as ${selectedRole === 'employer' ? 'Employer' : 'Developer'}`}</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
