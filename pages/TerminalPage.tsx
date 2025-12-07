
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TerminalInput } from '../components/TerminalUI';
import { chatWithSystem } from '../services/geminiService';
import { SoundService } from '../services/soundService';

interface Log {
    type: 'input' | 'output' | 'system';
    text: string;
}

export const TerminalPage: React.FC = () => {
    const { tasks, currentUser } = useApp();
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState<Log[]>([
        { type: 'system', text: 'CORE_SYSTEM_ONLINE v2.1.4' },
        { type: 'system', text: 'CONNECTED AS: ' + (currentUser?.username || 'GUEST') },
        { type: 'system', text: 'Type "help" for commands or ask a question.' }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const cmd = input.trim();
        setLogs(prev => [...prev, { type: 'input', text: cmd }]);
        setInput('');
        setIsProcessing(true);
        SoundService.playClick();

        // Basic Commands
        if (cmd === 'clear') {
            setLogs([]);
            setIsProcessing(false);
            return;
        }
        if (cmd === 'help') {
            setTimeout(() => {
                setLogs(prev => [...prev, { type: 'output', text: 'AVAILABLE COMMANDS:\n- list: Show active tasks\n- clear: Clear screen\n- query <text>: Ask AI about tasks or coding' }]);
                setIsProcessing(false);
                SoundService.playSuccess();
            }, 500);
            return;
        }
        if (cmd === 'list') {
            const taskList = tasks.slice(0, 5).map(t => `[${t.status}] ${t.title}`).join('\n');
            setTimeout(() => {
                setLogs(prev => [...prev, { type: 'output', text: taskList || 'No active tasks.' }]);
                setIsProcessing(false);
                SoundService.playSuccess();
            }, 500);
            return;
        }

        // AI Query
        const context = tasks.map(t => `${t.title} (${t.status})`).join(', ');
        try {
            const response = await chatWithSystem(cmd, context);
            setLogs(prev => [...prev, { type: 'output', text: response }]);
            SoundService.playNotification();
        } catch (err) {
            setLogs(prev => [...prev, { type: 'output', text: 'ERR: NETWORK_FAILURE' }]);
            SoundService.playError();
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-4 animate-fade-in font-mono text-sm md:text-base">
            <h2 className="text-xl font-bold text-neon-main mb-4 border-b border-gray-800 pb-2">
                // NEURAL_LINK_TERMINAL
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
                {logs.map((log, i) => (
                    <div key={i} className={`${
                        log.type === 'input' ? 'text-white' : 
                        log.type === 'system' ? 'text-gray-500' : 
                        'text-neon-main'
                    }`}>
                        {log.type === 'input' ? '> ' : ''}
                        {log.text.split('\n').map((line, idx) => <div key={idx}>{line}</div>)}
                    </div>
                ))}
                {isProcessing && <div className="text-neon-main animate-pulse">PROCESSING...</div>}
                <div ref={bottomRef}></div>
            </div>

            <form onSubmit={handleCommand} className="relative">
                <span className="absolute left-3 top-2 text-neon-main">{'>'}</span>
                <input 
                    className="w-full bg-gray-900 border border-gray-700 text-white font-mono p-2 pl-8 rounded focus:outline-none focus:border-neon-main focus:ring-1 focus:ring-neon-main transition-colors"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Enter command..."
                    autoFocus
                    disabled={isProcessing}
                />
            </form>
        </div>
    );
};
