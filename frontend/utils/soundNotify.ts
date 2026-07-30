// FILE: frontend/utils/soundNotify.ts
// Utilidad de aviso sonoro para la pantalla de cocina usando la Web Audio API (AudioContext).
// No requiere archivos externos (.mp3 / .wav) y funciona de forma offline y 100% confiable.

const STORAGE_KEY = 'kitchen_sound_muted';

let sharedAudioCtx: AudioContext | null = null;
let isUnlocked = false;

/**
 * Desbloquea y reanuda el AudioContext en la primera interacción del usuario con la ventana
 * para cumplir con la política de autoplay del navegador.
 */
export const unlockAudioContext = (): void => {
  if (isUnlocked && sharedAudioCtx && sharedAudioCtx.state === 'running') return;

  const unlock = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!sharedAudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
      if (sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume();
      }
      isUnlocked = true;
    } catch {
      // ignore
    }
  };

  if (typeof window !== 'undefined') {
    const events = ['click', 'touchstart', 'keydown', 'pointerdown'];
    events.forEach(event => window.addEventListener(event, unlock, { once: true, passive: true }));
  }
};

/**
 * Obtiene el estado de silencio de la cocina desde localStorage.
 */
export const getSoundMuted = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Establece el estado de silencio de la cocina en localStorage.
 */
export const setSoundMuted = (muted: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEY, String(muted));
  } catch (error) {
    console.error('Error guardando configuración de sonido:', error);
  }
};

/**
 * Alterna el estado de silencio y devuelve el nuevo estado.
 */
export const toggleSoundMuted = (): boolean => {
  const next = !getSoundMuted();
  setSoundMuted(next);
  return next;
};

/**
 * Reproduce el aviso sonoro de campana de cocina ("Ding-Dong") mediante síntesis en Web Audio API.
 * Se reproduce automáticamente al recibir la orden sin requerir botones adicionales.
 */
export const playNotificationSound = (force = false): void => {
  if (!force && getSoundMuted()) {
    return;
  }

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      console.warn('El navegador no soporta Web Audio API');
      return;
    }

    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }

    const ctx = sharedAudioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {/* ignore */});
    }

    const now = ctx.currentTime;

    const playBellNote = (freq: number, startTime: number, duration: number, gainValue = 0.35) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);

      const oscHarmonic = ctx.createOscillator();
      const gainHarmonic = ctx.createGain();

      oscHarmonic.type = 'triangle';
      oscHarmonic.frequency.setValueAtTime(freq * 2.756, startTime);

      gainHarmonic.gain.setValueAtTime(0.001, startTime);
      gainHarmonic.gain.exponentialRampToValueAtTime(gainValue * 0.15, startTime + 0.01);
      gainHarmonic.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.4);

      oscHarmonic.connect(gainHarmonic);
      gainHarmonic.connect(ctx.destination);

      oscHarmonic.start(startTime);
      oscHarmonic.stop(startTime + duration * 0.4);
    };

    // Nota 1: G5 (783.99 Hz) -> "Ding"
    playBellNote(783.99, now, 0.45, 0.35);

    // Nota 2: C6 (1046.50 Hz) -> "Dong"
    playBellNote(1046.50, now + 0.18, 0.75, 0.45);

  } catch (error) {
    console.error('Error al reproducir el sonido de notificación en cocina:', error);
  }
};
