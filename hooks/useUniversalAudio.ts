import { useEffect, useRef, useState } from 'react';

interface AudioParams {
  psi: number;
  dims: number;
  entropy: number;
  localGravity: number;
  quantumFlux: number;
  triggerGlitch: boolean;
  soundEnabled: boolean;
}

const PENTATONIC_FREQS = [261.63, 293.66, 329.63, 392.00, 440.00];

export const useUniversalAudio = ({
  psi,
  dims,
  entropy,
  localGravity,
  quantumFlux,
  triggerGlitch,
  soundEnabled,
}: AudioParams) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const carrierRef = useRef<OscillatorNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const subcarrierRef = useRef<OscillatorNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeAudio = () => {
    try {
      if (!audioCtxRef.current) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;

        const carrier = ctx.createOscillator();
        carrier.type = 'sawtooth';

        const subcarrier = ctx.createOscillator();
        subcarrier.type = 'triangle';

        const gain = ctx.createGain();
        gain.gain.value = soundEnabled ? 0.10 : 0;

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';

        const panner = ctx.createStereoPanner();
        panner.pan.value = 0;

        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = soundEnabled ? 0.015 : 0;

        noiseSource.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseSource.start();

        carrier.connect(gain);
        subcarrier.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
        lfo.connect(panner.pan);

        carrierRef.current = carrier;
        subcarrierRef.current = subcarrier;
        lfoRef.current = lfo;
        gainRef.current = gain;
        noiseGainRef.current = noiseGain;

        carrier.start();
        subcarrier.start();
        lfo.start();
        setIsInitialized(true);
      }
    } catch (e) {
      console.error('Audio blocked:', e);
    }
  };

  const getQuantizedFrequency = (psiVal: number, entropyVal: number): number => {
    const rawMin = 60;
    const rawMax = 960;
    const normalizedPsi = (psiVal - 1) / 9;
    const rawFreq = rawMin * Math.pow(rawMax / rawMin, normalizedPsi);

    if (entropyVal < 0.3) {
      let bestFreq = PENTATONIC_FREQS[0];
      let bestDiff = Infinity;
      for (const base of PENTATONIC_FREQS) {
        for (const octave of [0.25, 0.5, 1, 2, 4, 8]) {
          const candidate = base * octave;
          const diff = Math.abs(candidate - rawFreq);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestFreq = candidate;
          }
        }
      }
      return bestFreq;
    } else {
      const detune = (entropyVal - 0.3) * 30;
      return rawFreq * (1 + detune / 1200);
    }
  };

  useEffect(() => {
    if (!audioCtxRef.current || !carrierRef.current || !lfoRef.current || !gainRef.current) return;
    const ctx = audioCtxRef.current;

    const targetFreq = getQuantizedFrequency(psi, entropy);
    carrierRef.current.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.08);

    const gravShift = 1 - localGravity * 0.5;
    if (subcarrierRef.current) {
      subcarrierRef.current.frequency.setTargetAtTime(
        targetFreq * gravShift * 0.5, ctx.currentTime, 0.08
      );
    }

    const beatFreq = 1.5 + ((dims - 1) / 10) * 28.5;
    lfoRef.current.frequency.setTargetAtTime(beatFreq, ctx.currentTime, 0.08);

    const baseGain = soundEnabled ? (0.08 + entropy * 0.08 + quantumFlux * 0.04) : 0;
    gainRef.current.gain.setTargetAtTime(baseGain, ctx.currentTime, 0.08);

    if (noiseGainRef.current) {
      const baseNoise = soundEnabled ? (0.01 + entropy * 0.05 + quantumFlux * 0.03) : 0;
      noiseGainRef.current.gain.setTargetAtTime(
        baseNoise, ctx.currentTime, 0.1
      );
    }
  }, [psi, dims, entropy, localGravity, quantumFlux, soundEnabled]);

  useEffect(() => {
    if (!triggerGlitch || !audioCtxRef.current || !soundEnabled) return;
    const ctx = audioCtxRef.current;

    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.type = 'sawtooth';
    sweepGain.gain.value = 0.25;

    sweepOsc.connect(sweepGain);
    sweepGain.connect(ctx.destination);

    sweepOsc.frequency.setValueAtTime(2000, ctx.currentTime);
    sweepOsc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.5);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    sweepOsc.start(ctx.currentTime);
    sweepOsc.stop(ctx.currentTime + 1.6);

    sweepOsc.onended = () => {
      sweepOsc.disconnect();
      sweepGain.disconnect();
    };

    if (gainRef.current) {
      gainRef.current.gain.setValueAtTime(0.35, ctx.currentTime);
      gainRef.current.gain.exponentialRampToValueAtTime(0.10, ctx.currentTime + 0.6);
    }
  }, [triggerGlitch, soundEnabled]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return { initializeAudio, isInitialized };
};