
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { TerminalCard, TerminalInput } from '../components/TerminalUI';

export const SystemLogs: React.FC = () => {
    const { tasks, users } = useApp();
    const [filter, setFilter] = useState('');

    const allLogs = useMemo(() => {
        // Aggregate all logs from all tasks
        const logs = tasks.flatMap(task => {
            // Обрабатываем случаи когда activityLog может быть null, undefined, или не массивом
            const activityLog = Array.isArray(task.activityLog) ? task.activityLog : [];
            return activityLog.map(log => ({
                ...log,
                taskTitle: task.title,
                taskId: task.id
            }));
        });
        // Sort by timestamp descending (newest first)
        return logs.sort((a, b) => b.timestamp - a.timestamp);
    }, [tasks]);

    const filteredLogs = allLogs.filter(log => 
        log.action.toLowerCase().includes(filter.toLowerCase()) ||
        log.taskTitle.toLowerCase().includes(filter.toLowerCase()) ||
        log.userId.toLowerCase().includes(filter.toLowerCase())
    );

    const getUserName = (id: string) => users.find(u => u.id === id)?.username || 'SYSTEM';

    return (
        <div className="animate-fade-in pb-10 h-full flex flex-col">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white dark:neon-text-main tracking-tight">SYSTEM_LOGS</h2>
                    <p className="text-xs text-gray-500 font-mono mt-1">/var/log/sys_activity.log</p>
                </div>
                <div className="w-64">
                    <TerminalInput 
                        placeholder="Grep logs..." 
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="text-xs"
                    />
                </div>
            </div>

            <TerminalCard className="flex-1 overflow-hidden flex flex-col p-0" neonColor="cyan">
                <div className="bg-gray-100 dark:bg-gray-900 p-2 flex justify-between text-xs font-bold text-gray-500 border-b border-gray-200 dark:border-gray-800 font-mono uppercase">
                    <span className="w-32">Timestamp</span>
                    <span className="w-24">User</span>
                    <span className="w-24">Ref ID</span>
                    <span className="flex-1">Event Details</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 font-mono text-xs custom-scrollbar bg-white dark:bg-black">
                    {filteredLogs.length === 0 ? (
                        <div className="text-gray-400 text-center py-10">-- NO ENTRIES FOUND --</div>
                    ) : (
                        filteredLogs.map(log => (
                            <div key={log.id} className="flex gap-4 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-900/50 border-b border-dashed border-gray-100 dark:border-gray-900 transition-colors">
                                <span className="w-32 text-gray-400 shrink-0">
                                    {new Date(log.timestamp).toISOString().split('T')[0]} <span className="text-gray-500 dark:text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </span>
                                <span className={`w-24 shrink-0 font-bold ${log.userId === 'system' ? 'text-purple-500' : 'text-blue-600 dark:text-neon-cyan'}`}>
                                    {getUserName(log.userId)}
                                </span>
                                <span className="w-24 shrink-0 text-gray-400">
                                    #{log.taskId}
                                </span>
                                <span className="flex-1 text-gray-800 dark:text-gray-300 truncate">
                                    <span className="text-gray-400 dark:text-gray-600 mr-2">[{log.taskTitle}]</span>
                                    {log.action}
                                </span>
                            </div>
                        ))
                    )}
                </div>
                <div className="bg-gray-100 dark:bg-gray-900 p-1 text-[10px] text-right text-gray-400 font-mono">
                    TOTAL RECORDS: {allLogs.length} | FILTERED: {filteredLogs.length}
                </div>
            </TerminalCard>
        </div>
    );
};
