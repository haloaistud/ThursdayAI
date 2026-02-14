
import React, { useEffect, useRef } from 'react';

export type VisualizerMode = 'listening' | 'speaking' | 'thinking' | 'idle';

interface VisualizerProps {
  analyzer: AnalyserNode | null;
  mode: VisualizerMode;
  primaryColor?: string;
  secondaryColor?: string;
}

interface Particle {
  x: number;
  y: number;
  angle: number;
  radius: number;
  speed: number;
  alpha: number;
  baseRadius: number;
}

interface Shockwave {
  id: number;
  radius: number;
  alpha: number;
  color: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ 
  analyzer, 
  mode, 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const timeRef = useRef<number>(0);

  // Initialize particles
  useEffect(() => {
    const count = 50;
    const particles: Particle[] = [];
    for(let i=0; i<count; i++) {
      particles.push({
        x: 0, 
        y: 0,
        angle: Math.random() * Math.PI * 2,
        radius: 0,
        baseRadius: Math.random() * 60 + 40,
        speed: Math.random() * 0.02 + 0.005,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const updateSize = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    let animationId: number;
    
    const bufferLength = analyzer ? analyzer.frequencyBinCount : 0;
    const dataArray = analyzer ? new Uint8Array(bufferLength) : new Uint8Array(0);

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      timeRef.current += 0.01;
      
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Soft clear for trails
      ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
      ctx.fillRect(0, 0, width, height);

      // Add composite operation for glowing effect
      ctx.globalCompositeOperation = 'screen';

      if (analyzer) {
        analyzer.getByteFrequencyData(dataArray);
      }

      // Calculate audio metrics
      let volume = 0;
      if (dataArray.length > 0) {
        let sum = 0;
        // Focus on lower frequencies for the "beat"
        const bassCount = Math.floor(dataArray.length * 0.2);
        for(let i=0; i<bassCount; i++) sum += dataArray[i];
        volume = sum / bassCount;
      }
      
      const pulse = volume / 255; // 0.0 to 1.0

      // --- CONFIGURATION BASED ON MODE ---
      let baseColor1 = '255, 204, 0';   // Gold
      let baseColor2 = '255, 100, 0';   // Orange
      let breathingSpeed = 0.05;
      let coreSizeMult = 1;
      let turbulence = 0;

      switch(mode) {
        case 'idle':
          baseColor1 = '0, 200, 255';   // Cyan
          baseColor2 = '0, 100, 255';   // Blue
          breathingSpeed = 0.02;
          coreSizeMult = 0.8;
          turbulence = 0.1;
          break;
        case 'listening':
          baseColor1 = '255, 50, 50';   // Red/Pinkish attention
          baseColor2 = '255, 0, 100';
          breathingSpeed = 0.1;
          coreSizeMult = 1.1;
          turbulence = 0.3;
          break;
        case 'thinking':
          baseColor1 = '180, 0, 255';   // Purple
          baseColor2 = '0, 255, 200';   // Teal
          breathingSpeed = 0.2;
          coreSizeMult = 0.9;
          turbulence = 0.8;
          break;
        case 'speaking':
          baseColor1 = '255, 220, 150'; // Bright Gold/White
          baseColor2 = '255, 150, 50';
          breathingSpeed = 0.1;
          coreSizeMult = 1.2 + (pulse * 0.5);
          turbulence = 0.5 + pulse;
          break;
      }

      // --- 1. SHOCKWAVES (Speaking) ---
      if (mode === 'speaking' && pulse > 0.3 && Math.random() > 0.85) {
         shockwavesRef.current.push({
             id: Date.now(),
             radius: 50 * coreSizeMult,
             alpha: 0.8,
             color: `rgba(${baseColor1},`
         });
      }

      shockwavesRef.current = shockwavesRef.current.filter(wave => wave.alpha > 0.01);
      shockwavesRef.current.forEach(wave => {
          wave.radius += 2;
          wave.alpha *= 0.95;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, wave.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `${wave.color} ${wave.alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
      });


      // --- 2. CORE ORB ---
      // Organic radius using sine waves
      const breathe = Math.sin(Date.now() * 0.002) * 5;
      const audioBump = pulse * 40;
      const r = 50 * coreSizeMult + breathe + audioBump;

      // Inner Core Gradient
      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, r * 1.5);
      grad.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
      grad.addColorStop(0.4, `rgba(${baseColor1}, 0.6)`);
      grad.addColorStop(0.8, `rgba(${baseColor2}, 0.2)`);
      grad.addColorStop(1, `rgba(${baseColor2}, 0)`);

      ctx.beginPath();
      ctx.arc(centerX, centerY, r * 2, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      
      // White hot center
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();


      // --- 3. PARTICLES / ELECTRONS ---
      particlesRef.current.forEach(p => {
          // Move
          p.angle += p.speed + (turbulence * 0.05);
          
          const currentRadius = p.baseRadius + (pulse * 50);
          const x = centerX + Math.cos(p.angle) * currentRadius;
          const y = centerY + Math.sin(p.angle * (mode === 'thinking' ? 2 : 1)) * currentRadius; // Lissajous-ish for thinking

          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${baseColor1}, ${p.alpha})`;
          ctx.fill();

          // Connect to core if close
          if (Math.random() > 0.9 && mode !== 'idle') {
              ctx.beginPath();
              ctx.moveTo(centerX, centerY);
              ctx.lineTo(x, y);
              ctx.strokeStyle = `rgba(${baseColor1}, 0.1)`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
          }
      });

      // --- 4. DATA RINGS (Rotating) ---
      if (mode !== 'idle') {
          const numRings = 3;
          for(let i=1; i<=numRings; i++) {
              ctx.beginPath();
              const ringR = r * (1.5 + i * 0.5);
              const rotation = timeRef.current * (i % 2 === 0 ? 1 : -1) * 0.5;
              
              ctx.ellipse(centerX, centerY, ringR, ringR * 0.8, rotation, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(${baseColor2}, ${0.1 / i})`;
              ctx.lineWidth = 1;
              ctx.stroke();
          }
      }

      ctx.globalCompositeOperation = 'source-over';
    };

    draw();
    return () => {
        window.removeEventListener('resize', updateSize);
        cancelAnimationFrame(animationId);
    };
  }, [analyzer, mode]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full pointer-events-none"
    />
  );
};

export default Visualizer;
