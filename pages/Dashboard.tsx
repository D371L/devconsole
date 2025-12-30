
import React, { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { StatusBadge, PriorityBadge } from '../components/TerminalUI';
import { KanbanBoard, TaskStatsChart, MetricsWidgets } from '../components/DashboardWidgets';
import { GraphView } from '../components/GraphView';
import { TaskStatus, Role, Priority, Task } from '../types';
import { exportToCSV, exportToJSON, exportToPDF } from '../services/exportService';

type SortField = 'id' | 'title' | 'deadline' | 'completedAt' | 'priority' | 'createdAt' | 'status';
type SortOrder = 'asc' | 'desc';

export const Dashboard: React.FC = () => {
  const { tasks, users, projects, updateTask, currentUser } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>((searchParams.get('status') as TaskStatus | 'ALL') || 'ALL');
  const [filterProject, setFilterProject] = useState<string>(searchParams.get('project') || 'ALL');
  const [filterPriority, setFilterPriority] = useState<Priority | 'ALL'>((searchParams.get('priority') as Priority | 'ALL') || 'ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>(searchParams.get('assignee') || 'ALL');
  const [filterDeadline, setFilterDeadline] = useState<string>(searchParams.get('deadline') || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [sortField, setSortField] = useState<SortField>((searchParams.get('sort') as SortField) || 'createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>((searchParams.get('order') as SortOrder) || 'desc');
  const [viewMode, setViewMode] = useState<'TABLE' | 'BOARD' | 'GRAPH'>('TABLE');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isViewer = currentUser?.role === Role.VIEWER;

  // Function to get field value for sorting
  const getSortValue = (task: Task, field: SortField): string | number => {
    switch (field) {
      case 'id':
        return task.id;
      case 'title':
        return task.title.toLowerCase();
      case 'deadline':
        return task.deadline ? new Date(task.deadline).getTime() : 0;
      case 'completedAt':
        return task.completedAt || 0;
      case 'priority':
        const priorityOrder = { [Priority.LOW]: 1, [Priority.MEDIUM]: 2, [Priority.HIGH]: 3, [Priority.CRITICAL]: 4 };
        return priorityOrder[task.priority] || 0;
      case 'createdAt':
        return task.createdAt;
      case 'status':
        return task.status;
      default:
        return 0;
    }
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    // For VIEWER without project access - empty list
    if (isViewer && (!currentUser?.allowedProjects || currentUser.allowedProjects.length === 0)) {
        return [];
    }
    
    // Search by title and description
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(t => 
            t.title.toLowerCase().includes(query) || 
            (t.description || '').toLowerCase().includes(query)
        );
    }
    
    if (filterStatus !== 'ALL') {
        result = result.filter(t => t.status === filterStatus);
    }
    
    if (filterProject !== 'ALL') {
        result = result.filter(t => t.projectId === filterProject);
    }

    if (filterPriority !== 'ALL') {
        result = result.filter(t => t.priority === filterPriority);
    }

    if (filterAssignee !== 'ALL') {
        result = result.filter(t => t.assignedTo === filterAssignee);
    }

    // Filter by deadline
    if (filterDeadline !== 'ALL') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);

        result = result.filter(t => {
            if (!t.deadline) {
                return filterDeadline === 'NO_DEADLINE';
            }
            const deadline = new Date(t.deadline);
            
            switch (filterDeadline) {
                case 'TODAY':
                    return deadline.toDateString() === today.toDateString();
                case 'THIS_WEEK':
                    return deadline >= today && deadline <= weekFromNow;
                case 'OVERDUE':
                    return deadline < today && t.status !== TaskStatus.DONE;
                case 'NO_DEADLINE':
                    return false;
                default:
                    return true;
            }
        });
    }

    // Sorting
    result = [...result].sort((a, b) => {
        const aValue = getSortValue(a, sortField);
        const bValue = getSortValue(b, sortField);
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder === 'asc' 
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        } else {
            return sortOrder === 'asc'
                ? (aValue as number) - (bValue as number)
                : (bValue as number) - (aValue as number);
        }
    });

    return result;
  }, [tasks, filterStatus, filterProject, filterPriority, filterAssignee, filterDeadline, searchQuery, sortField, sortOrder, isViewer, currentUser]);

  // Update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (filterStatus !== 'ALL') params.set('status', filterStatus);
    if (filterProject !== 'ALL') params.set('project', filterProject);
    if (filterPriority !== 'ALL') params.set('priority', filterPriority);
    if (filterAssignee !== 'ALL') params.set('assignee', filterAssignee);
    if (filterDeadline !== 'ALL') params.set('deadline', filterDeadline);
    if (sortField !== 'createdAt') params.set('sort', sortField);
    if (sortOrder !== 'desc') params.set('order', sortOrder);
    setSearchParams(params, { replace: true });
  }, [searchQuery, filterStatus, filterProject, filterPriority, filterAssignee, filterDeadline, sortField, sortOrder, setSearchParams]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterProject, filterPriority, filterAssignee, filterDeadline, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = useMemo(() => {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTasks, currentPage]);

  const getUserName = (id: string) => users.find(u => u.id === id)?.username || 'Unassigned';
  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || 'Unknown Protocol';

  const handleKanbanStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (isViewer) return;
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
        const updatedTask = { ...task, status: newStatus };
        updateTask(updatedTask);
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight dark:neon-text-main">TASKS</h2>
          <p className="text-gray-500 dark:text-gray-600 text-sm mt-1 font-mono">
             {'>'} SYSTEM STATUS: <span className="text-green-500">OPTIMAL</span>
          </p>
        </div>
        <div className="flex gap-2">
            {!isViewer && (
                <Link to="/create-task" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm dark:bg-transparent dark:border dark:border-neon-main dark:text-neon-main dark:hover:bg-neon-main/20 dark:rounded-none dark:shadow-[0_0_10px_var(--neon-primary)]">
                    + NEW DIRECTIVE
                </Link>
            )}
        </div>
      </header>

      {/* Charts Section */}
      <div className="space-y-6 mb-8">
        <MetricsWidgets tasks={tasks} currentUser={currentUser} />
        <TaskStatsChart tasks={tasks} />
      </div>

      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg dark:rounded-none shadow-sm overflow-hidden mb-6">
        {/* Toolbar */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/20">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tasks..."
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2 pl-10 pr-4 rounded-md dark:rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:border-neon-main"
                    />
                    <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex flex-col md:flex-row gap-4 flex-wrap">
                    {/* Project Filter */}
                    <div className="relative">
                        <select
                            value={filterProject}
                            onChange={(e) => setFilterProject(e.target.value)}
                            className="appearance-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-1.5 pl-3 pr-8 rounded-md dark:rounded-none text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:border-neon-main uppercase tracking-wider"
                        >
                            <option value="ALL">ALL PROJECTS</option>
                            {projects.length === 0 && isViewer ? (
                                <option disabled>No access granted</option>
                            ) : (
                                projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))
                            )}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    {/* Priority Filter */}
                    <div className="relative">
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value as Priority | 'ALL')}
                            className="appearance-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-1.5 pl-3 pr-8 rounded-md dark:rounded-none text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:border-neon-main uppercase tracking-wider"
                        >
                            <option value="ALL">ALL PRIORITIES</option>
                            {Object.values(Priority).map(priority => (
                                <option key={priority} value={priority}>{priority}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    {/* Assignee Filter */}
                    <div className="relative">
                        <select
                            value={filterAssignee}
                            onChange={(e) => setFilterAssignee(e.target.value)}
                            className="appearance-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-1.5 pl-3 pr-8 rounded-md dark:rounded-none text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:border-neon-main uppercase tracking-wider"
                        >
                            <option value="ALL">ALL AGENTS</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.username}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    {/* Deadline Filter */}
                    <div className="relative">
                        <select
                            value={filterDeadline}
                            onChange={(e) => setFilterDeadline(e.target.value)}
                            className="appearance-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-1.5 pl-3 pr-8 rounded-md dark:rounded-none text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:border-neon-main uppercase tracking-wider"
                        >
                            <option value="ALL">ALL DEADLINES</option>
                            <option value="TODAY">TODAY</option>
                            <option value="THIS_WEEK">THIS WEEK</option>
                            <option value="OVERDUE">OVERDUE</option>
                            <option value="NO_DEADLINE">NO DEADLINE</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    {/* Status Filters */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterStatus('ALL')}
                            className={`px-3 py-1.5 rounded-md dark:rounded-none text-xs font-medium transition-colors ${
                                filterStatus === 'ALL' 
                                ? 'bg-white text-gray-900 shadow-sm border border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700' 
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-white dark:hover:bg-transparent'
                            }`}
                        >
                            ALL
                        </button>
                        {Object.values(TaskStatus).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 rounded-md dark:rounded-none text-xs font-medium transition-colors ${
                            filterStatus === status 
                                ? 'bg-white text-gray-900 shadow-sm border border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700' 
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-white dark:hover:bg-transparent'
                            }`}
                        >
                            {status.replace('_', ' ')}
                        </button>
                        ))}
                    </div>
                </div>

            {/* View Toggle and Export */}
            <div className="flex items-center gap-2">
                <div className="relative group">
                    <button
                        disabled={filteredTasks.length === 0}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md dark:rounded-none bg-white dark:bg-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        EXPORT ▼
                    </button>
                    {filteredTasks.length > 0 && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md dark:rounded-none shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                            <button
                                onClick={() => exportToCSV(filteredTasks, getProjectName, getUserName)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                            >
                                CSV
                            </button>
                            <button
                                onClick={() => exportToJSON(filteredTasks)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                            >
                                JSON
                            </button>
                            <button
                                onClick={() => exportToPDF(filteredTasks, getProjectName, getUserName)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                            >
                                PDF
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex rounded-md dark:rounded-none shadow-sm" role="group">
                    <button
                        type="button"
                        onClick={() => setViewMode('TABLE')}
                        className={`px-4 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-l-lg dark:rounded-none ${
                            viewMode === 'TABLE' 
                            ? 'z-10 bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-neon-main dark:border-neon-main' 
                            : 'bg-white text-gray-900 hover:bg-gray-100 dark:bg-black dark:text-gray-400 dark:hover:bg-gray-900'
                        }`}
                    >
                        TABLE
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('BOARD')}
                        className={`px-4 py-1.5 text-xs font-medium border-t border-b border-gray-200 dark:border-gray-700 dark:rounded-none ${
                            viewMode === 'BOARD' 
                            ? 'z-10 bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-neon-main dark:border-neon-main' 
                            : 'bg-white text-gray-900 hover:bg-gray-100 dark:bg-black dark:text-gray-400 dark:hover:bg-gray-900'
                        }`}
                    >
                        BOARD
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('GRAPH')}
                        className={`px-4 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-r-lg dark:rounded-none ${
                            viewMode === 'GRAPH' 
                            ? 'z-10 bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-neon-main dark:border-neon-main' 
                            : 'bg-white text-gray-900 hover:bg-gray-100 dark:bg-black dark:text-gray-400 dark:hover:bg-gray-900'
                        }`}
                    >
                        GRAPH
                    </button>
                </div>
            </div>
        </div>

        {/* Content View */}
        {viewMode === 'TABLE' && (
            <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {paginatedTasks.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-sm font-mono uppercase tracking-widest">
                            Void // No directives found
                        </div>
                    ) : (
                        paginatedTasks.map((task) => (
                            <Link
                                key={task.id}
                                to={`/task/${task.id}`}
                                className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg dark:rounded-none p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-gray-400">{task.id.substring(0, 6)}</span>
                                            <StatusBadge status={task.status} />
                                            <PriorityBadge priority={task.priority} />
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{task.title}</h3>
                                        {task.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500 dark:text-gray-600">
                                    <span className="font-mono">{getProjectName(task.projectId)}</span>
                                    {task.assignedTo && (
                                        <span>• {getUserName(task.assignedTo)}</span>
                                    )}
                                    {task.deadline && (
                                        <span>• {new Date(task.deadline).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 table-fixed">
                    <thead className="bg-gray-50 dark:bg-black">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono w-24">
                                <button onClick={() => handleSort('id')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    ID {getSortIcon('id')}
                                </button>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono max-w-xs">
                                <button onClick={() => handleSort('title')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Directive {getSortIcon('title')}
                                </button>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono w-32">Project</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono w-32">
                                <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Status {getSortIcon('status')}
                                </button>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono w-32">
                                <button onClick={() => handleSort('priority')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Priority {getSortIcon('priority')}
                                </button>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono w-32">Agent</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono w-32">
                                <button onClick={() => handleSort('deadline')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Deadline {getSortIcon('deadline')}
                                </button>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono w-32">
                                <button onClick={() => handleSort('completedAt')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Completed {getSortIcon('completedAt')}
                                </button>
                            </th>
                            <th scope="col" className="relative px-6 py-3 w-20"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-800">
                        {paginatedTasks.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-12 text-center text-gray-500 text-sm font-mono uppercase tracking-widest">
                                    Void // No directives found
                                </td>
                            </tr>
                        ) : (
                            paginatedTasks.map((task, index) => (
                                <tr 
                                    key={task.id} 
                                    draggable={!isViewer}
                                    onDragStart={(e) => {
                                        if (!isViewer) {
                                            setDraggedTaskId(task.id);
                                            e.dataTransfer.effectAllowed = 'move';
                                        }
                                    }}
                                    onDragOver={(e) => {
                                        if (!isViewer && draggedTaskId && draggedTaskId !== task.id) {
                                            e.preventDefault();
                                            setDragOverIndex(index);
                                        }
                                    }}
                                    onDragLeave={() => setDragOverIndex(null)}
                                    onDrop={async (e) => {
                                        e.preventDefault();
                                        if (!isViewer && draggedTaskId && draggedTaskId !== task.id) {
                                            const draggedIndex = paginatedTasks.findIndex(t => t.id === draggedTaskId);
                                            const targetIndex = index;
                                            
                                            // Calculate new order values
                                            const tasksToUpdate: Array<{id: string, order: number}> = [];
                                            const startIdx = Math.min(draggedIndex, targetIndex);
                                            const endIdx = Math.max(draggedIndex, targetIndex);
                                            
                                            if (draggedIndex < targetIndex) {
                                                // Moving down
                                                for (let i = startIdx; i <= endIdx; i++) {
                                                    const t = paginatedTasks[i];
                                                    if (i === draggedIndex) {
                                                        tasksToUpdate.push({ id: t.id, order: paginatedTasks[targetIndex].order || targetIndex });
                                                    } else if (i > draggedIndex && i <= targetIndex) {
                                                        tasksToUpdate.push({ id: t.id, order: (t.order || i) - 1 });
                                                    }
                                                }
                                            } else {
                                                // Moving up
                                                for (let i = startIdx; i <= endIdx; i++) {
                                                    const t = paginatedTasks[i];
                                                    if (i === draggedIndex) {
                                                        tasksToUpdate.push({ id: t.id, order: paginatedTasks[targetIndex].order || targetIndex });
                                                    } else if (i < draggedIndex && i >= targetIndex) {
                                                        tasksToUpdate.push({ id: t.id, order: (t.order || i) + 1 });
                                                    }
                                                }
                                            }
                                            
                                            // Update tasks with new order
                                            for (const update of tasksToUpdate) {
                                                const taskToUpdate = tasks.find(t => t.id === update.id);
                                                if (taskToUpdate) {
                                                    await updateTask({ ...taskToUpdate, order: update.order });
                                                }
                                            }
                                            
                                            setDraggedTaskId(null);
                                            setDragOverIndex(null);
                                        }
                                    }}
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group ${
                                        !isViewer ? 'cursor-move' : ''
                                    } ${
                                        dragOverIndex === index ? 'bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-500 dark:border-neon-cyan' : ''
                                    } ${
                                        draggedTaskId === task.id ? 'opacity-50' : ''
                                    }`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-600 font-mono">
                                        #{task.id}
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200 dark:group-hover:text-neon-main transition-colors truncate" title={task.title}>{task.title}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-600 truncate" title={task.description || ''}>{task.description || ''}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-xs font-bold text-gray-600 dark:text-gray-400 font-mono">
                                            {getProjectName(task.projectId)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={task.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <PriorityBadge priority={task.priority} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="text-sm text-gray-900 dark:text-gray-400 font-mono">{getUserName(task.assignedTo || '')}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-600 font-mono">
                                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-600 font-mono">
                                        {task.completedAt ? (() => {
                                            const timestamp = typeof task.completedAt === 'string' ? parseInt(task.completedAt, 10) : task.completedAt;
                                            if (isNaN(timestamp) || timestamp <= 0) return '-';
                                            const date = new Date(timestamp);
                                            return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
                                        })() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link to={`/task/${task.id}`} className="text-blue-600 hover:text-blue-900 font-semibold text-xs border border-blue-100 hover:border-blue-300 px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-all dark:bg-transparent dark:border-gray-700 dark:text-gray-400 dark:hover:border-neon-main dark:hover:text-neon-main dark:rounded-none">
                                            VIEW
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                </div>
            </>
        )}
        
        {viewMode === 'BOARD' && (
            <div className="p-4 bg-gray-50 dark:bg-black/50">
                <KanbanBoard tasks={paginatedTasks} users={users} projects={projects} onStatusChange={handleKanbanStatusChange} readOnly={isViewer} />
            </div>
        )}

        {viewMode === 'GRAPH' && (
            <div className="p-4 bg-gray-50 dark:bg-black/50">
                <GraphView tasks={tasks} users={users} />
            </div>
        )}

        {/* Pagination Controls */}
        {filteredTasks.length > 0 && viewMode === 'TABLE' && (
             <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black flex items-center justify-between sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs text-gray-700 dark:text-gray-500 font-mono">
                            Showing <span className="font-medium text-gray-900 dark:text-gray-300">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-gray-900 dark:text-gray-300">{Math.min(currentPage * ITEMS_PER_PAGE, filteredTasks.length)}</span> of <span className="font-medium text-gray-900 dark:text-gray-300">{filteredTasks.length}</span> results
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md dark:rounded-none border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="sr-only">Previous</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                            
                            {/* Simple Page Indicator */}
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">
                                PG {currentPage} / {totalPages || 1}
                            </span>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md dark:rounded-none border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="sr-only">Next</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
                 {/* Mobile Pagination */}
                 <div className="flex sm:hidden justify-between w-full">
                     <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md dark:rounded-none text-gray-700 dark:text-gray-300 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
                     >
                         PREV
                     </button>
                      <span className="relative inline-flex items-center px-2 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">
                                {currentPage}/{totalPages}
                      </span>
                     <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md dark:rounded-none text-gray-700 dark:text-gray-300 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
                     >
                         NEXT
                     </button>
                 </div>
            </div>
        )}
      </div>
    </div>
    </div>
  );
};
