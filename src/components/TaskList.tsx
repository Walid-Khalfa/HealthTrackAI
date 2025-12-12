
import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';
import { Icons } from './Icons';

export const TaskList: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // New Task State
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Filters
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Unique storage key per user
  const STORAGE_KEY = user ? `healthtrackai_tasks_${user.id}` : 'healthtrackai_tasks_guest';

  // Load tasks on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTasks(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load tasks", e);
    }
  }, [STORAGE_KEY]);

  // Save tasks on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, STORAGE_KEY]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      description: newTaskDesc.trim(),
      completed: false,
      dueDate: newTaskDate || undefined,
      createdAt: Date.now(),
      priority: newTaskPriority
    };

    setTasks([newTask, ...tasks]);
    
    // Reset form
    setNewTaskText('');
    setNewTaskDesc('');
    setNewTaskDate('');
    setNewTaskPriority('medium');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTask = (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditText(task.text);
    setEditDesc(task.description || '');
    setEditDate(task.dueDate || '');
    setEditPriority(task.priority || 'medium');
  };

  const saveEdit = (id: string) => {
    if (!editText.trim()) return;
    setTasks(tasks.map(t => 
      t.id === id ? { 
        ...t, 
        text: editText.trim(),
        description: editDesc.trim(),
        dueDate: editDate || undefined,
        priority: editPriority
      } : t
    ));
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditDesc('');
    setEditDate('');
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = 
      filter === 'all' ? true : 
      filter === 'pending' ? !t.completed : 
      t.completed;
    
    const matchesSearch = 
      t.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getPriorityColor = (p?: string) => {
    switch(p) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'medium': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Health Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your health to-dos, appointments, and medication.</p>
        </div>
        
        {/* Progress Widget */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm min-w-[200px]">
           <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
             <span>Progress</span>
             <span>{Math.round(progress)}%</span>
           </div>
           <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
             <div 
               className="bg-medical-600 h-2 rounded-full transition-all duration-500" 
               style={{ width: `${progress}%` }}
             />
           </div>
           <div className="mt-2 text-xs text-gray-400 text-right">
             {completedCount} of {tasks.length} completed
           </div>
        </div>
      </div>

      {/* Add Task Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-8">
        <form onSubmit={addTask} className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Task Title (e.g., 'Take Vitamin D')"
              className="flex-[2] bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-medical-500 dark:text-white"
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as any)}
              className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-medical-500 dark:text-white"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input
              type="date"
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
              className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-medical-500 dark:text-white"
            />
          </div>
          <div className="flex gap-3">
             <input
                type="text"
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                placeholder="Description (optional)..."
                className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-medical-500 dark:text-white text-sm"
              />
             <Button type="submit" disabled={!newTaskText.trim()}>
                Add
             </Button>
          </div>
        </form>
      </div>

      {/* Controls Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === f 
                  ? 'bg-medical-100 text-medical-700 dark:bg-medical-900/30 dark:text-medical-300 ring-1 ring-medical-500/20' 
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Icons.Search className="h-4 w-4 text-gray-400" />
           </div>
           <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search tasks..." 
             className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:border-medical-500 sm:text-sm transition-colors"
           />
           {searchQuery && (
             <button 
               onClick={() => setSearchQuery('')}
               className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
             >
               <Icons.Close className="h-4 w-4" />
             </button>
           )}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <Icons.Tasks className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? "No matching tasks found." : "No tasks found."}
            </p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id}
              className={`group flex items-start gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border transition-all ${
                task.completed 
                  ? 'border-transparent bg-gray-50 dark:bg-slate-800/50 opacity-75' 
                  : 'border-gray-200 dark:border-gray-700 shadow-sm hover:border-medical-200 dark:hover:border-medical-800'
              }`}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                  task.completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-medical-500'
                }`}
              >
                {task.completed && <Icons.Check className="w-4 h-4" />}
              </button>

              <div className="flex-1 min-w-0">
                {editingId === task.id ? (
                  <div className="space-y-3">
                    <div className="flex flex-col md:flex-row gap-2">
                       <input 
                        type="text" 
                        value={editText} 
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-[2] bg-white dark:bg-slate-900 border border-medical-300 rounded px-2 py-1.5 focus:outline-none text-sm"
                        placeholder="Task Title"
                        autoFocus
                      />
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as any)}
                        className="bg-white dark:bg-slate-900 border border-medical-300 rounded px-2 py-1.5 focus:outline-none text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <input 
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-medical-300 rounded px-2 py-1.5 focus:outline-none text-sm"
                      />
                    </div>
                    <textarea 
                        value={editDesc} 
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-medical-300 rounded px-2 py-1.5 focus:outline-none text-sm h-16 resize-none"
                        placeholder="Description..."
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelEdit} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-gray-700 dark:text-gray-300">Cancel</button>
                      <button onClick={() => saveEdit(task.id)} className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded">Save</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span 
                        onClick={() => startEditing(task)}
                        className={`font-medium cursor-text ${
                          task.completed 
                            ? 'text-gray-500 dark:text-gray-500 line-through decoration-gray-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {task.text}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getPriorityColor(task.priority)}`}>
                        {task.priority || 'medium'}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className={`text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-500 dark:text-gray-400'}`}>
                        {task.description}
                      </p>
                    )}

                    {task.dueDate && (
                      <span className={`text-xs mt-1 flex items-center gap-1 ${
                        new Date(task.dueDate) < new Date() && !task.completed ? 'text-red-500 font-bold' : 'text-gray-400'
                      }`}>
                        <Icons.Calendar className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-2 self-start">
                <button 
                  onClick={() => startEditing(task)}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Icons.Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Icons.Delete className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
