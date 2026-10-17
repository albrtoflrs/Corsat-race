/**
 * Procedural Web Audio V12 Engine Synthesizer, Tire Slip & Collision Spark SFX
 * Zero external MP3 dependencies — pure Web Audio API oscillators & filter networks
 */

class RacingAudioEngine {
  private ctx: AudioContext | null = null;
  private mainGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private tireNoiseGain: GainNode | null = null;
  private isMuted = false;
  private masterVolume = 0.8;
  private isRunning = false;
  private lastGear = 1;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.mainGain = this.ctx.createGain();
      this.mainGain.gain.value = this.isMuted ? 0 : 0.28 * this.masterVolume;
      this.mainGain.connect(this.ctx.destination);

      // Engine filter (exhaust resonance)
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 420;
      this.engineFilter.Q.value = 3.2;

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.0;
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.mainGain);

      // V12 primary harmonic (sawtooth)
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.value = 65;
      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc1.start();

      // V12 fifth overtone growl (triangle)
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.value = 97.5;
      this.engineOsc2.connect(this.engineFilter);
      this.engineOsc2.start();

      // Sub bass exhaust note
      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'sine';
      this.subOsc.frequency.value = 32.5;
      this.subOsc.connect(this.engineFilter);
      this.subOsc.start();

      // Tire slip noise generator
      const bufferSize = this.ctx.sampleRate * 1.5;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1050;
      bandpass.Q.value = 4.5;

      this.tireNoiseGain = this.ctx.createGain();
      this.tireNoiseGain.gain.value = 0;

      whiteNoise.connect(bandpass);
      bandpass.connect(this.tireNoiseGain);
      this.tireNoiseGain.connect(this.mainGain);
      whiteNoise.start();

      this.isRunning = true;
    } catch {
      // Ignore audio initialization failures in headless browsers
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.mainGain && this.ctx) {
      this.mainGain.gain.setTargetAtTime(
        muted ? 0 : 0.28 * this.masterVolume,
        this.ctx.currentTime,
        0.04
      );
    }
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.mainGain && this.ctx && !this.isMuted) {
      this.mainGain.gain.setTargetAtTime(
        0.28 * this.masterVolume,
        this.ctx.currentTime,
        0.04
      );
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public pause() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
    if (this.tireNoiseGain && this.ctx) {
      this.tireNoiseGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  public update(
    rpm: number,
    throttle: number,
    gear: number,
    slipAngleDeg: number,
    speedKmh: number
  ) {
    if (!this.isRunning || !this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const baseFreq = Math.max(48, (rpm / 60) * 2.1);

    if (
      this.engineOsc1 &&
      this.engineOsc2 &&
      this.subOsc &&
      this.engineFilter &&
      this.engineGain
    ) {
      this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.03);
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.498, now, 0.03);
      this.subOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.03);

      const cutoff = 280 + (rpm / 9000) * 1900 + throttle * 650;
      this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.04);

      const targetVol = 0.22 + throttle * 0.28 + (rpm / 9200) * 0.15;
      this.engineGain.gain.setTargetAtTime(targetVol, now, 0.04);
    }

    if (this.tireNoiseGain) {
      const slipExcess = Math.max(0, Math.abs(slipAngleDeg) - 5.5);
      const screechGain = speedKmh > 25 ? Math.min(0.22, slipExcess * 0.025) : 0;
      this.tireNoiseGain.gain.setTargetAtTime(screechGain, now, 0.05);
    }

    if (gear !== this.lastGear) {
      this.playShiftPop(gear > this.lastGear);
      this.lastGear = gear;
    }
  }

  public playCollisionImpact(intensity = 1.0) {
    if (!this.ctx || !this.mainGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.18);

      const clamped = Math.min(1, Math.max(0.2, intensity));
      gain.gain.setValueAtTime(0.32 * clamped, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      osc.connect(gain);
      gain.connect(this.mainGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore
    }
  }

  private playShiftPop(upshift: boolean) {
    if (!this.ctx || !this.mainGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = upshift ? 'triangle' : 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(upshift ? 180 : 310, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.065);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.mainGain);
      osc.start(now);
      osc.stop(now + 0.075);
    } catch {
      // Ignore
    }
  }
}

export const racingAudio = new RacingAudioEngine();
