
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp, AccentColor } from '../context/AppContext';
import { Role } from '../types';
import { getLevelInfo } from '../constants';
import { CommandPalette } from './CommandPalette';
import { SnakeGame } from './SnakeGame';
import { DigitalRain } from './DigitalRain';
import { SoundService } from '../services/soundService';

const COLOR_MAP: Record<AccentColor, string> = {
    cyan: '#00f3ff',
    purple: '#bd00ff',
    green: '#00ff00',
    amber: '#ffbf00',
    pink: '#ff0055'
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
      currentUser, logout, theme, toggleTheme, 
      soundEnabled, toggleSound, accentColor, setAccentColor,
      digitalRainMode, toggleDigitalRainMode
  } = useApp();
  const location = useLocation();
  
  const [mem, setMem] = useState(0);
  const [temp, setTemp] = useState(42); 
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    // Initial random value for effect
    setMem(Math.floor(Math.random() * 200) + 100);

    const interval = setInterval(() => {
      // MEMORY LOGIC
      // Try to get real JS Heap usage (Chrome/Edge only)
      // Note: Browsers sandbox hardware access, so we can only see tab memory, not system RAM.
      if ((performance as any).memory) {
          const usedBytes = (performance as any).memory.usedJSHeapSize;
          // Convert bytes to MB
          setMem(Math.floor(usedBytes / 1048576)); 
      } else {
          // Fallback simulation for Firefox/Safari which don't support performance.memory
          setMem(prev => {
              const fluctuation = Math.floor(Math.random() * 20) - 10;
              return Math.max(100, prev + fluctuation);
          });
      }

      // CPU TEMP LOGIC (Simulation)
      // Browsers do not provide access to hardware thermal sensors.
      setTemp(prev => {
          const fluctuation = Math.floor(Math.random() * 3) - 1;
          return Math.max(35, Math.min(85, prev + fluctuation));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const levelInfo = currentUser ? getLevelInfo(currentUser.xp) : null;

  const NavItem = ({ to, label, exact = false }: { to: string, label: string, exact?: boolean }) => {
    const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        onMouseEnter={() => SoundService.playHover()}
        onClick={() => SoundService.playClick()}
        className={`block py-2 px-3 mb-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center group ${
          isActive 
            ? 'bg-blue-50 text-blue-700 dark:bg-gray-900 dark:text-neon-main dark:border-l-2 dark:border-neon-main dark:rounded-none' 
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-500 dark:hover:text-neon-main dark:hover:bg-transparent'
        }`}
      >
        <span className={`mr-2 font-mono ${
            isActive ? 'text-blue-500 dark:text-neon-main' : 'text-gray-400 dark:text-gray-700 group-hover:dark:text-neon-main'
        }`}>
            {isActive ? '> ' : '# '}
        </span>
        <span className={isActive ? 'dark:neon-text-main' : ''}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex w-screen h-screen bg-gray-50 dark:bg-black overflow-hidden text-gray-900 dark:text-gray-300 transition-colors duration-300 relative">
      {/* Dynamic Style Injection for Tailwind */}
      <style>{`:root { --neon-primary: ${COLOR_MAP[accentColor]}; }`}</style>
      
      <CommandPalette />
      <SnakeGame />
      
      {/* Background Effect */}
      {digitalRainMode && <DigitalRain />}
      
      {/* Sidebar */}
      <aside className={`w-64 hidden md:flex flex-col p-6 border-r border-gray-200 dark:border-gray-900 z-20 shadow-sm relative transition-colors duration-300 ${
          digitalRainMode ? 'bg-white/90 dark:bg-black/80 backdrop-blur-sm' : 'bg-white dark:bg-black/90'
      }`}>
        <div className="mb-8">
          <div className="text-lg font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 dark:neon-text-main">
            <div className="w-3 h-3 bg-blue-600 dark:bg-neon-main rounded-full dark:shadow-[0_0_10px_var(--neon-primary)]"></div>
            DevConsole<span className="text-gray-400 font-normal dark:text-gray-600">_v2</span>
          </div>
          <div className="text-xs text-gray-500 mt-1 pl-5 font-mono">
            SYS.STATUS <span className="uppercase text-green-500">ONLINE</span>
          </div>
        </div>

        {/* User Stats / Level */}
        {currentUser && levelInfo && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg dark:rounded-none border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">LVL {levelInfo.level}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{Math.floor(currentUser.xp)} XP</span>
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-700 h-1.5 rounded-full dark:rounded-none overflow-hidden mb-2">
                    <div 
                        className="bg-blue-600 dark:bg-neon-main h-full transition-all duration-500" 
                        style={{ width: `${levelInfo.progress}%` }}
                    ></div>
                </div>
                <div className="text-[10px] uppercase font-bold text-center text-blue-700 dark:text-neon-main tracking-wider truncate">
                    {levelInfo.title}
                </div>
            </div>
        )}

        <nav className="flex-1">
          <NavItem to="/dashboard" label="Dashboard" />
          {/* Only show New Task for Developers and Admins */}
          {currentUser?.role !== Role.VIEWER && (
             <NavItem to="/create-task" label="New Task" />
          )}
          <NavItem to="/terminal" label="AI Terminal" />
          <NavItem to="/snippets" label="Code Vault" />
          <NavItem to="/logs" label="System Logs" />
          <NavItem to="/leaderboard" label="Hall of Fame" />
          {currentUser?.role === Role.ADMIN && (
            <NavItem to="/admin" label="Admin Panel" />
          )}
        </nav>

        {/* Toggles */}
        <div className="mb-6 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
                <span>THEME_MODE</span>
                <div className="flex items-center gap-2">
                    <span className={theme === 'light' ? 'text-blue-600' : 'opacity-30'}>☀</span>
                    <span className="opacity-30">/</span>
                    <span className={theme === 'dark' ? 'text-neon-main' : 'opacity-30'}>☾</span>
                </div>
            </button>

            <button 
                onClick={toggleSound}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
                <span>AUDIO_FX</span>
                <div className="flex items-center gap-2">
                    <span className={soundEnabled ? 'text-green-600 dark:text-neon-main' : 'opacity-30'}>ON</span>
                    <span className="opacity-30">/</span>
                    <span className={!soundEnabled ? 'text-red-600' : 'opacity-30'}>OFF</span>
                </div>
            </button>
            
            <button 
                onClick={toggleDigitalRainMode}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
                <span>MATRIX_FX</span>
                <div className="flex items-center gap-2">
                    <span className={digitalRainMode ? 'text-green-600 dark:text-neon-main' : 'opacity-30'}>ON</span>
                    <span className="opacity-30">/</span>
                    <span className={!digitalRainMode ? 'text-red-600' : 'opacity-30'}>OFF</span>
                </div>
            </button>

            {/* RGB Tuner */}
            <div className="relative">
                <button 
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                    <span>RGB_TUNING</span>
                    <div className="w-3 h-3 rounded-full bg-neon-main shadow-[0_0_5px_var(--neon-primary)]"></div>
                </button>
                {showColorPicker && (
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-gray-900 border border-gray-700 p-2 grid grid-cols-5 gap-1 rounded animate-fade-in z-50">
                        {(Object.keys(COLOR_MAP) as AccentColor[]).map(c => (
                            <button
                                key={c}
                                onClick={() => { setAccentColor(c); setShowColorPicker(false); }}
                                className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
                                style={{ backgroundColor: COLOR_MAP[c], boxShadow: accentColor === c ? `0 0 10px ${COLOR_MAP[c]}` : 'none' }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="mt-auto">
            <div className="flex items-center gap-3 mb-4 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border border-transparent dark:border-gray-800">
                <img src={currentUser?.avatar} alt="Avatar" className="w-8 h-8 rounded-full dark:rounded-none border border-gray-200 dark:border-neon-main dark:grayscale" style={{ imageRendering: 'pixelated' }} />
                <div className="overflow-hidden">
                    <div className="text-sm text-gray-900 dark:text-neon-main font-medium truncate">{currentUser?.username}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-600 uppercase tracking-wide font-bold">{currentUser?.role}</div>
                </div>
            </div>

            <button 
            onClick={logout}
            className="w-full text-left text-xs text-gray-500 hover:text-red-600 dark:text-red-900 dark:hover:text-red-500 px-2 py-1 transition-colors flex items-center gap-2 font-mono uppercase tracking-widest"
            >
             [ Log Out ]
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 relative flex flex-col h-full w-full transition-colors duration-300 z-10 ${
          digitalRainMode ? 'bg-gray-50/80 dark:bg-black/60' : 'bg-gray-50 dark:bg-black'
      }`}>
        {/* Mobile Header */}
        <div className={`md:hidden flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800 shadow-sm ${
             digitalRainMode ? 'bg-white/90 dark:bg-black/80' : 'bg-white dark:bg-black'
        }`}>
             <div className="text-gray-900 dark:text-white font-bold dark:neon-text-main">DevConsole</div>
             <div className="flex gap-4 text-xs font-medium">
                <button onClick={toggleTheme} className="text-gray-600 dark:text-gray-400">
                    {theme === 'light' ? '☀' : '☾'}
                </button>
                <Link to="/dashboard" className="text-blue-600 dark:text-neon-main">Home</Link>
                <button onClick={logout} className="text-red-500">Exit</button>
             </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth z-10">
            <div className="w-full h-full">
                {children}
            </div>
        </div>

        {/* Footer Stats */}
        <footer className={`hidden md:flex justify-between items-center px-6 py-2 border-t border-gray-200 dark:border-gray-900 text-[11px] font-mono text-gray-400 dark:text-gray-600 select-none z-20 ${
             digitalRainMode ? 'bg-white/90 dark:bg-black/80' : 'bg-white dark:bg-black'
        }`}>
            <div className="flex gap-6">
                <div>HEAP_MEM: <span className="text-gray-600 dark:text-green-500">{mem}MB</span></div>
                <div>CPU_TEMP: <span className="text-gray-600 dark:text-red-500">{temp}°C</span></div>
            </div>
            <div className="flex gap-6">
                <div className="hidden lg:block text-xs opacity-50 mr-4">CMD+K for commands</div>
                <div>STATUS: <span className="text-green-600 font-medium">ONLINE</span></div>
                <div className="dark:text-neon-main">PORT: 8080</div>
            </div>
        </footer>
      </main>
    </div>
  );
};
