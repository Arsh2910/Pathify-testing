// Zero-dependency, lightweight high-performance canvas confetti & Web Audio feedback

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  decay: number;
}

const COLORS = [
  '#3feba8', // Emerald
  '#5cd8da', // Teal
  '#ffc862', // Gold / Amber
  '#1b4332', // Forest Dark
  '#a7ffd1', // Luminous Mint
  '#ffffff', // White
];

export function playSuccessChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();

    // Dual-tone pop/chime (harmonic major chord)
    const tones = [587.33, 880]; // D5, A5
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const delay = idx * 0.04;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.5);
    });
  } catch {
    // AudioContext blocked or not supported
  }
}

export function fireConfetti(originX?: number, originY?: number) {
  playSuccessChime();

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const startX = originX !== undefined ? originX : width / 2;
  const startY = originY !== undefined ? originY : height * 0.6;

  const particles: Particle[] = [];
  const count = 45;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 5 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      alpha: 1,
      decay: 0.015 + Math.random() * 0.02,
    });
  }

  let animationFrameId: number;

  function update() {
    ctx?.clearRect(0, 0, width, height);
    let alive = false;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.vx *= 0.98; // air drag
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      if (p.alpha > 0) {
        alive = true;
        ctx?.save();
        ctx!.globalAlpha = Math.max(0, p.alpha);
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx?.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx?.restore();
      }
    }

    if (alive) {
      animationFrameId = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationFrameId);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  update();
}

export function fireGrandCelebration() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  fireConfetti(w * 0.2, h * 0.5);
  setTimeout(() => fireConfetti(w * 0.8, h * 0.5), 180);
  setTimeout(() => fireConfetti(w * 0.5, h * 0.35), 360);
}
