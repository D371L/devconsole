
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TerminalButton, TerminalCard, TerminalInput, TerminalTextArea } from '../components/TerminalUI';
import { auditCodeSnippet } from '../services/geminiService';
import { SoundService } from '../services/soundService';
import { Role } from '../types';

export const Snippets: React.FC = () => {
  const { snippets, currentUser, addSnippet, deleteSnippet } = useApp();
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLang, setNewLang] = useState('javascript');
  const [searchQuery, setSearchQuery] = useState('');
  
  const isViewer = currentUser?.role === Role.VIEWER;

  // State for AI Audit results: map snippetId -> result string
  const [auditResults, setAuditResults] = useState<Record<string, string>>({});
  const [isAuditing, setIsAuditing] = useState<Record<string, boolean>>({});

  const filteredSnippets = useMemo(() => {
      if (!searchQuery) return snippets;
      const lowerQuery = searchQuery.toLowerCase();
      return snippets.filter(s => 
          s.title.toLowerCase().includes(lowerQuery) || 
          s.code.toLowerCase().includes(lowerQuery)
      );
  }, [snippets, searchQuery]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCode) return;

    addSnippet({
        id: `s${Date.now()}`,
        title: newTitle,
        language: newLang,
        code: newCode,
        createdBy: currentUser?.id || 'unknown',
        timestamp: Date.now()
    });

    setNewTitle('');
    setNewCode('');
    SoundService.playSuccess();
  };

  const handleAudit = async (id: string, code: string, lang: string) => {
      setIsAuditing(prev => ({ ...prev, [id]: true }));
      SoundService.playClick();
      
      const report = await auditCodeSnippet(code, lang);
      
      setAuditResults(prev => ({ ...prev, [id]: report }));
      setIsAuditing(prev => ({ ...prev, [id]: false }));
      SoundService.playNotification();
  };

  return (
    <div className="animate-fade-in pb-10">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 dark:neon-text-green tracking-tight">CODE_VAULT</h2>
      
      <div className={`grid grid-cols-1 ${!isViewer ? 'lg:grid-cols-3' : ''} gap-8`}>
        <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <div className="bg-white dark:bg-black p-4 rounded-lg dark:rounded-none border border-gray-200 dark:border-gray-800 shadow-sm">
                <TerminalInput 
                    placeholder=">> Search vault database..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                />
            </div>

            {filteredSnippets.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-lg dark:rounded-none">
                    <p className="text-gray-500 font-mono">
                        {searchQuery ? 'No data fragments match query.' : 'Archive Empty. Initialize new data fragment.'}
                    </p>
                </div>
            ) : (
                filteredSnippets.map(snippet => (
                    <TerminalCard key={snippet.id} className="relative group" neonColor="green">
                        <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{snippet.title}</h3>
                                    <span className="text-xs uppercase bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded dark:rounded-none">{snippet.language}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleAudit(snippet.id, snippet.code, snippet.language)}
                                    disabled={isAuditing[snippet.id]}
                                    className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                                >
                                    {isAuditing[snippet.id] ? '[ SCANNING... ]' : '[ AI_AUDIT ]'}
                                </button>
                                {!isViewer && (
                                    <button 
                                        onClick={() => deleteSnippet(snippet.id)}
                                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-700 font-mono text-xs border border-red-200 dark:border-red-900 px-2 py-1"
                                    >
                                        DELETE
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded dark:rounded-none overflow-x-auto text-sm font-mono text-gray-700 dark:text-green-400 mb-2 border border-gray-200 dark:border-gray-800">
                            <code>{snippet.code}</code>
                        </pre>

                        {/* Audit Result Panel */}
                        {auditResults[snippet.id] && (
                            <div className="mt-2 p-3 bg-gray-900 border-l-4 border-neon-cyan animate-fade-in">
                                <div className="text-[10px] font-bold text-neon-cyan mb-1">AUDIT REPORT // GEMINI-2.5</div>
                                <div className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                                    {auditResults[snippet.id]}
                                </div>
                            </div>
                        )}

                        <div className="mt-2 text-[10px] text-gray-400 text-right font-mono">
                            ARCHIVED: {new Date(snippet.timestamp).toLocaleDateString()}
                        </div>
                    </TerminalCard>
                ))
            )}
        </div>

        {!isViewer && (
            <div>
                <TerminalCard title="NEW_FRAGMENT" neonColor="cyan" className="sticky top-4">
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Title</label>
                            <TerminalInput 
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="e.g. Utility Function"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Language</label>
                            <select 
                                value={newLang}
                                onChange={e => setNewLang(e.target.value)}
                                className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-300 text-sm p-2 rounded dark:rounded-none focus:ring-blue-500 dark:focus:border-neon-cyan"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="typescript">TypeScript</option>
                                <option value="python">Python</option>
                                <option value="css">CSS</option>
                                <option value="html">HTML</option>
                                <option value="sql">SQL</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Code</label>
                            <TerminalTextArea 
                                value={newCode}
                                onChange={e => setNewCode(e.target.value)}
                                rows={8}
                                className="font-mono text-xs"
                                placeholder="// Paste code here..."
                            />
                        </div>
                        <TerminalButton type="submit" className="w-full">SAVE_TO_VAULT</TerminalButton>
                    </form>
                </TerminalCard>
            </div>
        )}
      </div>
    </div>
  );
};
