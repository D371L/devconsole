
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TerminalButton, TerminalCard, TerminalInput, TerminalTextArea } from '../components/TerminalUI';
import { Task, TaskStatus, Priority, Subtask, Role, Project } from '../types';
import { SoundService } from '../services/soundService';
import { useDebounce } from '../hooks/useDebounce';
import { apiService } from '../services/apiService';

const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const TaskDetail: React.FC<{ isNew?: boolean }> = ({ isNew }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, users, projects, currentUser, addTask, updateTask, deleteTask, addProject, addComment, editComment, deleteComment, addReaction, showNotification, toggleTaskTimer } = useApp();

  const isViewer = currentUser?.role === Role.VIEWER;

  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    projectId: '',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    assignedTo: '',
    deadline: '',
    attachments: [],
    subtasks: [],
    comments: [],
    activityLog: [],
    timeSpent: 0,
    timerStartedAt: null,
    dependsOn: [],
    tags: []
  });

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedDependency, setSelectedDependency] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Debounced form data for auto-save
  const debouncedFormData = useDebounce(formData, 2500); // 2.5 seconds delay

  // Project Creation State
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  // UI States for Image handling
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [pendingAnnotationImage, setPendingAnnotationImage] = useState<string | null>(null);
  
  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  // Timer Live Update
  const [liveTimeSpent, setLiveTimeSpent] = useState(0);

  useEffect(() => {
    if (!isNew && id) {
      const existingTask = tasks.find(t => t.id === id);
      if (existingTask) {
        // Check VIEWER access to task project
        if (isViewer && currentUser?.allowedProjects && !currentUser.allowedProjects.includes(existingTask.projectId)) {
          showNotification('Access denied: You do not have access to this project', 'error');
          navigate('/dashboard');
          return;
        }
        // Check if this is first task load or update
        const isFirstLoad = !formData.id || formData.id !== id;
        
        if (isFirstLoad) {
          // First load - check timer and stop if it was running
          const timerStartedAt = typeof existingTask.timerStartedAt === 'string' 
            ? (existingTask.timerStartedAt === 'null' || existingTask.timerStartedAt === '' ? null : parseInt(existingTask.timerStartedAt, 10))
            : existingTask.timerStartedAt;
          
          if (timerStartedAt != null && !isNaN(timerStartedAt) && timerStartedAt > 0) {
            const timerAge = Date.now() - timerStartedAt;
            const elapsed = Math.max(0, timerAge / 1000);
            
            // Stop timer on first task load
            const updatedTask = {
              ...existingTask,
              timerStartedAt: null,
              timeSpent: Math.round((existingTask.timeSpent || 0) + elapsed)
            };
            
            setFormData(updatedTask);
            updateTask(updatedTask).catch(err => console.error('Failed to auto-stop timer on load:', err));
            return;
          }
        }
        
        // Not first load - just sync formData with tasks
        // This allows timer to work after toggleTaskTimer
        setFormData(existingTask);
      } else {
        navigate('/dashboard');
      }
    } else {
        // Set default project if exists
        setFormData(prev => ({
            ...prev, 
            assignedTo: currentUser?.id,
            projectId: projects[0]?.id || '',
            timerStartedAt: null
        }));
    }
  }, [id, isNew, tasks, navigate, currentUser, projects]);

  // Update live timer and auto-save every 30 seconds
  useEffect(() => {
      let interval: ReturnType<typeof setInterval> | undefined;
      let autoSaveInterval: ReturnType<typeof setInterval> | undefined;
      
      // Check that timerStartedAt is a valid number (not null, not undefined, not string "null")
      const timerStartedAt = typeof formData.timerStartedAt === 'string' 
        ? (formData.timerStartedAt === 'null' || formData.timerStartedAt === '' ? null : parseInt(formData.timerStartedAt, 10))
        : formData.timerStartedAt;
      
      const isTimerActive = timerStartedAt != null && !isNaN(timerStartedAt) && timerStartedAt > 0 && id;
      
      console.log('Timer effect:', { 
        timerStartedAt, 
        isTimerActive, 
        id, 
        timeSpent: formData.timeSpent 
      });
      
      if (isTimerActive) {
          // Update immediately to avoid lag
          const initialTime = (formData.timeSpent || 0) + (Date.now() - timerStartedAt) / 1000;
          setLiveTimeSpent(initialTime);
          
          // Update display every second
          interval = setInterval(() => {
             const currentTime = (formData.timeSpent || 0) + (Date.now() - timerStartedAt) / 1000;
             setLiveTimeSpent(currentTime);
          }, 1000);
          
          // Auto-save accumulated time every 30 seconds
          autoSaveInterval = setInterval(async () => {
              if (id && !isViewer) {
                  const task = tasks.find(t => t.id === id);
                  if (task) {
                      const taskTimerStartedAt = typeof task.timerStartedAt === 'string' 
                        ? (task.timerStartedAt === 'null' || task.timerStartedAt === '' ? null : parseInt(task.timerStartedAt, 10))
                        : task.timerStartedAt;
                      
                      // Check that timer is still active before auto-save
                      if (taskTimerStartedAt != null && !isNaN(taskTimerStartedAt) && taskTimerStartedAt > 0) {
                          const elapsed = (Date.now() - taskTimerStartedAt) / 1000;
                          const updatedTask = {
                              ...task,
                              timeSpent: (task.timeSpent || 0) + elapsed,
                              timerStartedAt: Date.now() // Update start time for next interval
                          };
                          try {
                              await updateTask(updatedTask);
                              // Update formData to sync
                              setFormData(prev => ({ ...prev, ...updatedTask }));
                          } catch (error) {
                              console.error('Failed to auto-save timer:', error);
                          }
                      }
                  }
              }
          }, 30000); // 30 seconds
      } else {
          // Timer stopped - just show saved time, don't update
          setLiveTimeSpent(formData.timeSpent || 0);
      }
      
      return () => {
          if (interval) clearInterval(interval);
          if (autoSaveInterval) clearInterval(autoSaveInterval);
      };
  }, [formData.timerStartedAt, formData.timeSpent, id, isViewer, tasks, updateTask, formData.id]);
  
  // Auto-save when form data changes (debounced)
  useEffect(() => {
    // Skip auto-save if:
    // - New task (not saved yet)
    // - Viewer role
    // - No task ID
    // - Form data hasn't changed from initial load
    if (isNew || isViewer || !id || !debouncedFormData.id || debouncedFormData.id !== id) {
      return;
    }

    // Check if there are actual changes to save
    const currentTask = tasks.find(t => t.id === id);
    if (!currentTask) return;

    // Compare key fields to avoid unnecessary saves
    const hasChanges = 
      currentTask.title !== debouncedFormData.title ||
      currentTask.description !== debouncedFormData.description ||
      currentTask.status !== debouncedFormData.status ||
      currentTask.priority !== debouncedFormData.priority ||
      currentTask.assignedTo !== debouncedFormData.assignedTo ||
      currentTask.projectId !== debouncedFormData.projectId ||
      currentTask.deadline !== debouncedFormData.deadline ||
      JSON.stringify(currentTask.dependsOn || []) !== JSON.stringify(debouncedFormData.dependsOn || []) ||
      JSON.stringify(currentTask.tags || []) !== JSON.stringify(debouncedFormData.tags || []);

    if (hasChanges) {
      setSaveStatus('saving');
      updateTask({ ...debouncedFormData, projectId: debouncedFormData.projectId || currentTask.projectId } as Task)
        .then(() => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000); // Reset status after 2 seconds
        })
        .catch((error) => {
          console.error('Auto-save failed:', error);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        });
    }
  }, [debouncedFormData, id, isNew, isViewer, tasks, updateTask]);
  
  // Save time when leaving the page
  useEffect(() => {
      const handleBeforeUnload = async () => {
          const timerStartedAt = typeof formData.timerStartedAt === 'string' 
            ? (formData.timerStartedAt === 'null' || formData.timerStartedAt === '' ? null : parseInt(formData.timerStartedAt, 10))
            : formData.timerStartedAt;
          
          if (id && timerStartedAt != null && !isNaN(timerStartedAt) && timerStartedAt > 0 && !isViewer) {
              const task = tasks.find(t => t.id === id);
              if (task) {
                  const taskTimerStartedAt = typeof task.timerStartedAt === 'string' 
                    ? (task.timerStartedAt === 'null' || task.timerStartedAt === '' ? null : parseInt(task.timerStartedAt, 10))
                    : task.timerStartedAt;
              
                  if (taskTimerStartedAt != null && !isNaN(taskTimerStartedAt) && taskTimerStartedAt > 0) {
                      const elapsed = (Date.now() - taskTimerStartedAt) / 1000;
                      const updatedTask = {
                          ...task,
                          timeSpent: (task.timeSpent || 0) + elapsed,
                          timerStartedAt: null // Stop timer on close
                      };
                      try {
                          await updateTask(updatedTask);
                      } catch (error) {
                          console.error('Failed to save timer on unload:', error);
                      }
                  }
              }
          }
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [id, formData.timerStartedAt, isViewer, tasks, updateTask]);


  // Setup Canvas when pending image changes
  useEffect(() => {
    if (pendingAnnotationImage && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const img = new Image();
        img.src = pendingAnnotationImage;
        img.onload = () => {
            // Set canvas size to match image, but max out at window size mostly
            const maxWidth = Math.min(800, window.innerWidth - 40);
            const scale = maxWidth / img.width;
            
            canvas.width = img.width * (scale > 1 ? 1 : scale);
            canvas.height = img.height * (scale > 1 ? 1 : scale);
            
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Setup drawing style
            context.strokeStyle = '#ff0000'; // Red Marker
            context.lineWidth = 3;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            setCtx(context);
        };
    }
  }, [pendingAnnotationImage]);


  const handleChange = (field: keyof Task, value: any) => {
    if (isViewer) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === 'NEW_PROJECT_TRIGGER') {
          setIsCreatingProject(true);
      } else {
          setIsCreatingProject(false);
          handleChange('projectId', val);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewer) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showNotification('File too large. Maximum size is 10MB.', 'error');
      e.target.value = '';
      return;
    }

    // For images, use annotation modal with base64 for annotation
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPendingAnnotationImage(base64);
      };
      reader.readAsDataURL(file);
    } else {
      // For non-images, upload directly to server
      try {
        showNotification('Uploading file...', 'info');
        const fileInfo = await apiService.uploadFile(file);
        // Use the filename directly, store it as /uploads/filename format for consistency
        const fileUrl = `/uploads/${fileInfo.filename}`;
        
        // Update formData with new attachment
        const updatedAttachments = [...(formData.attachments || []), fileUrl];
        setFormData(prev => ({
          ...prev,
          attachments: updatedAttachments
        }));
        
        // Auto-save the task after file upload with updated attachments
        if (!isNew && id) {
          try {
            await updateTask({ ...formData, attachments: updatedAttachments } as Task);
          } catch (error) {
            console.error('Failed to auto-save after file upload:', error);
          }
        }
        
        showNotification('File uploaded successfully', 'success');
      } catch (error) {
        console.error('Failed to upload file:', error);
        showNotification('Failed to upload file: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      }
    }
    
    // Reset input
    e.target.value = '';
  };

  const saveAnnotation = async () => {
      if (isViewer) return;
      if (canvasRef.current && pendingAnnotationImage) {
          try {
              // Convert canvas to blob and upload
              canvasRef.current.toBlob(async (blob) => {
                  if (!blob) {
                      showNotification('Failed to process image', 'error');
                      return;
                  }

                  // Create a File object from blob
                  const file = new File([blob], `annotated_${Date.now()}.png`, { type: 'image/png' });
                  
                  showNotification('Uploading annotated image...', 'info');
                  const fileInfo = await apiService.uploadFile(file);
                  // Use the filename directly, store it as /uploads/filename format for consistency
                  const fileUrl = `/uploads/${fileInfo.filename}`;
                  
                  // Update formData with new attachment
                  const updatedAttachments = [...(formData.attachments || []), fileUrl];
                  setFormData(prev => ({
                      ...prev,
                      attachments: updatedAttachments
                  }));
                  
                  // Auto-save the task after image upload with updated attachments
                  if (!isNew && id) {
                    try {
                      await updateTask({ ...formData, attachments: updatedAttachments } as Task);
                    } catch (error) {
                      console.error('Failed to auto-save after image upload:', error);
                    }
                  }
                  
                  setPendingAnnotationImage(null);
                  SoundService.playSuccess();
                  showNotification('Image uploaded successfully', 'success');
              }, 'image/png');
          } catch (error) {
              console.error('Failed to upload annotated image:', error);
              showNotification('Failed to upload image: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
          }
      }
  };

  // Drawing Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!ctx) return;
    setIsDrawing(true);
    const { offsetX, offsetY } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx) return;
    const { offsetX, offsetY } = getCoordinates(e);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
      if (canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          let clientX, clientY;
          
          if ('touches' in e) {
              clientX = e.touches[0].clientX;
              clientY = e.touches[0].clientY;
          } else {
              clientX = (e as React.MouseEvent).clientX;
              clientY = (e as React.MouseEvent).clientY;
          }
          
          return {
              offsetX: clientX - rect.left,
              offsetY: clientY - rect.top
          };
      }
      return { offsetX: 0, offsetY: 0 };
  };


  const handleSave = async () => {
    if (isViewer) return;
    setError(null);
    
    if (!formData.title || !formData.description) {
      const errorMsg = 'Title and description are required';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      return;
    }
    
    SoundService.playClick();
    setSaveStatus('saving');

    try {
      let finalProjectId = formData.projectId;

      // Logic to create new project if needed
      if (isCreatingProject && newProjectName) {
          const newProject: Project = {
              id: `p${Date.now()}`,
              name: newProjectName,
              color: '#'+Math.floor(Math.random()*16777215).toString(16) // Random color
          };
          await addProject(newProject);
          finalProjectId = newProject.id;
      }

      if (!finalProjectId) {
          const errorMsg = "Project assignment required.";
          setError(errorMsg);
          setSaveStatus('error');
          showNotification(errorMsg, "error");
          setTimeout(() => setSaveStatus('idle'), 3000);
          return;
      }

      if (isNew) {
        const newTask: Task = {
          id: `t${Date.now()}`,
          title: formData.title!,
          description: formData.description!,
          projectId: finalProjectId,
          status: formData.status || TaskStatus.TODO,
          priority: formData.priority || Priority.MEDIUM,
          assignedTo: formData.assignedTo,
          createdBy: currentUser!.id,
          createdAt: Date.now(),
          deadline: formData.deadline,
          attachments: formData.attachments || [],
          subtasks: formData.subtasks || [],
          comments: [],
          activityLog: [],
          timeSpent: 0,
          timerStartedAt: null
        };
        await addTask(newTask);
        setSaveStatus('saved');
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        await updateTask({ ...formData, projectId: finalProjectId } as Task);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save task';
      setError(errorMsg);
      setSaveStatus('error');
      showNotification(errorMsg, 'error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleDelete = async () => {
    if (isViewer || !id) return;
    
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    
    SoundService.playClick();
    setError(null);
    
    try {
      await deleteTask(id);
      showNotification('Task deleted successfully', 'success');
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
      e.preventDefault();
      if (isViewer) return;
      if (!newComment.trim() || !id) return;
      addComment(id, newComment);
      setNewComment('');
      setFormData(prev => ({
          ...prev,
          comments: [...(prev.comments || []), { id: 'temp', userId: currentUser!.id, text: newComment, timestamp: Date.now() }]
      }));
  };

  const handleAddSubtask = (e: React.FormEvent) => {
      e.preventDefault();
      if (isViewer) return;
      if(!newSubtaskTitle.trim()) return;
      
      const newSubtask: Subtask = {
          id: `st${Date.now()}`,
          title: newSubtaskTitle,
          completed: false
      };
      
      const updatedSubtasks = [...(formData.subtasks || []), newSubtask];
      handleChange('subtasks', updatedSubtasks);
      setNewSubtaskTitle('');
      SoundService.playClick();
  };

  const toggleSubtask = (subtaskId: string) => {
      if (isViewer) return;
      const updatedSubtasks = formData.subtasks?.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      handleChange('subtasks', updatedSubtasks);
      SoundService.playClick();
  };

  const deleteSubtask = (subtaskId: string) => {
      if (isViewer) return;
      const updatedSubtasks = formData.subtasks?.filter(st => st.id !== subtaskId);
      handleChange('subtasks', updatedSubtasks);
      SoundService.playClick();
  }

  const handleAiAnalysis = async () => {
    if (isViewer) return;
    if (!formData.title || !formData.description) {
        showNotification("Title and description required for analysis.", "warning");
        return;
    }

    SoundService.playClick();
    setIsAnalyzing(true);
    try {
        const suggestions = await analyzeTaskAndGetSubtasks(formData.title, formData.description);
        if (suggestions && suggestions.length > 0) {
            const newSubtasks: Subtask[] = suggestions.map((title, idx) => ({
                id: `st_ai_${Date.now()}_${idx}`,
                title: title,
                completed: false
            }));
            
            handleChange('subtasks', [...(formData.subtasks || []), ...newSubtasks]);
            showNotification(`Gemini generated ${newSubtasks.length} subtasks.`, "success");
            SoundService.playSuccess();
        } else {
            showNotification("No subtasks generated.", "info");
        }
    } catch (e) {
        showNotification("AI Analysis failed.", "error");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleGenerateAscii = async () => {
      if (isViewer) return;
      if (!formData.title) return;
      setIsAnalyzing(true);
      SoundService.playClick();
      try {
          const ascii = await generateAsciiArt(formData.title);
          const newDesc = `${ascii}\n\n${formData.description || ''}`;
          handleChange('description', newDesc);
          SoundService.playSuccess();
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleTimerToggle = async () => {
      if (!id || isViewer) {
          console.log('Cannot toggle timer: id=', id, 'isViewer=', isViewer);
          return;
      }
      
      console.log('Toggle timer clicked for task:', id);
      console.log('Current formData.timerStartedAt:', formData.timerStartedAt);
      
      try {
          await toggleTaskTimer(id);
          
          // Force update formData after timer change
          // Wait a bit for tasks to update
          setTimeout(() => {
              const updatedTask = tasks.find(t => t.id === id);
              if (updatedTask) {
                  console.log('Updating formData after timer toggle:', updatedTask.timerStartedAt);
                  setFormData(updatedTask);
              }
          }, 100);
      } catch (error) {
          console.error('Failed to toggle timer:', error);
          showNotification('Failed to toggle timer', 'error');
      }
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.username || 'Unknown';


  return (
    <div className="pb-12 animate-fade-in relative">
      
      {/* --- Lightbox Modal --- */}
      {lightboxImage && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
              <img src={lightboxImage} alt="Full view" className="max-w-full max-h-[90vh] border-2 border-neon-cyan shadow-[0_0_30px_rgba(0,243,255,0.3)]" />
              <button 
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 text-white text-4xl hover:text-red-500"
              >
                  &times;
              </button>
          </div>
      )}

      {/* --- Annotation Modal --- */}
      {pendingAnnotationImage && !isViewer && (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
              <div className="mb-4 text-white text-center">
                  <h3 className="text-xl font-bold dark:neon-text-cyan mb-2">ANNOTATION_MODE</h3>
                  <p className="text-xs text-gray-400 font-mono">Use pointer to mark details. Click SAVE to attach.</p>
              </div>
              <div className="relative border-2 border-dashed border-gray-600">
                  <canvas 
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="cursor-crosshair bg-gray-900 touch-none"
                  />
              </div>
              <div className="flex gap-4 mt-6">
                  <TerminalButton variant="danger" onClick={() => setPendingAnnotationImage(null)}>DISCARD</TerminalButton>
                  <TerminalButton variant="primary" onClick={saveAnnotation}>SAVE & ATTACH</TerminalButton>
              </div>
          </div>
      )}


      {/* Header Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
            <div className="text-xs text-gray-500 dark:text-gray-600 uppercase tracking-widest font-bold mb-1">
                {isNew ? 'INIT_SEQUENCE' : 'PROTOCOL_EDIT'}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white dark:neon-text-main">
                {isNew ? 'NEW_DIRECTIVE' : `ID: ${id}`}
            </h2>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
             {!isNew && !isViewer && (
                <TerminalButton variant="danger" onClick={handleDelete}>PURGE</TerminalButton>
             )}
             {!isViewer && (
                 <>
                   <TerminalButton variant="primary" onClick={handleSave}>EXECUTE SAVE</TerminalButton>
                  {!isNew && saveStatus !== 'idle' && (
                    <span className={`text-xs font-mono px-2 py-1 rounded dark:rounded-none ${
                      saveStatus === 'saving' 
                        ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
                        : saveStatus === 'error'
                        ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                        : 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
                    }`}>
                      {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? 'Error!' : '✓ Saved'}
                    </span>
                  )}
                 </>
             )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <TerminalCard title="CORE_DATA" neonColor="cyan">
            <div className="space-y-6">
              
              {/* Project Selection */}
              <div>
                 <label className="block text-xs font-bold text-gray-700 dark:text-neon-main uppercase tracking-wider mb-2">Project Assignment</label>
                 {!isCreatingProject ? (
                     <select 
                        value={formData.projectId}
                        onChange={handleProjectChange}
                        disabled={isViewer}
                        className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-neon-main text-lg font-bold rounded-lg dark:rounded-none focus:ring-blue-500 dark:focus:border-neon-main block p-2.5 font-mono"
                     >
                        <option value="" disabled>-- SELECT PROJECT --</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                        {!isViewer && <option value="NEW_PROJECT_TRIGGER">[ + CREATE NEW PROJECT ]</option>}
                     </select>
                 ) : (
                     <div className="flex gap-2 animate-fade-in">
                         <TerminalInput 
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Enter New Project Name..."
                            className="font-bold text-lg"
                            autoFocus
                         />
                         <button 
                            type="button"
                            onClick={() => setIsCreatingProject(false)}
                            className="px-4 border border-red-500 text-red-500 hover:bg-red-500/10"
                         >
                             CANCEL
                         </button>
                     </div>
                 )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neon-main uppercase tracking-wider mb-2">Title</label>
                <div className="flex gap-2">
                    <TerminalInput 
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g. Neural Network Refactor"
                    className="text-lg font-medium flex-1"
                    disabled={isViewer}
                    />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-neon-main uppercase tracking-wider">Description</label>
                </div>
                <TerminalTextArea 
                  rows={12}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter detailed specifications..."
                  disabled={isViewer}
                />
              </div>
            </div>
          </TerminalCard>

          {/* Manual Subtasks Section */}
          <TerminalCard title="EXECUTION_CHECKLIST" neonColor="purple">
              <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400">STEPS</h4>
              </div>

              {/* Progress Bar */}
              {formData.subtasks && formData.subtasks.length > 0 && (() => {
                const completed = formData.subtasks.filter(st => st.completed).length;
                const total = formData.subtasks.length;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="text-xs font-bold text-purple-600 dark:text-neon-purple">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-purple-600 dark:bg-neon-purple h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                      {completed} of {total} steps completed
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-3 mb-4">
                  {formData.subtasks?.map(st => (
                      <div key={st.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/30 p-2 rounded dark:rounded-none group animate-fade-in">
                          <input 
                            type="checkbox" 
                            checked={st.completed} 
                            onChange={() => toggleSubtask(st.id)}
                            disabled={isViewer}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className={`flex-1 text-sm ${st.completed ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                              {st.title}
                          </span>
                          {!isViewer && (
                            <button onClick={() => deleteSubtask(st.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                &times;
                            </button>
                          )}
                      </div>
                  ))}
                  {(!formData.subtasks || formData.subtasks.length === 0) && (
                      <p className="text-xs text-gray-400 italic text-center py-2">No subtasks defined. {isViewer ? '' : 'Use manual entry or AI generation.'}</p>
                  )}
              </div>
              {!isViewer && (
                <form onSubmit={handleAddSubtask} className="flex gap-2">
                    <TerminalInput 
                        value={newSubtaskTitle}
                        onChange={e => setNewSubtaskTitle(e.target.value)}
                        placeholder="Add execution step..."
                        className="text-sm"
                    />
                    <button type="submit" className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-300 dark:hover:bg-gray-700 rounded dark:rounded-none text-xl leading-none">
                        +
                    </button>
                </form>
              )}
          </TerminalCard>

          <TerminalCard title="ATTACHMENTS" neonColor="green">
            {!isViewer && (
                <div className="mb-4 relative group">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-800 border-dashed rounded-lg dark:rounded-none cursor-pointer bg-gray-50 dark:bg-black hover:bg-gray-100 dark:hover:border-neon-green transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <p className="text-sm text-gray-500 dark:text-gray-600 font-mono uppercase">Upload Assets (Annotate)</p>
                    </div>
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                </div>
            )}
            
            {formData.attachments && formData.attachments.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.attachments.map((attachment, idx) => {
                    // Support both base64 (old) and URL (new) formats
                    const isImage = attachment.startsWith('data:image/') || attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    // Convert attachment to proper URL
                    let attachmentUrl = attachment;
                    if (attachment.startsWith('/uploads/')) {
                        // Extract filename from /uploads/filename
                        const filename = attachment.replace('/uploads/', '');
                        attachmentUrl = apiService.getFileUrl(filename);
                        console.log('Attachment:', attachment, '-> URL:', attachmentUrl);
                    } else if (!attachment.startsWith('http') && !attachment.startsWith('data:image/')) {
                        // If it's just a filename without path, assume it's in uploads
                        attachmentUrl = apiService.getFileUrl(attachment);
                        console.log('Attachment (filename only):', attachment, '-> URL:', attachmentUrl);
                    }
                    
                    const handleDelete = async (e: React.MouseEvent) => {
                        e.stopPropagation();
                        // If it's a server file (URL), delete from server
                        if (attachment.startsWith('/uploads/') || (attachment.startsWith('http') && attachment.includes('/uploads/'))) {
                            try {
                                const filename = attachment.includes('/uploads/') 
                                    ? attachment.split('/uploads/')[1] 
                                    : attachment.split('/').pop();
                                if (filename) {
                                    await apiService.deleteFile(filename);
                                }
                            } catch (error) {
                                console.error('Failed to delete file from server:', error);
                                // Continue with local deletion even if server deletion fails
                            }
                        }
                        // Remove from attachments list
                        handleChange('attachments', formData.attachments?.filter((_, i) => i !== idx));
                    };

                    if (isImage) {
                        return (
                            <div key={idx} className="relative group rounded-md dark:rounded-none overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
                                <img 
                                    src={attachmentUrl} 
                                    alt={`Asset ${idx}`} 
                                    className="w-full h-24 object-cover hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100 cursor-zoom-in" 
                                    onClick={() => setLightboxImage(attachmentUrl)}
                                    onError={(e) => {
                                        // Fallback for broken images
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ccc" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Image</text></svg>';
                                    }}
                                />
                                {!isViewer && (
                                    <button 
                                        onClick={handleDelete}
                                        className="absolute top-1 right-1 bg-white/90 dark:bg-red-900 text-red-600 dark:text-white rounded-full dark:rounded-none p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                )}
                            </div>
                        );
                    } else {
                        // Non-image file
                        const fileName = attachment.includes('/uploads/') 
                            ? attachment.split('/uploads/')[1] 
                            : attachment.split('/').pop() || `File ${idx + 1}`;
                        return (
                            <div key={idx} className="relative group rounded-md dark:rounded-none overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm p-3 bg-gray-50 dark:bg-gray-900">
                                <a 
                                    href={attachmentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block text-xs text-gray-700 dark:text-gray-300 truncate hover:text-blue-600 dark:hover:text-neon-cyan"
                                >
                                    📎 {fileName.substring(0, 20)}
                                </a>
                                {!isViewer && (
                                    <button 
                                        onClick={handleDelete}
                                        className="absolute top-1 right-1 bg-white/90 dark:bg-red-900 text-red-600 dark:text-white rounded-full dark:rounded-none p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                )}
                            </div>
                        );
                    }
                })}
                </div>
            )}
            {(!formData.attachments || formData.attachments.length === 0) && isViewer && (
                 <p className="text-xs text-gray-400 italic text-center">No attachments available.</p>
            )}
          </TerminalCard>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {!isNew && (
            <TerminalCard title="COMMUNICATIONS_LOG" neonColor="purple">
                <div className="max-h-64 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
                    {formData.comments && formData.comments.length > 0 ? (
                        formData.comments.map((comment) => {
                            const isOwnComment = comment.userId === currentUser?.id;
                            const isEditing = editingCommentId === comment.id;
                            
                            // Parse mentions in comment text
                            const renderCommentText = (text: string) => {
                                const parts = text.split(/(@\w+)/g);
                                return parts.map((part, idx) => {
                                    if (part.startsWith('@')) {
                                        const username = part.substring(1);
                                        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
                                        return user ? (
                                            <span key={idx} className="text-blue-600 dark:text-neon-cyan font-semibold">{part}</span>
                                        ) : (
                                            <span key={idx}>{part}</span>
                                        );
                                    }
                                    return <span key={idx}>{part}</span>;
                                });
                            };
                            
                            return (
                                <div key={comment.id} className="group bg-gray-50 dark:bg-gray-900/30 p-3 rounded dark:rounded-none border-l-2 border-blue-400 dark:border-neon-cyan">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{getUserName(comment.userId)}</span>
                                                {comment.edited && (
                                                    <span className="text-[9px] text-gray-400 italic">(edited)</span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-mono">{new Date(comment.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        {isOwnComment && !isEditing && !isViewer && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingCommentId(comment.id);
                                                        setEditingCommentText(comment.text);
                                                    }}
                                                    className="text-xs text-gray-500 hover:text-blue-600 dark:hover:text-neon-cyan"
                                                    title="Edit comment"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (id) deleteComment(id, comment.id);
                                                    }}
                                                    className="text-xs text-gray-500 hover:text-red-600"
                                                    title="Delete comment"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <TerminalTextArea
                                                value={editingCommentText}
                                                onChange={e => setEditingCommentText(e.target.value)}
                                                rows={3}
                                                className="text-xs"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        if (id) {
                                                            editComment(id, comment.id, editingCommentText);
                                                            setEditingCommentId(null);
                                                            setEditingCommentText('');
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-green-600 text-white text-xs font-bold hover:bg-green-700"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingCommentId(null);
                                                        setEditingCommentText('');
                                                    }}
                                                    className="px-2 py-1 bg-gray-600 text-white text-xs font-bold hover:bg-gray-700"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{renderCommentText(comment.text)}</p>
                                            
                                            {/* Reactions - show on hover */}
                                            <div className="flex items-center gap-2 flex-wrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                {Object.entries(comment.reactions || {}).length > 0 && (
                                                    <>
                                                        {Object.entries(comment.reactions || {}).map(([emoji, userIds]) => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => {
                                                                    if (id && !isViewer) addReaction(id, comment.id, emoji);
                                                                }}
                                                                disabled={isViewer}
                                                                className={`text-xs px-2 py-0.5 rounded dark:rounded-none border ${
                                                                    (userIds as string[]).includes(currentUser?.id || '')
                                                                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600'
                                                                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                                }`}
                                                                title={`${(userIds as string[]).map(id => getUserName(id)).join(', ')}`}
                                                            >
                                                                {emoji} {(userIds as string[]).length}
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                                {!isViewer && (
                                                    <div className="flex gap-1">
                                                        {['👍', '❤️', '😄', '🎉'].map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => {
                                                                    if (id) addReaction(id, comment.id, emoji);
                                                                }}
                                                                className="text-xs hover:scale-125 transition-transform"
                                                                title={`React with ${emoji}`}
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-xs text-gray-400 italic">No communications recorded.</p>
                    )}
                </div>
                {!isViewer && (
                    <form onSubmit={handlePostComment} className="flex gap-2">
                        <TerminalInput 
                            value={newComment} 
                            onChange={e => setNewComment(e.target.value)} 
                            placeholder="Enter logs... (use @username to mention)" 
                            className="text-xs"
                        />
                        <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase hover:bg-blue-700 dark:bg-transparent dark:border dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-900/20">
                            SEND
                        </button>
                    </form>
                )}
            </TerminalCard>
          )}

          <TerminalCard title="PARAMETERS" neonColor="cyan">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-500 uppercase tracking-wider mb-2">Status</label>
                <div className="relative">
                    <select 
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    disabled={isViewer}
                    className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-neon-main text-sm rounded-lg dark:rounded-none focus:ring-blue-500 dark:focus:border-neon-main block p-2.5"
                    >
                    {Object.values(TaskStatus).map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                    </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-500 uppercase tracking-wider mb-2">Priority</label>
                <div className="relative">
                    <select 
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    disabled={isViewer}
                    className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-neon-main text-sm rounded-lg dark:rounded-none focus:ring-blue-500 dark:focus:border-neon-main block p-2.5"
                    >
                    {Object.values(Priority).map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                    </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-500 uppercase tracking-wider mb-2">Agent</label>
                <select 
                  value={formData.assignedTo}
                  onChange={(e) => handleChange('assignedTo', e.target.value)}
                  disabled={isViewer}
                  className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-neon-main text-sm rounded-lg dark:rounded-none focus:ring-blue-500 dark:focus:border-neon-main block p-2.5"
                >
                  <option value="">-- UNASSIGNED --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-500 uppercase tracking-wider mb-2">Deadline</label>
                <TerminalInput 
                    type="date"
                    value={formData.deadline || ''}
                    onChange={(e) => handleChange('deadline', e.target.value)}
                    className="text-sm"
                    disabled={isViewer}
                />
              </div>
            </div>
          </TerminalCard>

          {!isNew && (
             <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg dark:rounded-none text-xs text-gray-500 dark:text-gray-600 space-y-2 font-mono border border-transparent dark:border-gray-800">
                 <div className="flex justify-between">
                     <span>CREATED:</span>
                     <span>{(() => {
                         if (!formData.createdAt) return 'N/A';
                         // Convert to number if it's a string (PostgreSQL BIGINT can be a string)
                         const timestamp = typeof formData.createdAt === 'string' 
                             ? parseInt(formData.createdAt, 10) 
                             : Number(formData.createdAt);
                         if (isNaN(timestamp) || timestamp <= 0) return 'N/A';
                         const date = new Date(timestamp);
                         return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                     })()}</span>
                 </div>
                 <div className="flex justify-between">
                     <span>HASH:</span>
                     <span className="truncate w-24">{id}</span>
                 </div>
             </div>
          )}

          {!isNew && (
            <TerminalCard title="SYSTEM_ACTIVITY" neonColor="green">
                <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar font-mono text-xs">
                    {Array.isArray(formData.activityLog) && formData.activityLog.length > 0 ? (
                        formData.activityLog.slice().reverse().map((log) => (
                            <div key={log.id} className="border-b border-gray-100 dark:border-gray-800 pb-2 last:border-b-0">
                                <div className="flex gap-2 items-start mb-1">
                                    <span className="text-gray-400 flex-shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                    <span className="text-blue-600 dark:text-neon-main flex-shrink-0">{getUserName(log.userId)}:</span>
                                    <span className="text-gray-700 dark:text-gray-300 flex-1">{log.action}</span>
                                </div>
                                {log.fieldName && (
                                    <div className="ml-16 space-y-1 text-gray-500 dark:text-gray-600">
                                        <div className="flex gap-2">
                                            <span className="font-semibold text-gray-600 dark:text-gray-500">{log.fieldName}:</span>
                                            {log.oldValue !== undefined && log.newValue !== undefined && (
                                                <>
                                                    <span className="text-red-600 dark:text-red-400 line-through">
                                                        {typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue) : String(log.oldValue)}
                                                    </span>
                                                    <span className="text-gray-400">→</span>
                                                    <span className="text-green-600 dark:text-green-400 font-semibold">
                                                        {typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : String(log.newValue)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-400 italic">System initialization...</div>
                    )}
                </div>
            </TerminalCard>
          )}
        </div>
      </div>
    </div>
  );
};
