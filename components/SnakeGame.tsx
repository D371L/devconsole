
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SoundService } from '../services/soundService';

const GRID_SIZE = 20;
const SPEED = 100;

export const SnakeGame: React.FC = () => {
    const { snakeMode, toggleSnakeMode, currentUser, showNotification } = useApp();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
    const [food, setFood] = useState({ x: 15, y: 15 });
    const [dir, setDir] = useState({ x: 1, y: 0 });
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        if (!snakeMode) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch(e.key) {
                case 'ArrowUp': if(dir.y === 0) setDir({ x: 0, y: -1 }); break;
                case 'ArrowDown': if(dir.y === 0) setDir({ x: 0, y: 1 }); break;
                case 'ArrowLeft': if(dir.x === 0) setDir({ x: -1, y: 0 }); break;
                case 'ArrowRight': if(dir.x === 0) setDir({ x: 1, y: 0 }); break;
                case 'Escape': toggleSnakeMode(); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        
        const gameLoop = setInterval(() => {
            if (gameOver) return;

            setSnake(prev => {
                const newHead = { x: prev[0].x + dir.x, y: prev[0].y + dir.y };
                
                // Wall Collision
                if (newHead.x < 0 || newHead.x >= 30 || newHead.y < 0 || newHead.y >= 20) {
                    setGameOver(true);
                    SoundService.playError();
                    return prev;
                }

                // Self Collision
                if (prev.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
                    setGameOver(true);
                    SoundService.playError();
                    return prev;
                }

                const newSnake = [newHead, ...prev];
                
                // Eat Food
                if (newHead.x === food.x && newHead.y === food.y) {
                    setScore(s => s + 10);
                    SoundService.playSuccess();
                    setFood({
                        x: Math.floor(Math.random() * 30),
                        y: Math.floor(Math.random() * 20)
                    });
                } else {
                    newSnake.pop();
                }

                return newSnake;
            });
        }, SPEED);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearInterval(gameLoop);
        };
    }, [snakeMode, dir, food, gameOver]); // eslint-disable-line

    const restart = () => {
        setSnake([{ x: 10, y: 10 }]);
        setScore(0);
        setGameOver(false);
        setDir({ x: 1, y: 0 });
    };

    if (!snakeMode) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center backdrop-blur-sm animate-fade-in">
            <div className="relative border-4 border-neon-main rounded-lg p-2 bg-black shadow-[0_0_20px_var(--neon-primary)]">
                <div className="flex justify-between items-center mb-2 font-mono text-neon-main">
                    <span>PROTOCOL_SNAKE</span>
                    <span>SCORE: {score}</span>
                </div>
                <canvas 
                    ref={canvasRef}
                    width={600} // 30 * 20
                    height={400} // 20 * 20
                    className="bg-gray-900 block"
                />
                
                {/* Rendering logic is simpler via direct DOM manipulation in React for this simple grid */}
                <div className="absolute top-[52px] left-[12px] w-[600px] h-[400px] pointer-events-none">
                     {/* Food */}
                     <div 
                        className="absolute w-[20px] h-[20px] bg-red-500 rounded-full shadow-[0_0_10px_red]"
                        style={{ left: food.x * 20, top: food.y * 20 }}
                     />
                     {/* Snake */}
                     {snake.map((seg, i) => (
                         <div 
                            key={i}
                            className="absolute w-[20px] h-[20px] bg-neon-main border border-black"
                            style={{ left: seg.x * 20, top: seg.y * 20, opacity: 1 - i/(snake.length + 5) }}
                         />
                     ))}
                </div>

                {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                        <h2 className="text-4xl font-bold text-red-500 mb-4 font-mono">CONNECTION_TERMINATED</h2>
                        <div className="flex gap-4">
                            <button onClick={restart} className="px-4 py-2 bg-neon-main text-black font-bold font-mono hover:bg-white">RETRY</button>
                            <button onClick={toggleSnakeMode} className="px-4 py-2 border border-white text-white font-bold font-mono hover:bg-gray-800">EXIT</button>
                        </div>
                    </div>
                )}
                
                <div className="mt-2 text-center text-xs text-gray-500 font-mono">
                    ARROWS to Move • ESC to Exit
                </div>
            </div>
        </div>
    );
};
