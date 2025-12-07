
// Retro Sound Synthesizer using Web Audio API
// No external files required

const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
let isMuted = false;

const playTone = (freq: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
    if (isMuted) return;
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
};

export const SoundService = {
    setMuted: (muted: boolean) => {
        isMuted = muted;
    },
    playHover: () => {
        // Very short high blip
        playTone(800, 'sine', 0.05, 0.02);
    },
    playClick: () => {
        // Mechanical click
        playTone(300, 'square', 0.1, 0.05);
    },
    playSuccess: () => {
        // High arpeggio
        setTimeout(() => playTone(600, 'sine', 0.1, 0.1), 0);
        setTimeout(() => playTone(800, 'sine', 0.1, 0.1), 100);
        setTimeout(() => playTone(1200, 'sine', 0.2, 0.1), 200);
    },
    playError: () => {
        // Low buzz
        playTone(150, 'sawtooth', 0.3, 0.1);
    },
    playNotification: () => {
        // Attention ping
        playTone(500, 'sine', 0.1, 0.05);
        setTimeout(() => playTone(500, 'sine', 0.3, 0.05), 150);
    },
    playStartTimer: () => {
        playTone(440, 'square', 0.1, 0.05);
        setTimeout(() => playTone(880, 'square', 0.3, 0.05), 100);
    },
    playStopTimer: () => {
        playTone(880, 'square', 0.1, 0.05);
        setTimeout(() => playTone(440, 'square', 0.3, 0.05), 100);
    }
};
