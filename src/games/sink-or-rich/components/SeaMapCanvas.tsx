import React, { useRef, useEffect } from 'react';
import { VoyageState, Ship, SeaEntity, PlayerState } from '../types';
import { getVoyageDestinationPosition } from '../engine';

interface Props {
  player: PlayerState;
  voyage: VoyageState;
  ship: Ship | null;
  onMove: (dx: number, dy: number) => void;
  isPaused: boolean;
}

export const SeaMapCanvas: React.FC<Props> = ({ player, voyage, ship, onMove, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const requestRef = useRef<number>(0);
  const angleRef = useRef<number>(-Math.PI / 2);
  const pointerStateRef = useRef({ isDown: false, startX: 0, startY: 0, x: 0, y: 0 });
  const lastTimeRef = useRef<number>(performance.now());
  const particlesRef = useRef<{ x: number; y: number; life: number; maxLife: number; size: number }[]>([]);

  // Use refs for props that update frequently to prevent re-running the heavy useEffect
  const voyageRef = useRef(voyage);
  const shipRef = useRef(ship);
  const playerRef = useRef(player);
  const isPausedRef = useRef(isPaused);
  const onMoveRef = useRef(onMove);

  useEffect(() => { voyageRef.current = voyage; }, [voyage]);
  useEffect(() => { shipRef.current = ship; }, [ship]);
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);
  
  // Fish schools for environment flavor
  const fishRef = useRef(
    Array.from({ length: 15 }).map(() => ({
      x: Math.random() * voyage.mapWidth,
      y: Math.random() * voyage.mapHeight,
      dx: (Math.random() - 0.5) * 40,
      dy: (Math.random() - 0.5) * 40
    }))
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; keysRef.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; keysRef.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resize
    const observer = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    });
    observer.observe(canvas);

    const loop = (time: number) => {
      requestRef.current = requestAnimationFrame(loop);
      
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (isPausedRef.current) return;

      const currentVoyage = voyageRef.current;
      const vpWidth = canvas.width;
      const vpHeight = canvas.height;
      if (vpWidth === 0 || vpHeight === 0) return;

      // Camera follows player
      const mapWidth = currentVoyage.mapWidth;
      const mapHeight = currentVoyage.mapHeight;
      let camX = currentVoyage.playerPosition.x - vpWidth / 2;
      let camY = currentVoyage.playerPosition.y - vpHeight / 2;
      
      // Clamp camera
      camX = Math.max(0, Math.min(camX, mapWidth - vpWidth));
      camY = Math.max(0, Math.min(camY, mapHeight - vpHeight));

      // Handle pointer and keyboard input
      let dx = 0;
      let dy = 0;

      if (keysRef.current['ArrowUp'] || keysRef.current['w']) dy -= 1;
      if (keysRef.current['ArrowDown'] || keysRef.current['s']) dy += 1;
      if (keysRef.current['ArrowLeft'] || keysRef.current['a']) dx -= 1;
      if (keysRef.current['ArrowRight'] || keysRef.current['d']) dx += 1;

      if (dx === 0 && dy === 0 && pointerStateRef.current.isDown) {
        // Relative drag joystick
        const pointerDx = pointerStateRef.current.x - pointerStateRef.current.startX;
        const pointerDy = pointerStateRef.current.y - pointerStateRef.current.startY;
        const dist = Math.sqrt(pointerDx * pointerDx + pointerDy * pointerDy);
        
        if (dist > 10) { // Deadzone
           dx = pointerDx;
           dy = pointerDy;
        }
      }

      // Normalize diagonal speed
      let isMoving = false;
      if (dx !== 0 || dy !== 0) {
        isMoving = true;
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
        angleRef.current = Math.atan2(dy, dx);
        
        // Multiply by dt * 60 to make speed frame-rate independent
        onMoveRef.current(dx * dt * 60, dy * dt * 60);
      }

      // Clear
      ctx.clearRect(0, 0, vpWidth, vpHeight);

      // Sea Background
      ctx.fillStyle = '#0f5e9c';
      ctx.fillRect(0, 0, vpWidth, vpHeight);
      
      // Grid lines (for sense of movement)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 100;
      const offsetX = camX % gridSize;
      const offsetY = camY % gridSize;
      
      ctx.beginPath();
      for (let x = -offsetX; x < vpWidth; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, vpHeight); }
      for (let y = -offsetY; y < vpHeight; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(vpWidth, y); }
      ctx.stroke();

      // Draw Fish
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 5; i++) {
        const fx = ((time / 30 + i * 200) % (vpWidth + 100)) - 50;
        const fy = vpHeight / 2 + Math.sin(time / 500 + i) * 50 + i * 60;
        ctx.beginPath();
        ctx.ellipse(fx, fy, 8, 4, Math.sin(time / 200) * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw destination coastline (y <= 150)
      if (camY < 200) {
        ctx.fillStyle = '#c2b280'; // Sand color
        ctx.beginPath();
        ctx.moveTo(0, 150 - camY);
        for(let i=0; i<=vpWidth; i+=50) {
          ctx.lineTo(i, 150 - camY + Math.sin(i/30 + time/1000)*10);
        }
        ctx.lineTo(vpWidth, 0);
        ctx.lineTo(0, 0);
        ctx.fill();
        
        ctx.fillStyle = '#2d4c1e'; // Greenery
        ctx.fillRect(0, 0, vpWidth, 100 - camY);

        // Draw Port City and Docks
        const destinationPosition = getVoyageDestinationPosition(currentVoyage);
        const portX = destinationPosition.x - camX;
        const portY = destinationPosition.y - 10 - camY;

        // Docks (Wooden piers extending into water)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(portX - 20, portY, 40, 60); // A single, nice wide dock
        
        // A large Anchor or Flag icon to denote Port
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(portX, portY - 30, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B0000';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚓', portX, portY - 30);
      }

      // Draw Entities
      for (const entity of currentVoyage.entities) {
        if (!entity.resolved) {
          const ex = entity.x - camX;
          const ey = entity.y - camY;
          // Only draw if roughly in viewport
          if (ex > -100 && ex < vpWidth + 100 && ey > -100 && ey < vpHeight + 100) {
            drawEntity(ctx, entity.type, entity.eventId, ex, ey, entity.radius, time);
          }
        }
      }

      // Update and draw Wake Particles
      if (isMoving && Math.random() > 0.3) {
        // spawn behind the ship
        const spawnX = currentVoyage.playerPosition.x - Math.cos(angleRef.current) * 15 + (Math.random() - 0.5) * 5;
        const spawnY = currentVoyage.playerPosition.y - Math.sin(angleRef.current) * 15 + (Math.random() - 0.5) * 5;
        particlesRef.current.push({ x: spawnX, y: spawnY, life: 1.0, maxLife: 1.0, size: 2 + Math.random() * 3 });
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life -= dt * 0.6; // lifetime fade
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        } else {
          p.size += dt * 8; // expand
          const pxParticle = p.x - camX;
          const pyParticle = p.y - camY;
          if (pxParticle > -20 && pxParticle < vpWidth + 20 && pyParticle > -20 && pyParticle < vpHeight + 20) {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife) * 0.5;
            ctx.beginPath();
            ctx.arc(pxParticle, pyParticle, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1.0;

      // Draw Player Ship
      const px = currentVoyage.playerPosition.x - camX;
      const py = currentVoyage.playerPosition.y - camY;

      ctx.save();
      try {
        ctx.translate(px, py);
        ctx.rotate(angleRef.current + Math.PI / 2);
        
        // Add shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        
        drawPlayerShip(ctx, shipRef.current?.id, time, isMoving);
      } finally {
        ctx.restore();
      }

      // --- Fog of War Overlay ---
      const hasWatchtower = playerRef.current.ownedArmor?.some(a => a.id === 'armor_watchtower');
      const visibilityRadius = hasWatchtower ? 800 : 500;

      const grad = ctx.createRadialGradient(px, py, 30, px, py, visibilityRadius);
      grad.addColorStop(0, 'rgba(10, 15, 20, 0)');
      grad.addColorStop(0.6, 'rgba(10, 15, 20, 0.6)');
      grad.addColorStop(1, 'rgba(10, 15, 20, 0.98)'); // Dense fog outside
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, vpWidth, vpHeight);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      observer.disconnect();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []); // Empty dependency array so loop never restarts

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      pointerStateRef.current = { isDown: true, startX: px, startY: py, x: px, y: py };
    }
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerStateRef.current.isDown) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        pointerStateRef.current.x = e.clientX - rect.left;
        pointerStateRef.current.y = e.clientY - rect.top;
      }
    }
  };
  const handlePointerUp = () => { pointerStateRef.current.isDown = false; };

  return (
    <canvas 
      ref={canvasRef} 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ 
        width: '100%',
        height: '65vh',
        border: '4px solid #fff', 
        borderRadius: '8px', 
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
        display: 'block',
        margin: '0 auto',
        touchAction: 'none'
      }} 
    />
  );
};

function drawEntity(ctx: CanvasRenderingContext2D, type: SeaEntity['type'], eventId: string, x: number, y: number, r: number, time: number) {
  ctx.save();
  try {
    ctx.translate(x, y);

    switch (type) {
      case 'reef':
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(r*0.5, r); ctx.lineTo(-r*0.8, r*0.8); ctx.fill();
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(0, -r*0.5); ctx.lineTo(r*0.5, 0); ctx.lineTo(0, r*0.5); ctx.fill();
        break;
      case 'storm':
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)';
        ctx.lineWidth = 4;
        ctx.rotate(time / 200);
        ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 1.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r * 0.5, Math.PI, Math.PI * 2.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2); ctx.stroke();
        break;
      case 'cargo':
        ctx.scale(r / 40, r / 40);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-15, -15, 30, 30);
        ctx.strokeStyle = '#D2B48C';
        ctx.lineWidth = 2;
        ctx.strokeRect(-15, -15, 30, 30);
        ctx.beginPath(); ctx.moveTo(-15, -15); ctx.lineTo(15, 15); ctx.stroke();
        break;
      case 'island':
        ctx.fillStyle = '#e3c16f';
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2d4c1e';
        ctx.beginPath(); ctx.arc(-5, -5, r * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, 5, r * 0.4, 0, Math.PI * 2); ctx.fill();
        break;
      case 'black_market':
        ctx.scale(r / 40, r / 40);
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#800080';
        ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(20, 10); ctx.lineTo(-20, 10); ctx.fill();
        break;
      case 'monster':
        drawMonsterEntity(ctx, eventId, r, time);
        break;
      case 'pirate':
      case 'merchant':
      case 'patrol':
        ctx.scale(r / 40, r / 40);
        ctx.rotate(Math.sin(time/500)*0.2);
        ctx.fillStyle = type === 'pirate' ? '#333' : (type === 'patrol' ? '#4682B4' : '#A0522D');
        ctx.beginPath(); 
        ctx.moveTo(0, -20); ctx.quadraticCurveTo(10, -10, 10, 0); ctx.quadraticCurveTo(10, 10, 0, 20); ctx.quadraticCurveTo(-10, 10, -10, 0); ctx.quadraticCurveTo(-10, -10, 0, -20);
        ctx.fill();
        ctx.fillStyle = type === 'pirate' ? '#8B0000' : '#fff';
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.quadraticCurveTo(15, 0, 0, 5); ctx.fill();
        break;
      case 'siren':
        ctx.scale(r / 40, r / 40);
        ctx.fillStyle = '#555';
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath(); ctx.arc(0, -5, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('♪', 15, -15 + Math.sin(time/200)*5);
        break;
    }
  } finally {
    ctx.restore();
  }
}

function drawMonsterEntity(ctx: CanvasRenderingContext2D, eventId: string, r: number, time: number) {
  ctx.scale(r / 40, r / 40);

  if (eventId === 'event_sea_serpent') {
    ctx.rotate(Math.sin(time / 400) * 0.18);
    ctx.strokeStyle = '#1f8f64';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-30, 18);
    ctx.bezierCurveTo(-12, -18, 15, 22, 32, -10);
    ctx.stroke();
    ctx.strokeStyle = '#63d49a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-22, 12);
    ctx.bezierCurveTo(-6, -8, 14, 14, 26, -6);
    ctx.stroke();
    ctx.fillStyle = '#1f8f64';
    ctx.beginPath();
    ctx.ellipse(33, -11, 10, 7, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(37, -14, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a3d2b';
    ctx.beginPath();
    ctx.moveTo(42, -10);
    ctx.lineTo(51, -14);
    ctx.lineTo(42, -6);
    ctx.fill();
    return;
  }

  if (eventId === 'event_white_whale') {
    ctx.rotate(Math.sin(time / 600) * 0.08);
    ctx.fillStyle = '#e8f6ff';
    ctx.strokeStyle = '#7bb7d8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 16, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#b9dff2';
    ctx.beginPath();
    ctx.moveTo(-26, -2);
    ctx.quadraticCurveTo(-43, -18, -38, 3);
    ctx.quadraticCurveTo(-46, 15, -25, 7);
    ctx.fill();
    ctx.fillStyle = '#6fb5d6';
    ctx.beginPath();
    ctx.arc(12, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232, 246, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -17);
    ctx.quadraticCurveTo(4, -28, 11, -36 + Math.sin(time / 220) * 3);
    ctx.stroke();
    return;
  }

  if (eventId === 'event_leviathan') {
    ctx.rotate(Math.sin(time / 550) * 0.12);
    ctx.fillStyle = '#1b2337';
    ctx.strokeStyle = '#5f6f95';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.quadraticCurveTo(30, -26, 34, 3);
    ctx.quadraticCurveTo(20, 34, -12, 30);
    ctx.quadraticCurveTo(-38, 15, -30, -15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#37476f';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 11, -27 + Math.abs(i) * 2);
      ctx.lineTo(i * 11 + 5, -45 + Math.abs(i) * 5);
      ctx.lineTo(i * 11 + 10, -24 + Math.abs(i) * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f9c74f';
    ctx.beginPath();
    ctx.arc(12, -7, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b00020';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-24, 20);
    ctx.quadraticCurveTo(-48, 33, -58, 10 + Math.sin(time / 200) * 4);
    ctx.stroke();
    return;
  }

  ctx.fillStyle = '#800080';
  ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#800080';
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.quadraticCurveTo(15, 20, 0, 30 + Math.sin(time / 200 + i) * 10); ctx.stroke();
  }
}

function drawPlayerShip(ctx: CanvasRenderingContext2D, shipId: string | undefined, time: number, isMoving: boolean) {
  // Draw water wake behind the ship only when moving
  if (isMoving) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time / 100) * 0.1})`;
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(15, 40 + Math.random() * 5);
    ctx.lineTo(-15, 40 + Math.random() * 5);
    ctx.fill();
  }

  if (shipId === 'ship_fishing' || !shipId) {
    // ---- 小渔船 (Fishing Boat) ----
    // 较小、轻快的浅色木船
    ctx.fillStyle = '#D2B48C'; // 浅木色
    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = 2;
    ctx.beginPath(); 
    ctx.moveTo(0, -20); // 尖船头
    ctx.quadraticCurveTo(10, -5, 10, 15); // 右舷
    ctx.lineTo(-10, 15); // 平船尾
    ctx.quadraticCurveTo(-10, -5, 0, -20); // 左舷
    ctx.fill(); ctx.stroke();
    
    // 甲板小物件
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(-4, 5, 8, 8); // 小木箱

    // 单片白帆
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath(); 
    ctx.moveTo(0, -12); 
    ctx.quadraticCurveTo(15, 2, 0, 10); 
    ctx.quadraticCurveTo(-15, 2, 0, -12); 
    ctx.fill(); ctx.stroke();
    
  } else if (shipId === 'ship_merchant') {
    // ---- 商船 (Merchant Ship) ----
    // 宽大、胖胖的深色木船，满载货物
    ctx.fillStyle = '#8B4513';
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -30); // 圆润的船头
    ctx.quadraticCurveTo(18, -10, 18, 15); 
    ctx.quadraticCurveTo(15, 25, 0, 25); // 圆船尾
    ctx.quadraticCurveTo(-15, 25, -18, 15); 
    ctx.quadraticCurveTo(-18, -10, 0, -30);
    ctx.fill(); ctx.stroke();

    // 多彩的货物箱
    ctx.fillStyle = '#CD853F'; ctx.fillRect(-10, -5, 8, 10);
    ctx.fillStyle = '#556B2F'; ctx.fillRect(2, -2, 8, 8);
    ctx.fillStyle = '#4682B4'; ctx.fillRect(-5, 8, 10, 10);

    // 两面宽大的方帆
    ctx.fillStyle = 'rgba(245, 245, 220, 0.95)'; // 米白色帆
    ctx.beginPath(); ctx.moveTo(-20, -15); ctx.quadraticCurveTo(0, 0, 20, -15); ctx.lineTo(20, -5); ctx.quadraticCurveTo(0, 10, -20, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-18, 5); ctx.quadraticCurveTo(0, 20, 18, 5); ctx.lineTo(18, 15); ctx.quadraticCurveTo(0, 30, -18, 15); ctx.closePath(); ctx.fill(); ctx.stroke();

  } else if (shipId === 'ship_heavy') {
    // ---- 重甲运输船 (Heavy Ship) ----
    // 巨大、方正，覆盖铁甲
    ctx.fillStyle = '#4A3C31';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-15, -40); ctx.lineTo(15, -40); // 平方船头
    ctx.lineTo(22, -20); ctx.lineTo(22, 30); ctx.lineTo(15, 40);
    ctx.lineTo(-15, 40); ctx.lineTo(-22, 30); ctx.lineTo(-22, -20);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // 铁甲铆钉边框
    ctx.strokeStyle = '#778899'; // 灰蓝色装甲板
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-22, -15); ctx.lineTo(-22, 25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, -15); ctx.lineTo(22, 25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, -40); ctx.lineTo(10, -40); ctx.stroke();

    // 三面厚重的帆
    ctx.fillStyle = 'rgba(200, 200, 190, 0.9)';
    [-25, 0, 25].forEach(y => {
      ctx.beginPath(); ctx.moveTo(-25, y-10); ctx.quadraticCurveTo(0, y+5, 25, y-10); ctx.lineTo(25, y); ctx.quadraticCurveTo(0, y+15, -25, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    });

  } else if (shipId === 'ship_war') {
    // ---- 战船 (Warship) ----
    // 修长、锐利，挂着血红战帆和火炮
    ctx.fillStyle = '#2F4F4F'; // 暗沉深绿灰
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath(); 
    ctx.moveTo(0, -45); // 极尖的撞角
    ctx.lineTo(14, -15); ctx.lineTo(14, 25); ctx.lineTo(0, 35); ctx.lineTo(-14, 25); ctx.lineTo(-14, -15); 
    ctx.closePath(); 
    ctx.fill(); ctx.stroke();

    // 船舷两侧的黑色火炮
    ctx.fillStyle = '#111';
    [-10, 5, 20].forEach(y => { 
      ctx.fillRect(-18, y, 6, 4); // 左侧炮管
      ctx.fillRect(12, y, 6, 4);  // 右侧炮管
    });

    // 船尾的海盗/战斗黑旗
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(8, 28); ctx.lineTo(0, 20); ctx.fill();

    // 两面血红色的三角+方帆混合
    ctx.fillStyle = 'rgba(139, 0, 0, 0.95)'; // 暗红
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(20, -10, 0, 0); ctx.quadraticCurveTo(-20, -10, 0, -30); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-20, 5); ctx.quadraticCurveTo(0, 20, 20, 5); ctx.lineTo(20, 15); ctx.quadraticCurveTo(0, 30, -20, 15); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (shipId === 'ship_junk') {
    // ---- 东方大福船 (Junk) ----
    // 宽大的船身和多层红帆，突出东方贸易船的辨识度
    ctx.fillStyle = '#9B5A2E';
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.quadraticCurveTo(24, -18, 24, 22);
    ctx.lineTo(12, 36);
    ctx.lineTo(-12, 36);
    ctx.lineTo(-24, 22);
    ctx.quadraticCurveTo(-24, -18, 0, -36);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#D7A85D';
    ctx.fillRect(-14, -5, 28, 30);
    ctx.fillStyle = '#6B3F20';
    [-16, 0, 16].forEach(x => {
      ctx.fillRect(x - 1, -30, 2, 58);
    });

    ctx.fillStyle = 'rgba(196, 38, 38, 0.95)';
    [-22, 0, 22].forEach((y, index) => {
      const width = 36 - index * 4;
      ctx.beginPath();
      ctx.moveTo(-width / 2, y - 8);
      ctx.quadraticCurveTo(0, y + 3, width / 2, y - 8);
      ctx.lineTo(width / 2, y + 5);
      ctx.quadraticCurveTo(0, y + 16, -width / 2, y + 5);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    });
  } else if (shipId === 'ship_ultimate') {
    // ---- 海神无畏号 (Ultimate Ship) ----
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.lineTo(20, -20);
    ctx.lineTo(22, 28);
    ctx.lineTo(0, 48);
    ctx.lineTo(-22, 28);
    ctx.lineTo(-20, -20);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-3, -42, 6, 82);
    [-18, 0, 18].forEach(y => {
      ctx.beginPath();
      ctx.moveTo(-28, y - 12);
      ctx.quadraticCurveTo(0, y + 8, 28, y - 12);
      ctx.lineTo(22, y + 8);
      ctx.quadraticCurveTo(0, y + 22, -22, y + 8);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    });
  } else {
    ctx.fillStyle = '#D2B48C';
    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.quadraticCurveTo(12, -6, 12, 18);
    ctx.lineTo(-12, 18);
    ctx.quadraticCurveTo(-12, -6, 0, -24);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
}
