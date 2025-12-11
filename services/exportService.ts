import { Task } from '../types';

export const exportToCSV = (tasks: Task[], getProjectName: (id: string) => string, getUserName: (id: string) => string) => {
  const csv = tasks.map(t => ({
    ID: t.id,
    Title: t.title,
    Description: t.description,
    Project: getProjectName(t.projectId),
    Status: t.status,
    Priority: t.priority,
    Agent: getUserName(t.assignedTo || ''),
    Deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : '',
    Completed: t.completedAt ? new Date(t.completedAt).toLocaleDateString() : '',
    TimeSpent: Math.floor((t.timeSpent || 0) / 3600) + 'h ' + Math.floor(((t.timeSpent || 0) % 3600) / 60) + 'm'
  }));
  
  const headers = Object.keys(csv[0] || {});
  const rows = csv.map(row => headers.map(h => `"${String(row[h as keyof typeof row] || '').replace(/"/g, '""')}"`).join(','));
  const csvContent = [headers.join(','), ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `tasks_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

export const exportToJSON = (tasks: Task[]) => {
  const jsonData = {
    exportDate: new Date().toISOString(),
    totalTasks: tasks.length,
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      projectId: t.projectId,
      assignedTo: t.assignedTo,
      createdBy: t.createdBy,
      createdAt: t.createdAt,
      deadline: t.deadline,
      completedAt: t.completedAt,
      status: t.status,
      priority: t.priority,
      timeSpent: t.timeSpent,
      tags: t.tags || [],
      dependsOn: t.dependsOn || [],
      progress: t.progress
    }))
  };
  
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `tasks_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
};

export const exportToPDF = async (tasks: Task[], getProjectName: (id: string) => string, getUserName: (id: string) => string) => {
  // Dynamic import for jspdf
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Tasks Export', margin, yPosition);
  yPosition += 10;
  
  // Export date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Exported on: ${new Date().toLocaleString()}`, margin, yPosition);
  doc.text(`Total tasks: ${tasks.length}`, margin, yPosition + 5);
  yPosition += 15;
  
  // Table headers
  const headers = ['ID', 'Title', 'Status', 'Priority', 'Agent', 'Deadline'];
  const colWidths = [20, 70, 25, 25, 30, 30];
  let xPosition = margin;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  headers.forEach((header, i) => {
    doc.text(header, xPosition, yPosition);
    xPosition += colWidths[i];
  });
  yPosition += 7;
  
  // Draw line
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
  yPosition += 3;
  
  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  tasks.forEach((task, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = margin;
      
      // Redraw headers on new page
      xPosition = margin;
      doc.setFont('helvetica', 'bold');
      headers.forEach((header, i) => {
        doc.text(header, xPosition, yPosition);
        xPosition += colWidths[i];
      });
      yPosition += 7;
      doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
      yPosition += 3;
      doc.setFont('helvetica', 'normal');
    }
    
    xPosition = margin;
    const rowData = [
      task.id.substring(0, 6),
      task.title.substring(0, 30),
      task.status,
      task.priority,
      getUserName(task.assignedTo || '').substring(0, 12),
      task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'
    ];
    
    rowData.forEach((data, i) => {
      doc.text(String(data), xPosition, yPosition);
      xPosition += colWidths[i];
    });
    
    yPosition += 6;
  });
  
  // Save PDF
  doc.save(`tasks_${new Date().toISOString().split('T')[0]}.pdf`);
};

