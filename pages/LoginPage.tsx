
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TerminalButton, TerminalCard, TerminalInput } from '../components/TerminalUI';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/dashboard');
    } else {
      setError('ACCESS DENIED: Invalid Identity or Key');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration for Dark Mode */}
      <div className="hidden dark:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/20 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2 dark:neon-text-cyan">DEV_CONSOLE</h1>
            <p className="text-gray-500 text-sm dark:text-gray-400 dark:tracking-[0.3em]">SECURE ACCESS PORTAL</p>
        </div>

        <TerminalCard className="shadow-lg border-gray-200 dark:border-gray-800 dark:bg-black/60 dark:backdrop-blur-md">
          <form onSubmit={handleLogin} className="space-y-6 py-2">
            
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-600 mb-1">Identity</label>
              <TerminalInput 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                autoFocus
                className="text-lg text-center"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-600 mb-1">Secret Key</label>
              <TerminalInput 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="text-lg text-center"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm text-center dark:bg-red-900/20 dark:border-red-900 dark:text-red-500 dark:rounded-none font-mono animate-pulse">
                {error}
              </div>
            )}

            <TerminalButton type="submit" className="w-full" variant="primary">
              CONNECT
            </TerminalButton>
            
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-600">AUTHORIZED PERSONNEL ONLY</p>
            </div>
          </form>
        </TerminalCard>
      </div>
    </div>
  );
};
