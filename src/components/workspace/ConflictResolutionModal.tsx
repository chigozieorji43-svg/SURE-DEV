import React, { useState } from 'react';
import { ConflictEdit } from '../../types';
import { ShieldAlert, GitCompare, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface ConflictResolutionModalProps {
  conflict: ConflictEdit | null;
  onResolve: (chosenVersion: any) => void;
  onCancel: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  onResolve,
  onCancel,
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'json'>('side-by-side');

  if (!conflict) return null;

  const formatValue = (val: any) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val, null, 2);
  };

  const handleMerge = () => {
    let merged = conflict.myVersion;
    if (typeof conflict.myVersion === 'object' && typeof conflict.theirVersion === 'object') {
      merged = { ...conflict.theirVersion, ...conflict.myVersion };
    } else if (typeof conflict.myVersion === 'string') {
      merged = `${conflict.myVersion}\n\n--- [Merged Changes from ${conflict.theirUserName}] ---\n${conflict.theirVersion}`;
    }
    onResolve(merged);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full space-y-6 shadow-2xl animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brand-midnight dark:text-white font-display flex items-center gap-2">
                Concurrent Edit Conflict Detected
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {conflict.theirUserName} modified this {conflict.entityType} while you were editing
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
            Compare Changes
          </span>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                viewMode === 'side-by-side' ? 'bg-white dark:bg-slate-700 text-brand-midnight dark:text-white shadow-xs' : 'text-gray-500'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                viewMode === 'json' ? 'bg-white dark:bg-slate-700 text-brand-midnight dark:text-white shadow-xs' : 'text-gray-500'
              }`}
            >
              View JSON Diff
            </button>
          </div>
        </div>

        {/* Version Comparison Box */}
        {viewMode === 'side-by-side' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* My Version */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-2">
              <div className="flex items-center justify-between font-bold text-blue-700 dark:text-blue-300">
                <span>Your Version (Local)</span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {new Date(conflict.myTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-blue-900 font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto">
                {formatValue(conflict.myVersion)}
              </div>
              <button
                onClick={() => onResolve(conflict.myVersion)}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors text-xs"
              >
                Keep My Version
              </button>
            </div>

            {/* Their Version */}
            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 space-y-2">
              <div className="flex items-center justify-between font-bold text-purple-700 dark:text-purple-300">
                <span>{conflict.theirUserName}'s Version</span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {new Date(conflict.theirTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-100 dark:border-purple-900 font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto">
                {formatValue(conflict.theirVersion)}
              </div>
              <button
                onClick={() => onResolve(conflict.theirVersion)}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer transition-colors text-xs"
              >
                Keep Their Version
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-950 text-slate-200 rounded-2xl font-mono text-[11px] space-y-3 max-h-60 overflow-y-auto">
            <div>
              <span className="text-blue-400 font-bold">// YOUR LOCAL DRAFT:</span>
              <pre>{formatValue(conflict.myVersion)}</pre>
            </div>
            <div className="border-t border-slate-800 pt-2">
              <span className="text-purple-400 font-bold">// {conflict.theirUserName.toUpperCase()}'S REMOTE VERSION:</span>
              <pre>{formatValue(conflict.theirVersion)}</pre>
            </div>
          </div>
        )}

        {/* Merge Button Action */}
        <div className="flex items-center justify-between border-t border-brand-border/40 pt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
          >
            Cancel Edit
          </button>

          <button
            onClick={handleMerge}
            className="px-5 py-2.5 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-md hover:opacity-90"
          >
            <GitCompare className="w-4 h-4" /> Smart Merge Both Versions
          </button>
        </div>
      </div>
    </div>
  );
};
