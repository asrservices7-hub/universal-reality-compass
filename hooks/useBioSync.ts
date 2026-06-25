'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  BioSyncEngine,
  ActivationState,
  detectGesture,
} from '@/utils/bioSyncEngine';

interface UseBioSyncReturn {
  state: ActivationState;
  isOperational: boolean;
  handleTouchStart: () => void;
  handleTouchEnd: () => void;
  handleGazeStart: () => void;
  handleGazeEnd: () => void;
  handlePalmDown: () => void;
  handlePalmUp: () => void;
}

export function useBioSync(): UseBioSyncReturn {
  const [activationState, setActivationState] = useState<ActivationState>({
    phase: 'DORMANT',
    progress: 0,
    bioSignature: null,
    sessionToken: null,
    veilOpacity: 0,
    errorMessage: null,
  });

  const engineRef = useRef<BioSyncEngine | null>(null);
  const touchActiveRef = useRef(false);
  const gazeActiveRef = useRef(false);
  const gazeStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    engineRef.current = new BioSyncEngine(setActivationState);
    return () => {
      engineRef.current?.terminate();
    };
  }, []);

  const processCurrentGesture = useCallback(() => {
    if (!engineRef.current) return;

    const touchActive = touchActiveRef.current;
    const gazeActive = gazeActiveRef.current;

    let gazeDuration = 0;
    if (gazeActive && gazeStartTimeRef.current) {
      gazeDuration = (Date.now() - gazeStartTimeRef.current) / 1000;
    }

    const gesture = detectGesture(touchActive, gazeDuration, 'none');
    engineRef.current.processGesture(gesture);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (gazeActiveRef.current || touchActiveRef.current) {
        processCurrentGesture();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [processCurrentGesture]);

  const handleTouchStart = useCallback(() => {
    touchActiveRef.current = true;
    if (!gazeActiveRef.current) {
      gazeActiveRef.current = true;
      gazeStartTimeRef.current = Date.now();
    }
    processCurrentGesture();
  }, [processCurrentGesture]);

  const handleTouchEnd = useCallback(() => {
    touchActiveRef.current = false;
    if (engineRef.current) {
      engineRef.current.processGesture('NONE');
    }
  }, []);

  const handleGazeStart = useCallback(() => {
    gazeActiveRef.current = true;
    gazeStartTimeRef.current = Date.now();
    processCurrentGesture();
  }, [processCurrentGesture]);

  const handleGazeEnd = useCallback(() => {
    gazeActiveRef.current = false;
    gazeStartTimeRef.current = null;
    if (engineRef.current) {
      engineRef.current.processGesture('NONE');
    }
  }, []);

  const handlePalmDown = useCallback(() => {
    engineRef.current?.forceQuiet();
  }, []);

  const handlePalmUp = useCallback(() => {
    engineRef.current?.forceReactivate();
  }, []);

  return {
    state: activationState,
    isOperational: activationState.phase === 'ACTIVE' &&
      activationState.sessionToken?.isValid === true,
    handleTouchStart,
    handleTouchEnd,
    handleGazeStart,
    handleGazeEnd,
    handlePalmDown,
    handlePalmUp,
  };
}