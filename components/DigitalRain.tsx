
import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export const DigitalRain: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { accentColor } = useApp();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrame: number;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const fontSize = 14;
        const columns = Math.ceil(canvas.width / fontSize);
        const drops: number[] = new Array(columns).fill(1);

        // Characters to display (Katakana + Latin + Digits)
        const chars = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        const getColor = () => {
             // Map accent colors to hex for canvas
             const map = {
                 cyan: '#00f3ff',
                 purple: '#bd00ff',
                 green: '#00ff00',
                 amber: '#ffbf00',
                 pink: '#ff0055'
             };
             return map[accentColor] || '#00ff00';
        };

        // Throttle frame rate for slower animation
        let lastTime = 0;
        const fps = 24; // Lower FPS = Slower Rain
        const interval = 1000 / fps;

        const draw = (timeStamp: number) => {
            animationFrame = requestAnimationFrame(draw);

            const deltaTime = timeStamp - lastTime;
            if (deltaTime < interval) return;

            lastTime = timeStamp - (deltaTime % interval);

            // Semi-transparent black to create trail effect
            // We use a slightly higher opacity here because updates are less frequent
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = getColor();
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                // x = column index * font size, y = drop value * font size
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                // Send drop back to top randomly after it has crossed the screen
                // Randomness ensures drops aren't all synchronized
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                drops[i]++;
            }
        };

        animationFrame = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrame);
        };
    }, [accentColor]);

    return (
        <canvas 
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none opacity-40"
            style={{ mixBlendMode: 'screen' }}
        />
    );
};
