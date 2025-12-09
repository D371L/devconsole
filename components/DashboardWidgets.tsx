
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Task, TaskStatus, Priority, User, Project } from '../types';
import { StatusBadge, PriorityBadge } from './TerminalUI';

// --- Kanban Board Component ---
export const KanbanBoard: React.FC<{ 
    tasks: Task[], 
    users: User[],
    projects?: Project[],
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void,
    readOnly?: boolean
}> = ({ tasks, users, projects = [], onStatusChange, readOnly = false }) => {
    const columns = Object.values(TaskStatus);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

    const getUser = (id: string) => users.find(u => u.id === id);
    const getProject = (id: string) => projects.find(p => p.id === id);

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        if (readOnly) {
            e.preventDefault();
            return;
        }
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('text/plain', taskId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (readOnly) return;
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
        if (readOnly) return;
        e.preventDefault();
        const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
        
        if (taskId) {
            onStatusChange(taskId, status);
        }
        setDraggedTaskId(null);
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-250px)]">
            {columns.map(status => {
                const columnTasks = tasks.filter(t => t.status === status);
                const isDragActive = draggedTaskId !== null;

                return (
                    <div 
                        key={status} 
                        className="flex-none w-72 flex flex-col"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status)}
                    >
                         <div className="font-bold text-xs uppercase text-gray-500 dark:text-gray-400 mb-3 flex justify-between items-center px-2">
                             <span>{status.replace('_', ' ')}</span>
                             <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded px-1.5">{columnTasks.length}</span>
                         </div>
                         
                         {/* Droppable Area */}
                         <div className={`flex-1 rounded-lg dark:rounded-none p-2 space-y-3 overflow-y-auto transition-all duration-200 border-2
                             ${isDragActive && !readOnly
                                ? 'bg-blue-50/50 dark:bg-gray-900/50 border-dashed border-blue-200 dark:border-gray-700' 
                                : 'bg-gray-100/50 dark:bg-gray-900/30 border-transparent'}
                         `}>
                             {columnTasks.map(task => {
                                 const project = getProject(task.projectId);
                                 const assignee = getUser(task.assignedTo || '');
                                 return (
                                 <div
                                    key={task.id}
                                    draggable={!readOnly}
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    className={`${!readOnly ? 'cursor-grab active:cursor-grabbing transform transition-transform active:scale-[0.98]' : 'cursor-default'}`}
                                 >
                                     <Link 
                                        to={`/task/${task.id}`} 
                                        draggable={false} // Prevent native link dragging
                                        className="block bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-3 rounded shadow-sm hover:shadow-md dark:hover:border-neon-cyan transition-all group select-none relative"
                                     >
                                         <div className="flex justify-between items-start mb-2">
                                             <span className="text-[10px] font-mono text-gray-400">#{task.id}</span>
                                             <PriorityBadge priority={task.priority} />
                                         </div>
                                         <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 group-hover:text-blue-600 dark:group-hover:text-neon-cyan">{task.title}</h4>
                                         
                                         {/* Project Badge */}
                                         {project && (
                                             <div className="mb-2">
                                                 <span 
                                                    className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded dark:rounded-none border"
                                                    style={{ 
                                                        borderColor: project.color, 
                                                        color: project.color,
                                                        backgroundColor: `${project.color}10`
                                                    }}
                                                 >
                                                     {project.name}
                                                 </span>
                                             </div>
                                         )}

                                         <div className="flex items-center justify-between mt-3">
                                             <div className="flex -space-x-2">
                                                {assignee ? (
                                                    <img 
                                                        src={assignee.avatar} 
                                                        alt={assignee.username}
                                                        className="w-6 h-6 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                                                        style={{ imageRendering: 'pixelated' }}
                                                        title={assignee.username}
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full dark:rounded-none bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] text-gray-400">
                                                        -
                                                    </div>
                                                )}
                                             </div>
                                             <span className="text-[10px] text-gray-400 font-mono">
                                                 {task.comments.length > 0 ? `${task.comments.length} comms` : ''}
                                             </span>
                                         </div>
                                     </Link>
                                 </div>
                             )})}
                             {/* Placeholder for empty columns when dragging */}
                             {columnTasks.length === 0 && isDragActive && !readOnly && (
                                 <div className="h-20 flex items-center justify-center text-xs text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded opacity-50">
                                     [ DROP ZONE ]
                                 </div>
                             )}
                         </div>
                    </div>
                )
            })}
        </div>
    );
};

// --- Task Statistics Chart Component ---
export const TaskStatsChart: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const total = tasks.length;
    if (total === 0) return null;

    const stats = {
        [TaskStatus.TODO]: tasks.filter(t => t.status === TaskStatus.TODO).length,
        [TaskStatus.IN_PROGRESS]: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
        [TaskStatus.REVIEW]: tasks.filter(t => t.status === TaskStatus.REVIEW).length,
        [TaskStatus.DONE]: tasks.filter(t => t.status === TaskStatus.DONE).length,
        [TaskStatus.BLOCKED]: tasks.filter(t => t.status === TaskStatus.BLOCKED).length,
    };

    const getPercent = (count: number) => (count / total) * 100;

    return (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-6 rounded-lg dark:rounded-none shadow-sm mb-8">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider mb-4">Task Distribution Protocol</h3>
            
            <div className="flex h-4 bg-gray-100 dark:bg-gray-900 rounded-full dark:rounded-none overflow-hidden mb-4">
                <div style={{ width: `${getPercent(stats.TODO)}%` }} className="bg-gray-400 transition-all duration-500" title="TODO"></div>
                <div style={{ width: `${getPercent(stats.IN_PROGRESS)}%` }} className="bg-blue-500 dark:bg-neon-cyan transition-all duration-500" title="IN PROGRESS"></div>
                <div style={{ width: `${getPercent(stats.REVIEW)}%` }} className="bg-purple-500 dark:bg-neon-purple transition-all duration-500" title="REVIEW"></div>
                <div style={{ width: `${getPercent(stats.DONE)}%` }} className="bg-green-500 dark:bg-neon-green transition-all duration-500" title="DONE"></div>
                <div style={{ width: `${getPercent(stats.BLOCKED)}%` }} className="bg-red-500 transition-all duration-500" title="BLOCKED"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                {Object.entries(stats).map(([status, count]) => (
                    <div key={status} className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-600 font-mono mb-1">{status.replace('_', ' ')}</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-200">{count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Metrics Widgets Component ---
export const MetricsWidgets: React.FC<{ tasks: Task[], currentUser: User | null }> = ({ tasks, currentUser }) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    // Active tasks (in progress)
    const activeTasks = tasks.filter(t => 
        t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.REVIEW
    ).length;

    // Time spent today (in hours)
    const timeToday = tasks.reduce((total, task) => {
        if (task.timerStartedAt) {
            const startTime = typeof task.timerStartedAt === 'string' ? parseInt(task.timerStartedAt, 10) : task.timerStartedAt;
            const startDate = new Date(startTime);
            if (startDate.toDateString() === today.toDateString()) {
                const elapsed = (Date.now() - startTime) / 1000;
                return total + (task.timeSpent || 0) + elapsed;
            }
        }
        return total + (task.timeSpent || 0);
    }, 0);
    const hoursToday = Math.floor(timeToday / 3600);

    // Upcoming deadlines (next 7 days)
    const upcomingDeadlines = tasks.filter(t => {
        if (!t.deadline || t.status === TaskStatus.DONE) return false;
        const deadline = new Date(t.deadline);
        return deadline >= today && deadline <= weekFromNow;
    }).length;

    // Overdue tasks
    const overdueTasks = tasks.filter(t => {
        if (!t.deadline || t.status === TaskStatus.DONE) return false;
        return new Date(t.deadline) < today;
    }).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-4 rounded-lg dark:rounded-none shadow-sm">
                <div className="text-xs text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono mb-1">Active Tasks</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-200">{activeTasks}</div>
                <div className="text-xs text-gray-400 dark:text-gray-600 mt-1">In progress or review</div>
            </div>
            
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-4 rounded-lg dark:rounded-none shadow-sm">
                <div className="text-xs text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono mb-1">Time Today</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-neon-cyan">{hoursToday}h</div>
                <div className="text-xs text-gray-400 dark:text-gray-600 mt-1">Hours tracked</div>
            </div>
            
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-4 rounded-lg dark:rounded-none shadow-sm">
                <div className="text-xs text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono mb-1">Upcoming</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-neon-purple">{upcomingDeadlines}</div>
                <div className="text-xs text-gray-400 dark:text-gray-600 mt-1">Deadlines this week</div>
            </div>
            
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-4 rounded-lg dark:rounded-none shadow-sm">
                <div className="text-xs text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono mb-1">Overdue</div>
                <div className={`text-2xl font-bold ${overdueTasks > 0 ? 'text-red-600' : 'text-gray-400 dark:text-gray-600'}`}>{overdueTasks}</div>
                <div className="text-xs text-gray-400 dark:text-gray-600 mt-1">Past deadline</div>
            </div>
        </div>
    );
};

// --- Calendar Widget Component ---
export const CalendarWidget: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    const getTasksForDate = (date: Date | null) => {
        if (!date) return [];
        return tasks.filter(t => {
            if (!t.deadline) return false;
            const deadline = new Date(t.deadline);
            return deadline.toDateString() === date.toDateString();
        });
    };

    const navigateMonth = (direction: number) => {
        setCurrentDate(new Date(year, month + direction, 1));
        setSelectedDate(null);
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-4 rounded-lg dark:rounded-none shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => navigateMonth(-1)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    ←
                </button>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                    {monthNames[month]} {year}
                </h3>
                <button onClick={() => navigateMonth(1)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    →
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                    <div key={day} className="text-center text-xs font-bold text-gray-500 dark:text-gray-600 py-1">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((date, idx) => {
                    const tasksForDate = date ? getTasksForDate(date) : [];
                    const isToday = date && date.toDateString() === new Date().toDateString();
                    const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();

                    return (
                        <div
                            key={idx}
                            onClick={() => date && setSelectedDate(date)}
                            className={`
                                aspect-square p-1 text-xs cursor-pointer rounded dark:rounded-none
                                ${!date ? 'bg-transparent' : ''}
                                ${date && isToday ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-neon-cyan' : ''}
                                ${date && isSelected && !isToday ? 'bg-gray-200 dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-600' : ''}
                                ${date && !isToday && !isSelected ? 'hover:bg-gray-100 dark:hover:bg-gray-900 border border-transparent hover:border-gray-300 dark:hover:border-gray-700' : ''}
                            `}
                        >
                            {date && (
                                <>
                                    <div className="text-center font-mono mb-1">
                                        {date.getDate()}
                                    </div>
                                    {tasksForDate.length > 0 && (
                                        <div className="flex justify-center gap-0.5">
                                            {tasksForDate.slice(0, 3).map((task, i) => (
                                                <div
                                                    key={task.id}
                                                    className="w-1 h-1 rounded-full"
                                                    style={{
                                                        backgroundColor: task.priority === Priority.CRITICAL ? '#ef4444' :
                                                                       task.priority === Priority.HIGH ? '#f59e0b' :
                                                                       task.priority === Priority.MEDIUM ? '#3b82f6' : '#6b7280'
                                                    }}
                                                    title={task.title}
                                                />
                                            ))}
                                            {tasksForDate.length > 3 && (
                                                <span className="text-[8px] text-gray-400">+{tasksForDate.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedDate && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-600 uppercase tracking-wider mb-2">
                        {selectedDate.toLocaleDateString()}
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {getTasksForDate(selectedDate).length === 0 ? (
                            <div className="text-xs text-gray-400 italic">No deadlines</div>
                        ) : (
                            getTasksForDate(selectedDate).map(task => (
                                <div key={task.id} className="text-xs text-gray-700 dark:text-gray-300">
                                    • {task.title}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
