// Safe LocalStorage helpers
function safeStorageGet(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch (e) {
    return fallback;
  }
}

function safeStorageSet(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch (e) {}
}

/**
 * Web Audio API Sound System for Dino Game
 * Provides retro 8-bit sound effects (Jump, Duck, Milestone chime, Hit/Game Over)
 * and an optional procedural chiptune background music loop.
 * Zero external dependencies, zero latency, 100% reliable.
 */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = safeStorageGet('dino_sfx', 'true') !== 'false';
    this.musicEnabled = safeStorageGet('dino_music', 'false') === 'true';
    this.volume = 0.5;

    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    // Music sequencer state
    this.musicTimer = null;
    this.musicStep = 0;
    this.tempo = 140; // BPM
    this.isMusicPlaying = false;

    // Callbacks for UI updates
    this.onStateChange = null;
  }

  /**
   * Initializes or unlocks the AudioContext on the first user interaction.
   */
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        console.warn('Web Audio API not supported in this browser.');
        return;
      }
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 1.0 : 0.0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.35 : 0.0, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      if (this.musicEnabled) {
        this.startMusic();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Retro 8-bit Jump sound: rapid upward frequency sweep (triangle wave)
   */
  playJump() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.12);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {
      console.warn('Audio playJump error:', e);
    }
  }

  /**
   * Duck / Swoosh sound: quick downward frequency sweep
   */
  playDuck() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn('Audio playDuck error:', e);
    }
  }

  /**
   * Iconic Chrome Dino 100-point double chime (ding-ding)
   */
  playMilestone() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Tone 1: 659.25 Hz (E5)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(659.25, now);

      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc1.connect(gain1);
      gain1.connect(this.sfxGain);

      osc1.start(now);
      osc1.stop(now + 0.09);

      // Tone 2: 880.00 Hz (A5), slightly delayed
      const t2 = now + 0.09;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(880, t2);

      gain2.gain.setValueAtTime(0.28, t2);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.16);

      osc2.connect(gain2);
      gain2.connect(this.sfxGain);

      osc2.start(t2);
      osc2.stop(t2 + 0.18);
    } catch (e) {
      console.warn('Audio playMilestone error:', e);
    }
  }

  /**
   * Game Over / Collision sound: noise burst + low downward square tone
   */
  playHit() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Noise burst (crunch impact)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.18);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.19);

      // 2. Low downward square wave
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.29);
    } catch (e) {
      console.warn('Audio playHit error:', e);
    }
  }

  /**
   * Subtle footstep / run click sound (soft retro pulse)
   */
  playStep() {
    if (!this.sfxEnabled) return;
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.025);
    } catch (e) {
      // Ignore step errors
    }
  }

  /**
   * UI Click Sound
   */
  playClick() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  /**
   * Start / Restart Chime
   */
  playStart() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [330, 440, 660];
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const t = now + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.08);
      });
    } catch (e) {}
  }

  /**
   * Procedural Retro 8-Bit Chiptune Background Music
   * Generates a catchy, rhythmic retro loop using Web Audio nodes.
   */
  startMusic() {
    if (this.isMusicPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    this.musicStep = 0;

    // Bassline and melody note tables (frequencies in Hz)
    // Progression: C -> Am -> F -> G
    const bassline = [
      130.81, 130.81, 164.81, 196.00, // C3
      110.00, 110.00, 130.81, 164.81, // A2
      87.31,  87.31,  110.00, 130.81, // F2
      98.00,  98.00,  123.47, 146.83  // G2
    ];

    const melody = [
      523.25, 0, 659.25, 783.99, 659.25, 523.25, 0, 783.99,
      440.00, 0, 523.25, 659.25, 523.25, 440.00, 0, 659.25,
      349.23, 0, 440.00, 523.25, 440.00, 349.23, 0, 523.25,
      392.00, 0, 493.88, 587.33, 493.88, 392.00, 493.88, 587.33
    ];

    const stepDuration = 60 / this.tempo / 2; // 16th notes

    const tick = () => {
      if (!this.isMusicPlaying || !this.ctx) return;

      const now = this.ctx.currentTime;

      // Play bass note (every 2 16th notes = 8th note rhythm)
      if (this.musicStep % 2 === 0) {
        const bassIdx = Math.floor(this.musicStep / 2) % bassline.length;
        const bFreq = bassline[bassIdx];
        if (bFreq > 0) {
          const oscB = this.ctx.createOscillator();
          const gainB = this.ctx.createGain();

          oscB.type = 'triangle';
          oscB.frequency.setValueAtTime(bFreq, now);

          gainB.gain.setValueAtTime(0.2, now);
          gainB.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.8);

          oscB.connect(gainB);
          gainB.connect(this.musicGain);

          oscB.start(now);
          oscB.stop(now + stepDuration * 1.9);
        }
      }

      // Play melody note
      const mIdx = this.musicStep % melody.length;
      const mFreq = melody[mIdx];
      if (mFreq > 0) {
        const oscM = this.ctx.createOscillator();
        const gainM = this.ctx.createGain();

        oscM.type = 'square';
        oscM.frequency.setValueAtTime(mFreq, now);

        gainM.gain.setValueAtTime(0.08, now);
        gainM.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.9);

        oscM.connect(gainM);
        gainM.connect(this.musicGain);

        oscM.start(now);
        oscM.stop(now + stepDuration * 0.95);
      }

      // Drum hi-hat beat on each 16th note
      if (this.musicStep % 2 === 1) {
        const oscH = this.ctx.createOscillator();
        const gainH = this.ctx.createGain();
        oscH.type = 'sawtooth';
        oscH.frequency.setValueAtTime(2500, now);
        gainH.gain.setValueAtTime(0.02, now);
        gainH.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        oscH.connect(gainH);
        gainH.connect(this.musicGain);
        oscH.start(now);
        oscH.stop(now + 0.035);
      }

      this.musicStep++;
      this.musicTimer = setTimeout(tick, stepDuration * 1000);
    };

    tick();
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  /**
   * Toggle Sound Effects ON / OFF
   */
  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    safeStorageSet('dino_sfx', this.sfxEnabled.toString());
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 1.0 : 0.0, this.ctx.currentTime);
    }
    if (this.sfxEnabled) {
      this.playClick();
    }
    if (this.onStateChange) this.onStateChange();
    return this.sfxEnabled;
  }

  /**
   * Toggle Background Music ON / OFF
   */
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    safeStorageSet('dino_music', this.musicEnabled.toString());
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.35 : 0.0, this.ctx.currentTime);
    }
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    if (this.onStateChange) this.onStateChange();
    return this.musicEnabled;
  }

  /**
   * Adjust master volume (0.0 to 1.0)
   */
  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }
}

// Global singleton instance
window.soundManager = new SoundManager();
