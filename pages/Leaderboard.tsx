
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TerminalCard, TerminalButton } from '../components/TerminalUI';
import { getLevelInfo, ACHIEVEMENTS, LEVEL_TITLES } from '../constants';
import { User, Task, TaskStatus } from '../types';

export const Leaderboard: React.FC = () => {
    const { users, tasks } = useApp();
    const [showLevelsModal, setShowLevelsModal] = useState(false);

    const getStats = (userId: string) => {
        const userTasks = tasks.filter(t => t.assignedTo === userId);
        const completed = userTasks.filter(t => t.status === TaskStatus.DONE).length;
        const totalTime = userTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
        return { completed, totalTime };
    };

    const sortedUsers = [...users].sort((a, b) => b.xp - a.xp);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        return `${h}h ${Math.floor((seconds % 3600) / 60)}m`;
    };

    return (
        <div className="animate-fade-in pb-10 relative">
            
            {/* Levels Modal */}
            {showLevelsModal && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowLevelsModal(false)}>
                    <div className="bg-white dark:bg-black w-full max-w-4xl max-h-[80vh] border-2 border-neon-purple shadow-[0_0_30px_rgba(189,0,255,0.3)] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                            <h3 className="text-xl font-bold dark:neon-text-purple">PROGRESSION_TREE</h3>
                            <button onClick={() => setShowLevelsModal(false)} className="text-2xl hover:text-red-500">&times;</button>
                        </div>
                        <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 custom-scrollbar">
                            {LEVEL_TITLES.map((title, index) => (
                                <div key={index} className={`p-2 border rounded dark:rounded-none flex items-center gap-2 ${
                                    index + 1 > 95 ? 'border-neon-cyan bg-neon-cyan/10' : 
                                    index + 1 > 50 ? 'border-gray-700 bg-gray-900/50' : 
                                    'border-gray-800'
                                }`}>
                                    <div className={`w-8 h-8 flex items-center justify-center font-mono font-bold text-sm ${
                                        index + 1 > 95 ? 'text-neon-cyan' : 'text-gray-500'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div className={`text-xs uppercase font-bold truncate ${
                                         index + 1 > 95 ? 'text-white' : 'text-gray-400'
                                    }`}>
                                        {title}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900 text-center text-[10px] text-gray-500 font-mono uppercase">
                            Max Level: 100 // XP Required for Max: 50,000
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white dark:neon-text-purple tracking-tight">HALL_OF_FAME</h2>
                <TerminalButton variant="ghost" onClick={() => setShowLevelsModal(true)} className="border border-purple-500/30 text-purple-500 hover:bg-purple-500/10">
                    VIEW RANK LIST
                </TerminalButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top 3 Podium (Visual only for larger screens) */}
                <div className="lg:col-span-3 mb-4 hidden md:flex justify-center items-end gap-4 h-64">
                    {sortedUsers[1] && (
                        <div className="w-1/4 h-2/3 bg-gray-100 dark:bg-gray-900 border-t border-l border-r border-gray-200 dark:border-gray-800 relative flex flex-col items-center justify-end pb-4">
                            <div className="absolute -top-12 flex flex-col items-center">
                                <img src={sortedUsers[1].avatar} className="w-16 h-16 rounded-full dark:rounded-none border-2 border-gray-300 dark:border-gray-600" style={{ imageRendering: 'pixelated' }} />
                                <span className="text-sm font-bold mt-2 dark:text-gray-300">{sortedUsers[1].username}</span>
                                <span className="text-xs text-gray-500">{Math.floor(sortedUsers[1].xp)} XP</span>
                            </div>
                            <div className="text-4xl font-bold text-gray-300 dark:text-gray-700">2</div>
                        </div>
                    )}
                    {sortedUsers[0] && (
                        <div className="w-1/4 h-full bg-blue-50 dark:bg-gray-800 border-t border-l border-r border-blue-200 dark:border-neon-cyan/30 relative flex flex-col items-center justify-end pb-4 shadow-lg z-10">
                            <div className="absolute -top-16 flex flex-col items-center">
                                <span className="text-2xl mb-2">👑</span>
                                <img src={sortedUsers[0].avatar} className="w-20 h-20 rounded-full dark:rounded-none border-4 border-yellow-400 dark:border-neon-cyan" style={{ imageRendering: 'pixelated' }} />
                                <span className="text-lg font-bold mt-2 dark:text-neon-cyan">{sortedUsers[0].username}</span>
                                <span className="text-sm text-blue-600 dark:text-neon-green font-mono">{Math.floor(sortedUsers[0].xp)} XP</span>
                            </div>
                            <div className="text-6xl font-bold text-blue-200 dark:text-gray-700">1</div>
                        </div>
                    )}
                     {sortedUsers[2] && (
                        <div className="w-1/4 h-1/2 bg-gray-100 dark:bg-gray-900 border-t border-l border-r border-gray-200 dark:border-gray-800 relative flex flex-col items-center justify-end pb-4">
                            <div className="absolute -top-12 flex flex-col items-center">
                                <img src={sortedUsers[2].avatar} className="w-14 h-14 rounded-full dark:rounded-none border-2 border-gray-300 dark:border-gray-600" style={{ imageRendering: 'pixelated' }} />
                                <span className="text-sm font-bold mt-2 dark:text-gray-300">{sortedUsers[2].username}</span>
                                <span className="text-xs text-gray-500">{Math.floor(sortedUsers[2].xp)} XP</span>
                            </div>
                            <div className="text-4xl font-bold text-gray-300 dark:text-gray-700">3</div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-4">
                    {sortedUsers.map((user, idx) => {
                        const level = getLevelInfo(user.xp);
                        const stats = getStats(user.id);
                        
                        return (
                            <TerminalCard key={user.id} className="flex flex-col md:flex-row items-center gap-6" neonColor={idx === 0 ? 'cyan' : 'purple'}>
                                <div className="text-2xl font-bold font-mono text-gray-300 dark:text-gray-700 w-8 text-center">
                                    #{idx + 1}
                                </div>
                                
                                <img src={user.avatar} alt={user.username} className="w-16 h-16 rounded-full dark:rounded-none border-2 border-gray-200 dark:border-gray-700" style={{ imageRendering: 'pixelated' }} />
                                
                                <div className="flex-1 text-center md:text-left">
                                    <div className="text-xl font-bold text-gray-900 dark:text-white">{user.username}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-1">
                                        LVL {level.level} // {level.title}
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full dark:rounded-none overflow-hidden">
                                        <div className="bg-blue-500 dark:bg-neon-purple h-full" style={{ width: `${level.progress}%` }}></div>
                                    </div>
                                </div>

                                <div className="flex gap-8 text-center">
                                    <div>
                                        <div className="text-xs text-gray-500 font-mono">TASKS</div>
                                        <div className="text-lg font-bold dark:text-gray-200">{stats.completed}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 font-mono">HOURS</div>
                                        <div className="text-lg font-bold dark:text-gray-200">{formatTime(stats.totalTime).split(' ')[0]}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 font-mono">XP</div>
                                        <div className="text-lg font-bold text-blue-600 dark:text-neon-cyan">{Math.floor(user.xp)}</div>
                                    </div>
                                </div>
                            </TerminalCard>
                        );
                    })}
                </div>

                <div className="space-y-6">
                     <TerminalCard title="SYSTEM_ACHIEVEMENTS" neonColor="green">
                         <div className="space-y-4">
                             {ACHIEVEMENTS.map(ach => (
                                 <div key={ach.id} className="flex gap-4 items-start p-3 bg-gray-50 dark:bg-gray-900/30 rounded dark:rounded-none border border-transparent dark:border-gray-800">
                                     <div className="text-3xl bg-white dark:bg-black p-2 rounded shadow-sm">
                                         {ach.icon}
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-sm text-gray-900 dark:text-gray-200">{ach.title}</h4>
                                         <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{ach.description}</p>
                                         <span className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-neon-green px-2 py-0.5 rounded dark:rounded-none font-bold">
                                             +{ach.xpBonus} XP
                                         </span>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </TerminalCard>
                </div>
            </div>
        </div>
    );
};
