
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Role } from '../types';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toggleTheme, toggleSound, toggleSnakeMode, toggleDigitalRainMode, logout, currentUser } = useApp();

  // Toggle with Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setQuery('');
        setActiveIndex(0);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const actions = [
    { id: 'home', label: 'Go to Dashboard', icon: '⚡', action: () => navigate('/dashboard') },
    // Only allow task creation for non-viewers
    ...(currentUser?.role !== Role.VIEWER ? [{ id: 'new-task', label: 'Create New Directive', icon: '+', action: () => navigate('/create-task') }] : []),
    { id: 'terminal', label: 'Launch AI Terminal', icon: '>', action: () => navigate('/terminal') },
    { id: 'snippets', label: 'Open Code Vault', icon: '{}', action: () => navigate('/snippets') },
    { id: 'logs', label: 'View System Logs', icon: '≣', action: () => navigate('/logs') },
    { id: 'theme', label: 'Toggle System Theme', icon: '◐', action: () => toggleTheme() },
    { id: 'sound', label: 'Toggle Sound FX', icon: '🔊', action: () => toggleSound() },
    { id: 'matrix', label: 'Toggle Matrix Rain', icon: '🌧', action: () => toggleDigitalRainMode() },
    { id: 'snake', label: 'run protocol_snake', icon: '🐍', action: () => toggleSnakeMode() },
    ...(currentUser?.role === Role.ADMIN ? [{ id: 'admin', label: 'Admin Panel', icon: '🛡', action: () => navigate('/admin') }] : []),
    { id: 'logout', label: 'Disconnect (Logout)', icon: '✖', action: () => logout() },
  ];

  const filteredActions = actions.filter(action => 
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  const execute = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[activeIndex]) {
        execute(filteredActions[activeIndex].action);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
      
      <div className="w-full max-w-lg bg-white dark:bg-black border border-gray-200 dark:border-neon-main shadow-2xl rounded-lg dark:rounded-none overflow-hidden relative z-10 animate-fade-in ring-1 ring-black/5">
        <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-4 py-3">
          <span className="text-gray-400 dark:text-neon-main mr-3 font-mono">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400 font-mono"
            placeholder="Type a command..."
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleListKeyDown}
          />
          <div className="text-xs text-gray-400 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded dark:rounded-none">ESC</div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
             <div className="p-4 text-center text-gray-500 font-mono text-sm">No commands found.</div>
          ) : (
             filteredActions.map((action, index) => (
                <button
                  key={action.id}
                  onClick={() => execute(action.action)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`w-full text-left flex items-center px-4 py-3 rounded-md dark:rounded-none transition-colors duration-100 ${
                    index === activeIndex 
                      ? 'bg-blue-50 text-blue-700 dark:bg-gray-900 dark:text-neon-main' 
                      : 'text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  <span className="w-6 text-center mr-3 opacity-70 font-mono">{action.icon}</span>
                  <span className="flex-1 font-medium">{action.label}</span>
                  {index === activeIndex && (
                     <span className="text-xs opacity-50 font-mono">↵</span>
                  )}
                </button>
             ))
          )}
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-[10px] text-gray-400 font-mono uppercase">
             <span>DevConsole Command Line</span>
             <span>v2.1</span>
        </div>
      </div>
    </div>
  );
};
