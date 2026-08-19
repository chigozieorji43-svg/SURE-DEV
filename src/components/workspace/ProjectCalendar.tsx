import React, { useState } from 'react';
import { ContractMilestone, ContractMeeting, ManagedProject } from '../../types';
import { Calendar as CalendarIcon, Clock, Video, Target, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface ProjectCalendarProps {
  project: ManagedProject;
  milestones: ContractMilestone[];
  meetings: ContractMeeting[];
}

export const ProjectCalendar: React.FC<ProjectCalendarProps> = ({
  project,
  milestones,
  meetings,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-brand-border dark:border-slate-800 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 dark:border-slate-800 pb-5">
        <div>
          <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand-teal" /> Interactive Project Schedule Calendar
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Visual month planner mapping target deadlines, milestone checkpoints, and video calls.
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-brand-midnight dark:text-white" />
          </button>
          <span className="text-sm font-bold text-brand-midnight dark:text-white font-display min-w-[140px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-brand-midnight dark:text-white" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Header */}
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase text-gray-400 dark:text-slate-500 pb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells before month start */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-24 bg-gray-50/40 dark:bg-slate-950/20 rounded-2xl border border-transparent" />
        ))}

        {daysArray.map((day) => {
          const formattedDay = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          
          // Match Events
          const dayMilestones = milestones.filter((m) => m.dueDate === formattedDay);
          const dayMeetings = meetings.filter((m) => m.scheduledAt.startsWith(formattedDay));
          const isDeadline = project.deadline === formattedDay;

          return (
            <div
              key={day}
              className="h-28 p-2 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-brand-border/60 dark:border-slate-800 flex flex-col justify-between overflow-y-auto"
            >
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400">{day}</span>

              <div className="space-y-1">
                {isDeadline && (
                  <div className="p-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-bold truncate">
                    🎯 Target Deadline
                  </div>
                )}

                {dayMilestones.map((m, msIdx) => (
                  <div
                    key={`ms-${m.id || msIdx}-${msIdx}`}
                    className="p-1 rounded bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-[9px] font-bold truncate"
                    title={m.title}
                  >
                    🚩 {m.title}
                  </div>
                ))}

                {dayMeetings.map((mt, mtIdx) => (
                  <div
                    key={`mt-${mt.id || mtIdx}-${mtIdx}`}
                    className="p-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[9px] font-bold truncate"
                    title={mt.title}
                  >
                    📹 {mt.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
