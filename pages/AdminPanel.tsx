
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TerminalButton, TerminalCard, TerminalInput } from '../components/TerminalUI';
import { Role, User } from '../types';
import { SoundService } from '../services/soundService';

export const AdminPanel: React.FC = () => {
  const { users, addUser, deleteUser, currentUser, showNotification, projects } = useApp();
  
  // Form State
  const [newUser, setNewUser] = useState<Partial<User>>({
    username: '',
    password: 'password',
    role: Role.DEVELOPER
  });
  
  // Selected projects for VIEWER
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);


  // Avatar State
  const [avatarMode, setAvatarMode] = useState<'RANDOM' | 'UPLOAD'>('RANDOM');
  const [avatarSeed, setAvatarSeed] = useState(Date.now().toString());
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  // Generate URL based on mode - USING PIXEL ART STYLE
  const currentAvatarUrl = avatarMode === 'RANDOM' 
    ? `https://api.dicebear.com/9.x/pixel-art/svg?seed=${avatarSeed}`
    : customAvatar || '';

  const handleReroll = (e: React.MouseEvent) => {
      e.preventDefault();
      setAvatarMode('RANDOM');
      setAvatarSeed(Math.random().toString(36).substring(7));
      SoundService.playClick();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 500000) { // 500KB limit
              showNotification("File too large. Max 500KB for neural link.", "error");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              setCustomAvatar(reader.result as string);
              setAvatarMode('UPLOAD');
              SoundService.playSuccess();
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username) {
        showNotification("Username identifier required.", "error");
        return;
    }

    addUser({
      id: `u${Date.now()}`,
      username: newUser.username,
      password: newUser.password || 'password',
      role: newUser.role as Role,
      avatar: currentAvatarUrl,
      xp: 0, 
      achievements: [],
      allowedProjects: newUser.role === Role.VIEWER ? selectedProjects : undefined
    });

    // Reset form
    setNewUser({ username: '', password: 'password', role: Role.DEVELOPER });
    setSelectedProjects([]);
    setAvatarSeed(Date.now().toString());
    setCustomAvatar(null);
    setAvatarMode('RANDOM');
    SoundService.playSuccess();
  };


  return (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white dark:neon-text-green">SYSTEM ADMINISTRATION</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create User */}
        <TerminalCard title="REGISTER_NEW_AGENT" neonColor="green">
          <form onSubmit={handleAddUser} className="space-y-6">
            
            {/* Avatar Section */}
            <div className="flex items-start gap-6 border-b border-gray-200 dark:border-gray-800 pb-6 mb-6">
                <div className="relative group">
                    <div className="w-24 h-24 border-2 border-gray-300 dark:border-neon-green rounded bg-gray-100 dark:bg-gray-900 overflow-hidden relative image-pixelated">
                         <img src={currentAvatarUrl} alt="Preview" className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                         {/* CRT Overlay effect for avatar */}
                         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none"></div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 text-[10px] bg-gray-900 text-white px-1 font-mono border border-gray-600">
                        {avatarMode === 'RANDOM' ? '8BIT' : 'LOC'}
                    </div>
                </div>
                
                <div className="flex-1 space-y-3">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-500 uppercase tracking-wider">Visual Identity</label>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleReroll}
                            className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-neon-green text-xs font-bold py-2 px-3 rounded dark:rounded-none border border-gray-300 dark:border-gray-600 transition-colors"
                        >
                            ↻ REROLL
                        </button>
                        <label className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-neon-green text-xs font-bold py-2 px-3 rounded dark:rounded-none border border-gray-300 dark:border-gray-600 transition-colors text-center cursor-pointer">
                            ⬆ UPLOAD
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </label>
                    </div>
                    <p className="text-[10px] text-gray-400">
                        {avatarMode === 'RANDOM' ? 'Algorithm: 8-Bit Pixel Art Generator' : 'Source: Local File System (Base64)'}
                    </p>
                </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-500 uppercase tracking-wider mb-2">Codename</label>
              <TerminalInput 
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                placeholder="e.g. jsmith"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-500 uppercase tracking-wider mb-2">Clearance</label>
                    <select 
                        value={newUser.role}
                        onChange={(e) => {
                          const role = e.target.value as Role;
                          setNewUser({...newUser, role});
                          if (role !== Role.VIEWER) {
                            setSelectedProjects([]);
                          }
                        }}
                        className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-300 text-sm rounded-lg dark:rounded-none focus:ring-blue-500 dark:focus:border-neon-green block p-2.5 uppercase"
                    >
                        {Object.values(Role).map(r => (
                        <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-500 uppercase tracking-wider mb-2">Secret Key</label>
                    <TerminalInput 
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    />
                </div>
            </div>

            {/* Project Access - только для VIEWER */}
            {newUser.role === Role.VIEWER && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-500 uppercase tracking-wider mb-2">Project Access</label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-800 rounded-lg dark:rounded-none p-3 space-y-2 bg-white dark:bg-black custom-scrollbar">
                  {projects.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No projects available. Create projects first.</p>
                  ) : (
                    projects.map(project => (
                      <label key={project.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 p-2 rounded dark:rounded-none">
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(project.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjects([...selectedProjects, project.id]);
                            } else {
                              setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">{project.name}</span>
                      </label>
                    ))
                  )}
                </div>
                {selectedProjects.length > 0 && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            <TerminalButton type="submit" className="w-full mt-2" variant="primary">REGISTER AGENT</TerminalButton>
          </form>
        </TerminalCard>

        {/* User List */}
        <TerminalCard title="ACTIVE_AGENTS_DB" neonColor="purple">
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between border border-gray-200 dark:border-gray-800 p-4 rounded-lg dark:rounded-none bg-gray-50 dark:bg-gray-900/10 hover:bg-white dark:hover:bg-gray-900 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-none border border-gray-300 dark:border-gray-700 dark:grayscale dark:group-hover:grayscale-0 object-cover" style={{ imageRendering: 'pixelated' }} />
                  <div>
                    <div className="font-bold text-gray-900 dark:text-gray-300 dark:group-hover:text-neon-purple">{user.username}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{user.role}</div>
                    {user.role === Role.VIEWER && user.allowedProjects && user.allowedProjects.length > 0 && (
                      <div className="text-[9px] text-gray-400 mt-1">
                        Access: {user.allowedProjects.map(pid => projects.find(p => p.id === pid)?.name || pid).join(', ')}
                      </div>
                    )}
                    {user.role === Role.VIEWER && (!user.allowedProjects || user.allowedProjects.length === 0) && (
                      <div className="text-[9px] text-orange-400 mt-1">No project access</div>
                    )}
                  </div>
                </div>
                {user.id !== currentUser?.id && (
                  <button 
                    onClick={() => deleteUser(user.id)}
                    className="text-red-500 hover:text-red-700 dark:text-gray-600 dark:hover:text-red-500 text-xs font-bold uppercase tracking-wider border border-red-200 hover:border-red-400 dark:border-transparent dark:hover:border-red-900 px-3 py-1.5 rounded dark:rounded-none transition-colors bg-white dark:bg-transparent"
                  >
                    PURGE
                  </button>
                )}
              </div>
            ))}
          </div>
        </TerminalCard>
      </div>
    </div>
  );
};
