
import React, { useEffect } from 'react';
import { Priority } from '../types';

export const TerminalButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'warning' | 'ghost' }> = ({ children, className, variant = 'primary', ...props }) => {
  const baseStyle = "uppercase tracking-wider px-6 py-2.5 text-sm transition-all duration-200 font-bold rounded dark:rounded-none shadow-sm border focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black";
  
  let variantStyle = "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-blue-500 dark:bg-black dark:text-gray-400 dark:border-gray-800 dark:hover:text-white"; 
  
  if (variant === 'primary') {
    variantStyle = "bg-blue-600 text-white border-transparent hover:bg-blue-700 focus:ring-blue-500 shadow-md " + 
                   "dark:bg-transparent dark:text-neon-cyan dark:border-neon-cyan dark:hover:bg-neon-cyan/10 dark:hover:shadow-[0_0_15px_#00f3ff] dark:shadow-none";
  } else if (variant === 'danger') {
    variantStyle = "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 focus:ring-red-500 " +
                   "dark:bg-transparent dark:text-red-500 dark:border-red-900 dark:hover:bg-red-900/20 dark:hover:border-red-500";
  } else if (variant === 'warning') {
      variantStyle = "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 " +
                     "dark:bg-transparent dark:text-yellow-500 dark:border-yellow-900";
  } else if (variant === 'ghost') {
      variantStyle = "bg-transparent text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900 shadow-none " +
                     "dark:text-gray-500 dark:hover:text-white dark:hover:bg-gray-900";
  }

  return (
    <button 
      className={`${baseStyle} ${variantStyle} ${className || ''}`}
      {...props}
    >
      <span className="flex items-center justify-center gap-2 relative z-10">
         {children}
      </span>
    </button>
  );
};

export const TerminalInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => {
  return (
    <input 
      className={`bg-white border border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none px-4 py-2 w-full rounded-md font-mono placeholder-gray-400 transition-colors duration-200 
      dark:bg-black dark:border-gray-800 dark:text-neon-green dark:placeholder-gray-800 dark:focus:border-neon-cyan dark:focus:ring-0 dark:rounded-none ${className || ''}`}
      {...props}
    />
  );
};

export const TerminalTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => {
  return (
    <textarea 
      className={`bg-white border border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none p-4 w-full rounded-md font-mono placeholder-gray-400 transition-colors duration-200
      dark:bg-black dark:border-gray-800 dark:text-gray-300 dark:placeholder-gray-800 dark:focus:border-neon-cyan dark:focus:ring-0 dark:rounded-none ${className || ''}`}
      {...props}
    />
  );
};

export const TerminalCard: React.FC<{ children: React.ReactNode; title?: string; className?: string; neonColor?: 'cyan' | 'purple' | 'green' }> = ({ children, title, className, neonColor = 'cyan' }) => {
  const neonBorder = neonColor === 'purple' ? 'dark:group-hover:border-neon-purple' : neonColor === 'green' ? 'dark:group-hover:border-neon-green' : 'dark:group-hover:border-neon-cyan';
  
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 relative transition-all duration-300 
    dark:bg-black dark:border-gray-800 dark:rounded-none dark:shadow-none group ${neonBorder} ${className || ''}`}>
      {title && (
        <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold tracking-wider text-gray-500 uppercase border border-gray-100 rounded-full shadow-sm
        dark:bg-black dark:text-gray-600 dark:border-transparent dark:rounded-none">
          {title}
        </div>
      )}
      {children}
      
      {/* Decorative corners for Dark Mode only */}
      <div className="hidden dark:block absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-800 group-hover:border-neon-cyan transition-colors"></div>
      <div className="hidden dark:block absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-800 group-hover:border-neon-cyan transition-colors"></div>
    </div>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getColor = (s: string) => {
    switch(s) {
      case 'TODO': return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-transparent dark:text-gray-500 dark:border-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-neon-cyan/10 dark:text-neon-cyan dark:border-neon-cyan';
      case 'DONE': return 'bg-green-50 text-green-700 border-green-200 dark:bg-neon-green/10 dark:text-neon-green dark:border-neon-green';
      case 'REVIEW': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-neon-purple/10 dark:text-neon-purple dark:border-neon-purple';
      case 'BLOCKED': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/10 dark:text-red-500 dark:border-red-900';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full dark:rounded-none text-[10px] uppercase font-bold tracking-wider border ${getColor(status)}`}>
      {status}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const getColor = (p: Priority) => {
    switch(p) {
      case Priority.LOW: return 'bg-gray-100 text-gray-600 dark:bg-transparent dark:text-gray-500';
      case Priority.MEDIUM: return 'bg-blue-50 text-blue-600 dark:bg-transparent dark:text-blue-400';
      case Priority.HIGH: return 'bg-orange-50 text-orange-600 dark:bg-transparent dark:text-orange-400';
      case Priority.CRITICAL: return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-500 animate-pulse';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getColor(priority)}`}>
      {priority}
    </span>
  );
};

export const NotificationToast: React.FC<{ message: string; type: 'success' | 'error' | 'info' | 'warning'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const colors = {
        success: 'border-green-500 text-green-700 dark:text-neon-green bg-green-50 dark:bg-black',
        error: 'border-red-500 text-red-700 dark:text-red-500 bg-red-50 dark:bg-black',
        info: 'border-blue-500 text-blue-700 dark:text-neon-cyan bg-blue-50 dark:bg-black',
        warning: 'border-yellow-500 text-yellow-700 dark:text-yellow-500 bg-yellow-50 dark:bg-black'
    };

    return (
        <div className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg dark:rounded-none border-l-4 shadow-lg ring-1 ring-black ring-opacity-5 ${colors[type]}`}>
            <div className="p-4 flex items-start">
                <div className="flex-1 w-0">
                    <p className="text-sm font-medium font-mono">
                        {type === 'success' && '>> SUCCESS: '}
                        {type === 'error' && '>> ERROR: '}
                        {type === 'info' && '>> INFO: '}
                        {type === 'warning' && '>> WARNING: '}
                        {message}
                    </p>
                </div>
                <div className="ml-4 flex flex-shrink-0">
                    <button onClick={onClose} className="inline-flex rounded-md dark:rounded-none bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none">
                        <span className="sr-only">Close</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};