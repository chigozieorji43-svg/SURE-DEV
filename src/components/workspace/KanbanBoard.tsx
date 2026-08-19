import React, { useState } from 'react';
import { KanbanTask, TaskColumn, TaskPriority } from '../../types';
import { dbService } from '../../lib/firebaseService';
import { 
  Kanban, Plus, CheckSquare, MessageSquare, Clock, User, 
  Trash2, MoveRight, MoveLeft, Tag, Paperclip, ChevronRight, Check
} from 'lucide-react';

interface KanbanBoardProps {
  projectId: string;
  projectTitle: string;
  userId: string;
  userName: string;
  userRole: 'employer' | 'developer';
  tasks: KanbanTask[];
  isReadOnly?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  projectTitle,
  userId,
  userName,
  userRole,
  tasks,
  isReadOnly = false,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);

  // New Task Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [column, setColumn] = useState<TaskColumn>('todo');
  const [checklistText, setChecklistText] = useState('');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const checklistItems = checklistText
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((text, idx) => ({ id: `cl_${idx}`, text, completed: false }));

    await dbService.createContractTask(
      {
        projectId,
        title,
        description,
        column,
        priority,
        dueDate: dueDate || undefined,
        assigneeName: userRole === 'developer' ? userName : 'Developer Lead',
        checklist: checklistItems,
      },
      userId,
      userName,
      userRole
    );

    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setChecklistText('');
  };

  const handleMoveTask = async (taskId: string, targetColumn: TaskColumn) => {
    if (isReadOnly) return;
    await dbService.updateContractTask(
      taskId,
      projectId,
      { column: targetColumn },
      userId,
      userName,
      userRole
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    if (isReadOnly) return;
    if (confirm('Are you sure you want to delete this task item?')) {
      await dbService.deleteContractTask(taskId, projectId);
    }
  };

  const handleToggleChecklist = async (task: KanbanTask, checkId: string) => {
    if (isReadOnly) return;
    const updatedChecklist = (task.checklist || []).map((c) =>
      c.id === checkId ? { ...c, completed: !c.completed } : c
    );
    await dbService.updateContractTask(
      task.id,
      projectId,
      { checklist: updatedChecklist },
      userId,
      userName,
      userRole
    );
  };

  const columns: Array<{ id: TaskColumn; title: string; color: string }> = [
    { id: 'todo', title: 'To Do', color: 'border-slate-400 text-slate-600' },
    { id: 'in_progress', title: 'In Progress', color: 'border-blue-500 text-blue-600' },
    { id: 'review', title: 'In Review', color: 'border-amber-500 text-amber-600' },
    { id: 'completed', title: 'Completed', color: 'border-emerald-500 text-emerald-600' },
  ];

  const getPriorityBadge = (p: TaskPriority) => {
    const colors: Record<TaskPriority, string> = {
      Low: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400',
      Medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      High: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      Urgent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono border border-current/20 ${colors[p]}`}>
        {p}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-brand-border dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
              <Kanban className="w-5 h-5 text-brand-teal" /> Interactive Project Kanban Task Board
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Agile work management board to track sprint items, code tasks, bug fixes, and feature releases.
            </p>
          </div>

          {!isReadOnly && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Task Card
            </button>
          )}
        </div>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col, cIdx) => {
          const columnTasks = tasks.filter((t) => t.column === col.id);

          return (
            <div
              key={col.id ? `${col.id}-${cIdx}` : cIdx}
              className="bg-gray-50/80 dark:bg-slate-900/60 p-4 rounded-3xl border border-brand-border/60 dark:border-slate-800 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-brand-border/60 dark:border-slate-800 mb-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                  {col.title} ({columnTasks.length})
                </span>
                {!isReadOnly && (
                  <button
                    onClick={() => {
                      setColumn(col.id);
                      setShowCreateModal(true);
                    }}
                    className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Tasks Cards Feed */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-10 text-[11px] text-gray-400 italic">
                    No tasks in {col.title}
                  </div>
                ) : (
                  columnTasks.map((task, tIdx) => {
                    const checklist = task.checklist || [];
                    const completedChecklist = checklist.filter((c) => c.completed).length;

                    return (
                      <div
                        key={task.id ? `${task.id}-${tIdx}` : tIdx}
                        className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-brand-border/60 dark:border-slate-700/60 shadow-xs space-y-3 hover:border-brand-teal transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-brand-midnight dark:text-white line-clamp-2">
                            {task.title}
                          </h4>
                          {getPriorityBadge(task.priority)}
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Checklist items summary */}
                        {checklist.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold">
                              <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3 text-brand-teal" /> Subtasks</span>
                              <span>{completedChecklist}/{checklist.length}</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full bg-brand-teal"
                                style={{ width: `${(completedChecklist / checklist.length) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Interactive Checklist Quick Toggles */}
                        {checklist.length > 0 && (
                          <div className="space-y-1 text-[10px] text-gray-600 dark:text-slate-300">
                            {checklist.slice(0, 3).map((c, clIdx) => (
                              <button
                                key={c.id ? `${c.id}-${clIdx}` : clIdx}
                                onClick={() => handleToggleChecklist(task, c.id)}
                                className="flex items-center gap-1.5 hover:text-brand-teal cursor-pointer w-full text-left truncate"
                              >
                                <span className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${c.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-400'}`}>
                                  {c.completed && <Check className="w-2 h-2" />}
                                </span>
                                <span className={c.completed ? 'line-through text-gray-400' : ''}>{c.text}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Task Card Footer */}
                        <div className="pt-2 border-t border-brand-border/40 dark:border-slate-700/40 flex items-center justify-between text-[10px] text-gray-400">
                          {task.dueDate && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.dueDate}</span>
                          )}

                          {/* Column Shift Controls */}
                          {!isReadOnly && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {col.id !== 'todo' && (
                                <button
                                  onClick={() => handleMoveTask(task.id, col.id === 'completed' ? 'review' : col.id === 'review' ? 'in_progress' : 'todo')}
                                  className="p-1 rounded bg-gray-100 dark:bg-slate-700 hover:text-brand-teal cursor-pointer"
                                  title="Move Left"
                                >
                                  <MoveLeft className="w-3 h-3" />
                                </button>
                              )}
                              {col.id !== 'completed' && (
                                <button
                                  onClick={() => handleMoveTask(task.id, col.id === 'todo' ? 'in_progress' : col.id === 'in_progress' ? 'review' : 'completed')}
                                  className="p-1 rounded bg-gray-100 dark:bg-slate-700 hover:text-brand-teal cursor-pointer"
                                  title="Move Right"
                                >
                                  <MoveRight className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 rounded bg-rose-500/10 text-rose-500 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
                <Kanban className="w-5 h-5 text-brand-teal" /> Create Task Item
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement OAuth JWT Refresh Token Flow"
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Technical scope, requirements, or test criteria..."
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Column</label>
                  <select
                    value={column}
                    onChange={(e: any) => setColumn(e.target.value)}
                    className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Subtask Checklist Items (One per line)</label>
                <textarea
                  rows={3}
                  value={checklistText}
                  onChange={(e) => setChecklistText(e.target.value)}
                  placeholder="e.g. Write unit tests&#10;Update API docs&#10;Verify mobile responsiveness"
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2.5 rounded-xl border font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight font-bold cursor-pointer">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
