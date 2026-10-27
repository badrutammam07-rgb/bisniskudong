/**
 * Web Audio API synthesized luxury bell notification
 * Zero external audio files required, runs reliably on mobile & desktop.
 */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a refined, luxury dual-tone chime (Golden Bell)
 */
export function playLuxuryChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Harmonic chord: A5 (880Hz), C#6 (1108Hz), E6 (1318Hz)
    const frequencies = [880, 1108.73, 1318.51];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      // Volume envelope with silky decay
      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.25);
    });
  } catch (err) {
    console.warn('Audio notification unavailable:', err);
  }
}

/**
 * Play an urgent alert tone for H-0 (Due Today)
 */
export function playUrgentAlert(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Double chime sequence
    [0, 0.22].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1046.5, now + offset); // C6

      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.25, now + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.65);
    });
  } catch (err) {
    console.warn('Audio alert unavailable:', err);
  }
}

/**
 * Request notification permissions and send push alert
 */
export async function triggerDeviceNotification(
  title: string,
  body: string
): Promise<void> {
  // Always play the sound
  playLuxuryChime();

  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.warn('Browser notification error:', e);
      }
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    }
  }
}
