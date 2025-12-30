import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Task, TaskStatus } from '../types';

export const CalendarPage: React.FC = () => {
  const { tasks, users, projects } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Get tasks created on the specified date
  const getTasksCreatedOn = (date: Date): Task[] => {
    return tasks.filter(task => {
      const createdDate = new Date(task.createdAt);
      return createdDate.toDateString() === date.toDateString();
    });
  };

  // Get tasks that changed to IN_PROGRESS on the specified date
  const getTasksInProgressOn = (date: Date): Task[] => {
    return tasks.filter(task => {
      if (!Array.isArray(task.activityLog)) return false;
      const inProgressLog = task.activityLog.find(
        log => log.action === 'Changed status to IN_PROGRESS'
      );
      if (!inProgressLog) return false;
      const progressDate = new Date(inProgressLog.timestamp);
      return progressDate.toDateString() === date.toDateString();
    });
  };

  // Get tasks with deadline on the specified date
  const getTasksWithDeadlineOn = (date: Date): Task[] => {
    return tasks.filter(task => {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      return deadline.toDateString() === date.toDateString();
    });
  };

  // Get all events for the specified date
  const getEventsForDate = (date: Date) => {
    return {
      created: getTasksCreatedOn(date),
      inProgress: getTasksInProgressOn(date),
      deadlines: getTasksWithDeadlineOn(date)
    };
  };

  // Check for events on date
  const hasEventsOnDate = (date: Date): { created: boolean; inProgress: boolean; deadlines: boolean } => {
    const events = getEventsForDate(date);
    return {
      created: events.created.length > 0,
      inProgress: events.inProgress.length > 0,
      deadlines: events.deadlines.length > 0
    };
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
    setSelectedDate(null);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Calendar</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          View task creation dates, progress milestones, and deadlines
        </p>
      </div>

      {/* Calendar - compact, centered */}
      <div className="flex justify-center mb-6">
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg dark:rounded-none shadow-sm p-4 max-w-md w-full">
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => navigateMonth(-1)} 
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ←
            </button>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {monthNames[month]} {year}
            </h2>
            <button 
              onClick={() => navigateMonth(1)} 
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              →
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-500 dark:text-gray-600 py-1">
                {day.substring(0, 1)}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            if (!date) {
              return <div key={idx} className="aspect-square"></div>;
            }

            const events = hasEventsOnDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`
                  aspect-square p-1 cursor-pointer rounded dark:rounded-none border flex flex-col items-center justify-center relative
                  ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-neon-cyan' : ''}
                  ${isSelected && !isToday ? 'bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-600' : ''}
                  ${!isToday && !isSelected ? 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-900' : ''}
                `}
              >
                <div className="text-sm font-mono text-gray-900 dark:text-gray-100 mb-0.5">
                  {date.getDate()}
                </div>
                
                {/* Event dots */}
                <div className="flex gap-0.5 justify-center flex-wrap">
                  {events.created && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Tasks created"></div>
                  )}
                  {events.inProgress && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Tasks in progress"></div>
                  )}
                  {events.deadlines && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Deadlines"></div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Selected date events */}
      {selectedDate && selectedEvents && (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg dark:rounded-none shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            Events on {selectedDate.toLocaleDateString()}
          </h3>

          {/* Created tasks */}
          {selectedEvents.created.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                Created ({selectedEvents.created.length})
              </h4>
              <div className="space-y-2">
                {selectedEvents.created.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  const creator = users.find(u => u.id === task.createdBy);
                  return (
                    <Link
                      key={task.id}
                      to={`/task/${task.id}`}
                      className="block p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded dark:rounded-none hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">{task.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Created by {creator?.username || 'Unknown'} • {project?.name || 'No project'}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* In progress tasks */}
          {selectedEvents.inProgress.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                Started ({selectedEvents.inProgress.length})
              </h4>
              <div className="space-y-2">
                {selectedEvents.inProgress.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  const assignee = users.find(u => u.id === task.assignedTo);
                  return (
                    <Link
                      key={task.id}
                      to={`/task/${task.id}`}
                      className="block p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded dark:rounded-none hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">{task.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Assigned to {assignee?.username || 'Unassigned'} • {project?.name || 'No project'}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deadline tasks */}
          {selectedEvents.deadlines.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                Deadlines ({selectedEvents.deadlines.length})
              </h4>
              <div className="space-y-2">
                {selectedEvents.deadlines.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  const assignee = users.find(u => u.id === task.assignedTo);
                  const isOverdue = new Date(task.deadline!) < new Date() && task.status !== TaskStatus.DONE;
                  return (
                    <Link
                      key={task.id}
                      to={`/task/${task.id}`}
                      className={`block p-3 border rounded dark:rounded-none transition-colors ${
                        isOverdue
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30'
                          : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/20'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">{task.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {isOverdue && <span className="text-red-600 dark:text-red-400 font-bold">OVERDUE • </span>}
                        Assigned to {assignee?.username || 'Unassigned'} • {project?.name || 'No project'}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* No events */}
          {selectedEvents.created.length === 0 && 
           selectedEvents.inProgress.length === 0 && 
           selectedEvents.deadlines.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No events on this date
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg dark:rounded-none shadow-sm p-4">
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider mb-3">
          Legend
        </h4>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-gray-700 dark:text-gray-300">Tasks created</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-700 dark:text-gray-300">Tasks started (IN_PROGRESS)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-700 dark:text-gray-300">Deadlines</span>
          </div>
        </div>
      </div>
    </div>
  );
};

