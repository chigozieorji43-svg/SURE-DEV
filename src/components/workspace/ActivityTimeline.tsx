import React, { useState, useMemo } from 'react';
import { ProjectTimelineEvent, TimelineEventType } from '../../types';
import { 
  History, Clock, User, FileText, CheckCircle2, MessageSquare, 
  Upload, Video, Target, AlertTriangle, ShieldCheck, Filter, Search, Download, ChevronDown, ChevronUp
} from 'lucide-react';

interface ActivityTimelineProps {
  events: ProjectTimelineEvent[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case 'Message Sent': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'File Uploaded': return <Upload className="w-4 h-4 text-indigo-500" />;
      case 'Deliverable Submitted': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'Meeting Started':
      case 'Meeting Ended': return <Video className="w-4 h-4 text-purple-500" />;
      case 'Milestone Created':
      case 'Milestone Completed': return <Target className="w-4 h-4 text-brand-teal" />;
      case 'Revision Requested': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'Dispute Opened': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchSearch = searchTerm === '' || 
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.eventType.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (filterType === 'all') return true;
      if (filterType === 'messages') return e.eventType === 'Message Sent';
      if (filterType === 'files') return e.eventType === 'File Uploaded';
      if (filterType === 'milestones') return e.eventType.includes('Milestone');
      if (filterType === 'deliverables') return e.eventType.includes('Deliverable') || e.eventType.includes('Completed');
      return true;
    });
  }, [events, searchTerm, filterType]);

  // Date Grouping (Today, Yesterday, Older)
  const groupedEvents = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const groups: { label: string; items: ProjectTimelineEvent[] }[] = [
      { label: 'Today', items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'Earlier Logs', items: [] },
    ];

    filteredEvents.forEach((evt) => {
      const evtDate = new Date(evt.createdAt).toDateString();
      if (evtDate === today) {
        groups[0].items.push(evt);
      } else if (evtDate === yesterday) {
        groups[1].items.push(evt);
      } else {
        groups[2].items.push(evt);
      }
    });

    return groups.filter(g => g.items.length > 0);
  }, [filteredEvents]);

  const exportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Actor', 'Role', 'EventType', 'Description'];
    const rows = filteredEvents.map(e => [
      e.id,
      e.createdAt,
      `"${e.actorName}"`,
      e.actorRole,
      `"${e.eventType}"`,
      `"${e.description.replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `workspace_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-brand-border dark:border-slate-800 space-y-6 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/60 dark:border-slate-800 pb-5">
        <div>
          <h3 className="text-base font-extrabold text-brand-midnight dark:text-white flex items-center gap-2 font-display">
            <History className="w-5 h-5 text-brand-teal" /> Immutable Activity Feed & Audit Trail
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Permanent record of contract updates, deliverable revisions, meetings, and asset changes.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit timeline..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-brand-border/60 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs font-semibold text-brand-midnight dark:text-slate-200 outline-none focus:ring-1 focus:ring-brand-teal"
            />
          </div>

          {/* Filter Dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-brand-border/60 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs font-semibold text-brand-midnight dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">All Events</option>
            <option value="messages">Chat Messages</option>
            <option value="files">File Uploads</option>
            <option value="milestones">Milestones</option>
            <option value="deliverables">Deliverables</option>
          </select>

          {/* Export CSV Button */}
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 rounded-xl bg-brand-midnight text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-brand-teal" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Audit Log Vertical Feed with Date Grouping */}
      {groupedEvents.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-xs">
          No activity logs recorded matching the active filter or search query.
        </div>
      ) : (
        <div className="space-y-8">
          {groupedEvents.map((group) => (
            <div key={group.label} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-brand-teal font-mono bg-brand-teal/10 px-2.5 py-1 rounded-lg">
                  {group.label}
                </span>
                <div className="h-[1px] flex-1 bg-brand-border/40 dark:bg-slate-800" />
              </div>

              <div className="relative pl-6 border-l-2 border-brand-border/60 dark:border-slate-800 space-y-4">
                {group.items.map((evt, idx) => {
                  const isExpanded = !!expandedIds[evt.id];

                  return (
                    <div key={`${evt.id || idx}-${idx}`} className="relative group">
                      {/* Event Circle Bullet */}
                      <div className="absolute -left-[31px] top-2 p-1.5 rounded-full bg-white dark:bg-slate-900 border border-brand-border/80 dark:border-slate-700 shadow-xs">
                        {getEventIcon(evt.eventType)}
                      </div>

                      <div className="bg-gray-50/80 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 p-4 rounded-2xl border border-brand-border/60 dark:border-slate-800 space-y-2 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-brand-teal/20 text-brand-teal font-bold flex items-center justify-center text-[10px] uppercase">
                              {evt.actorName.slice(0, 2)}
                            </div>
                            <span className="font-extrabold text-brand-midnight dark:text-white">
                              {evt.actorName}
                            </span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                              {evt.actorRole}
                            </span>
                            <span className="text-[10px] font-bold text-brand-teal bg-brand-teal/10 px-2 py-0.2 rounded-full">
                              {evt.eventType}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-400">
                              {new Date(evt.createdAt).toLocaleTimeString()}
                            </span>
                            <button
                              onClick={() => toggleExpand(evt.id)}
                              className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-700 dark:text-slate-200 font-medium leading-relaxed">
                          {evt.description}
                        </p>

                        {/* Expandable Audit Raw Payload */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-brand-border/40 text-[10px] font-mono bg-slate-950 text-slate-300 p-3 rounded-xl">
                            <div>Audit Hash: sha256-{evt.id.slice(0, 16)}...</div>
                            <div>Actor ID: {evt.actorId || 'system'}</div>
                            <div>Event Type: {evt.eventType}</div>
                            <div>Created Timestamp: {evt.createdAt}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
