
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { StatusBadge, PriorityBadge } from '../components/TerminalUI';
import { KanbanBoard, TaskStatsChart } from '../components/DashboardWidgets';
import { GraphView } from '../components/GraphView';
import { TaskStatus, Role } from '../types';

export const Dashboard: React.FC = () => {
  const { tasks, users, projects, updateTask, currentUser } = useApp();
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'BOARD' | 'GRAPH'>('TABLE');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const isViewer = currentUser?.role === Role.VIEWER;

  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    // Для VIEWER без доступа к проектам - пустой список
    if (isViewer && (!currentUser?.allowedProjects || currentUser.allowedProjects.length === 0)) {
        return [];
    }
    
    if (filterStatus !== 'ALL') {
        result = result.filter(t => t.status === filterStatus);
    }
    
    if (filterProject !== 'ALL') {
        result = result.filter(t => t.projectId === filterProject);
    }

    return result;
  }, [tasks, filterStatus, filterProject, isViewer, currentUser]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterProject]);

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
      <TaskStatsChart tasks={tasks} />

      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg dark:rounded-none shadow-sm overflow-hidden mb-6">
        {/* Toolbar */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-4 flex flex-col xl:flex-row justify-between gap-4 bg-gray-50/50 dark:bg-gray-900/20">
            
            <div className="flex flex-col md:flex-row gap-4">
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

            {/* View Toggle */}
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

        {/* Content View */}
        {viewMode === 'TABLE' && (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 table-fixed">
                    <thead className="bg-gray-50 dark:bg-black">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono w-24">ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono max-w-xs">Directive</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono w-32">Project</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono w-32">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono w-32">Priority</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono w-32">Agent</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono w-32">Deadline</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-600 uppercase tracking-wider font-mono w-32">Completed</th>
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
                            paginatedTasks.map(task => (
                                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group">
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
  );
};
