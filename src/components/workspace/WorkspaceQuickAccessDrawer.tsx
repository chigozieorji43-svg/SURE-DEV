import React, { useState } from 'react';
import { WorkspaceBookmark, WorkspaceFavorite, RecentItem } from '../../types';
import { dbService } from '../../lib/firebaseService';
import { 
  Bookmark, Star, Clock, FolderGit2, MessageSquare, Kanban, 
  Target, PackageCheck, Video, ArrowRight, X, Trash2, ExternalLink
} from 'lucide-react';

interface WorkspaceQuickAccessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: WorkspaceBookmark[];
  favorites: WorkspaceFavorite[];
  recentItems: RecentItem[];
  onNavigateTab: (tabId: string) => void;
}

export const WorkspaceQuickAccessDrawer: React.FC<WorkspaceQuickAccessDrawerProps> = ({
  isOpen,
  onClose,
  bookmarks,
  favorites,
  recentItems,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'favorites' | 'recents'>('bookmarks');

  if (!isOpen) return null;

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'message':
      case 'conversation': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'file':
      case 'document': return <FolderGit2 className="w-4 h-4 text-indigo-500" />;
      case 'task': return <Kanban className="w-4 h-4 text-amber-500" />;
      case 'milestone': return <Target className="w-4 h-4 text-brand-teal" />;
      case 'deliverable': return <PackageCheck className="w-4 h-4 text-emerald-500" />;
      case 'meeting':
      case 'meeting_note': return <Video className="w-4 h-4 text-purple-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTabTarget = (type: string) => {
    switch (type) {
      case 'message':
      case 'conversation': return 'chat';
      case 'file':
      case 'document': return 'files';
      case 'task': return 'kanban';
      case 'milestone': return 'milestones';
      case 'deliverable': return 'deliverables';
      case 'meeting':
      case 'meeting_note': return 'meeting';
      default: return 'dashboard';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white dark:bg-slate-900 border-l border-brand-border dark:border-slate-800 w-full max-w-md h-full p-6 space-y-6 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-teal/10 text-brand-teal">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-brand-midnight dark:text-white font-display">
                Quick Access Hub
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                Bookmarks, Favorites & Recently Viewed Items
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'bookmarks'
                ? 'bg-white dark:bg-slate-700 text-brand-midnight dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-brand-teal" />
            <span>Bookmarks ({bookmarks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-white dark:bg-slate-700 text-brand-midnight dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span>Favorites ({favorites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('recents')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'recents'
                ? 'bg-white dark:bg-slate-700 text-brand-midnight dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span>Recents ({recentItems.length})</span>
          </button>
        </div>

        {/* Content Lists */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {activeTab === 'bookmarks' && (
            bookmarks.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 space-y-2">
                <Bookmark className="w-8 h-8 text-gray-300 mx-auto" />
                <p>No saved bookmarks yet</p>
              </div>
            ) : (
              bookmarks.map((bm, idx) => (
                <div
                  key={`bm-${bm.id || idx}-${idx}`}
                  onClick={() => {
                    onNavigateTab(getTabTarget(bm.itemType));
                    onClose();
                  }}
                  className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 hover:bg-brand-teal/5 border border-brand-border/60 flex items-start justify-between gap-3 cursor-pointer group transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-brand-border/40 mt-0.5">
                      {getItemIcon(bm.itemType)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-brand-midnight dark:text-white group-hover:text-brand-teal">
                        {bm.title}
                      </div>
                      {bm.subtitle && <p className="text-[11px] text-gray-500 dark:text-slate-400">{bm.subtitle}</p>}
                      <span className="text-[10px] text-gray-400">{new Date(bm.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-brand-teal opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            )
          )}

          {activeTab === 'favorites' && (
            favorites.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 space-y-2">
                <Star className="w-8 h-8 text-gray-300 mx-auto" />
                <p>No starred favorites yet</p>
              </div>
            ) : (
              favorites.map((fav, idx) => (
                <div
                  key={`fav-${fav.id || idx}-${idx}`}
                  onClick={() => {
                    onNavigateTab(getTabTarget(fav.itemType));
                    onClose();
                  }}
                  className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 hover:bg-amber-500/5 border border-brand-border/60 flex items-start justify-between gap-3 cursor-pointer group transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-brand-border/40 mt-0.5">
                      {getItemIcon(fav.itemType)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-brand-midnight dark:text-white group-hover:text-amber-500">
                        {fav.title}
                      </div>
                      <span className="text-[10px] text-gray-400 capitalize">{fav.itemType}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            )
          )}

          {activeTab === 'recents' && (
            recentItems.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 space-y-2">
                <Clock className="w-8 h-8 text-gray-300 mx-auto" />
                <p>No recently viewed workspace items recorded</p>
              </div>
            ) : (
              recentItems.map((rec, idx) => (
                <div
                  key={`rec-${rec.id || idx}-${idx}`}
                  onClick={() => {
                    onNavigateTab(rec.tabTarget || getTabTarget(rec.itemType));
                    onClose();
                  }}
                  className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 hover:bg-purple-500/5 border border-brand-border/60 flex items-start justify-between gap-3 cursor-pointer group transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-brand-border/40 mt-0.5">
                      {getItemIcon(rec.itemType)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-brand-midnight dark:text-white group-hover:text-purple-500">
                        {rec.title}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        Viewed {new Date(rec.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
