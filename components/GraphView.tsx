
import React, { useEffect, useRef } from 'react';
import { Task, User, TaskStatus } from '../types';

interface GraphViewProps {
    tasks: Task[];
    users: User[];
}

interface Node {
    id: string;
    type: 'USER' | 'TASK';
    label: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
}

interface Link {
    source: string;
    target: string;
}

export const GraphView: React.FC<GraphViewProps> = ({ tasks, users }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- Setup Graph Data ---
        const nodes: Node[] = [];
        const links: Link[] = [];

        // Add Users (Hubs)
        users.forEach(u => {
            nodes.push({
                id: u.id,
                type: 'USER',
                label: u.username,
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: 0,
                vy: 0,
                radius: 20,
                color: '#bd00ff'
            });
        });

        // Add Tasks
        tasks.forEach(t => {
            const isDone = t.status === TaskStatus.DONE;
            nodes.push({
                id: t.id,
                type: 'TASK',
                label: t.id,
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: 0,
                vy: 0,
                radius: 10,
                color: isDone ? '#00ff00' : '#00f3ff'
            });

            if (t.assignedTo) {
                links.push({ source: t.assignedTo, target: t.id });
            }
        });

        // --- Physics Engine ---
        let animationFrameId: number;
        
        const update = () => {
            // Repulsion
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const n1 = nodes[i];
                    const n2 = nodes[j];
                    const dx = n1.x - n2.x;
                    const dy = n1.y - n2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = 500 / (dist * dist);
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    n1.vx += fx;
                    n1.vy += fy;
                    n2.vx -= fx;
                    n2.vy -= fy;
                }
            }

            // Attraction (Links)
            links.forEach(link => {
                const s = nodes.find(n => n.id === link.source);
                const t = nodes.find(n => n.id === link.target);
                if (s && t) {
                    const dx = t.x - s.x;
                    const dy = t.y - s.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = (dist - 100) * 0.005; // Spring length 100
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    s.vx += fx;
                    s.vy += fy;
                    t.vx -= fx;
                    t.vy -= fy;
                }
            });

            // Center Gravity
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            nodes.forEach(n => {
                n.vx += (cx - n.x) * 0.0005;
                n.vy += (cy - n.y) * 0.0005;

                // Damping
                n.vx *= 0.9;
                n.vy *= 0.9;

                // Apply
                n.x += n.vx;
                n.y += n.vy;

                // Bounds
                n.x = Math.max(n.radius, Math.min(canvas.width - n.radius, n.x));
                n.y = Math.max(n.radius, Math.min(canvas.height - n.radius, n.y));
            });
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw Links
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
            ctx.lineWidth = 1;
            links.forEach(link => {
                const s = nodes.find(n => n.id === link.source);
                const t = nodes.find(n => n.id === link.target);
                if (s && t) {
                    ctx.beginPath();
                    ctx.moveTo(s.x, s.y);
                    ctx.lineTo(t.x, t.y);
                    ctx.stroke();
                }
            });

            // Draw Nodes
            nodes.forEach(n => {
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
                ctx.fillStyle = n.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = n.color;
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.fillStyle = '#fff';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(n.label, n.x, n.y + n.radius + 15);
            });
        };

        const loop = () => {
            update();
            draw();
            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => cancelAnimationFrame(animationFrameId);
    }, [tasks, users]);

    return (
        <div className="w-full h-[500px] bg-black border border-gray-800 rounded relative overflow-hidden">
            <div className="absolute top-2 left-2 text-xs text-gray-500 font-mono z-10">NEURAL_NET_VISUALIZER</div>
            <canvas 
                ref={canvasRef} 
                width={800} 
                height={500} 
                className="w-full h-full block"
            />
        </div>
    );
};
