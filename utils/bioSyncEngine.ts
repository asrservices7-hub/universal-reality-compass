export type ActivationPhase =
  | 'DORMANT'
  | 'DETECTING'
  | 'ALIGNING'
  | 'HANDSHAKING'
  | 'ACTIVE'
  | 'QUIET'
  | 'REJECTED';

export interface BioSignature {
  cardiacRhythm: number;
  harmonicFrequency: number;
  intentCoherence: number;
  timestamp: number;
}

export interface SessionToken {
  tokenId: string;
  bioSignature: BioSignature;
  establishedAt: number;
  expiresAt: number;
  observerFrame: {
    localGravity: number;
    localTime: number;
    magneticField: number;
  };
  isValid: boolean;
}

export interface ActivationState {
  phase: ActivationPhase;
  progress: number;
  bioSignature: BioSignature | null;
  sessionToken: SessionToken | null;
  veilOpacity: number;
  errorMessage: string | null;
}

export type Gesture = 'TOUCH' | 'SUSTAINED_GAZE' | 'PALM_DOWN' | 'PALM_UP' | 'NONE';

function simulateCardiacRhythm(): number {
  const base = 0.5;
  const variation = (Math.random() - 0.5) * 0.2;
  return Math.min(1, Math.max(0, base + variation));
}

function simulateHarmonicFrequency(cardiac: number): number {
  return 0.3 + cardiac * 0.5 + (Math.random() - 0.5) * 0.2;
}

function simulateIntentCoherence(focusDuration: number): number {
  const maxCoherence = 0.95;
  const buildRate = 0.3;
  return Math.min(maxCoherence, focusDuration * buildRate);
}

function generateSessionToken(bioSignature: BioSignature): SessionToken {
  const now = Date.now();
  const tokenId = `odrm_${now.toString(36)}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    tokenId,
    bioSignature,
    establishedAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000,
    observerFrame: {
      localGravity: 0.3,
      localTime: now,
      magneticField: 0.5,
    },
    isValid: true,
  };
}

export function detectGesture(
  touchActive: boolean,
  gazeDuration: number,
  palmOrientation: 'up' | 'down' | 'none'
): Gesture {
  if (touchActive && gazeDuration < 1.0) return 'TOUCH';
  if (touchActive && gazeDuration >= 1.0) return 'SUSTAINED_GAZE';
  if (palmOrientation === 'down') return 'PALM_DOWN';
  if (palmOrientation === 'up') return 'PALM_UP';
  return 'NONE';
}

export class BioSyncEngine {
  private state: ActivationState;
  private focusStartTime: number | null = null;
  private onStateChange: (state: ActivationState) => void;

  constructor(onStateChange: (state: ActivationState) => void) {
    this.state = {
      phase: 'DORMANT',
      progress: 0,
      bioSignature: null,
      sessionToken: null,
      veilOpacity: 0,
      errorMessage: null,
    };
    this.onStateChange = onStateChange;
    this.emit();
  }

  private emit(): void {
    this.onStateChange({ ...this.state });
  }

  getState(): ActivationState {
    return { ...this.state };
  }

  isOperational(): boolean {
    return (
      this.state.phase === 'ACTIVE' &&
      this.state.sessionToken !== null &&
      this.state.sessionToken.isValid
    );
  }

  processGesture(gesture: Gesture): void {
    const now = Date.now();

    switch (this.state.phase) {
      case 'DORMANT':
        if (gesture === 'TOUCH' || gesture === 'SUSTAINED_GAZE') {
          this.transitionTo('DETECTING');
        }
        break;

      case 'DETECTING':
        if (gesture === 'SUSTAINED_GAZE') {
          const cardiac = simulateCardiacRhythm();
          this.state.bioSignature = {
            cardiacRhythm: cardiac,
            harmonicFrequency: simulateHarmonicFrequency(cardiac),
            intentCoherence: 0,
            timestamp: now,
          };
          this.state.progress = 100;
          this.transitionTo('ALIGNING');
          this.focusStartTime = now;
        } else if (gesture === 'NONE') {
          this.transitionTo('DORMANT');
        }
        break;

      case 'ALIGNING':
        if (this.focusStartTime && gesture === 'SUSTAINED_GAZE') {
          const focusDuration = (now - this.focusStartTime) / 1000;
          const intent = simulateIntentCoherence(focusDuration);

          if (this.state.bioSignature) {
            this.state.bioSignature.intentCoherence = intent;
          }
          this.state.progress = Math.min(100, intent * 100);

          if (intent > 0.8) {
            this.state.progress = 100;
            this.transitionTo('HANDSHAKING');
          }
        } else if (gesture === 'NONE' || gesture === 'TOUCH') {
          this.state.errorMessage = 'Intent alignment lost. Please maintain focus.';
          this.transitionTo('REJECTED');
        }
        break;

      case 'HANDSHAKING':
        if (this.state.bioSignature) {
          this.state.sessionToken = generateSessionToken(this.state.bioSignature);
          this.state.veilOpacity = 1;
          this.state.progress = 100;
          this.transitionTo('ACTIVE');
        } else {
          this.state.errorMessage = 'Bio-signature corrupted.';
          this.transitionTo('REJECTED');
        }
        break;

      case 'ACTIVE':
        if (gesture === 'PALM_DOWN') {
          this.state.veilOpacity = 0;
          this.transitionTo('QUIET');
        }
        break;

      case 'QUIET':
        if (gesture === 'PALM_UP') {
          this.state.veilOpacity = 1;
          this.transitionTo('ACTIVE');
        } else if (gesture === 'TOUCH') {
          this.state.veilOpacity = 0;
          this.transitionTo('DETECTING');
        }
        break;

      case 'REJECTED':
        setTimeout(() => {
          if (this.state.phase === 'REJECTED') {
            this.transitionTo('DORMANT');
          }
        }, 3000);
        break;
    }

    this.emit();
  }

  private transitionTo(phase: ActivationPhase): void {
    this.state.phase = phase;
    this.state.progress = 0;
    this.state.errorMessage = null;
    this.emit();
  }

  forceQuiet(): void {
    if (this.state.phase === 'ACTIVE') {
      this.state.veilOpacity = 0;
      this.transitionTo('QUIET');
    }
  }

  forceReactivate(): void {
    if (this.state.phase === 'QUIET' && this.state.sessionToken?.isValid) {
      this.state.veilOpacity = 1;
      this.transitionTo('ACTIVE');
    }
  }

  terminate(): void {
    if (this.state.sessionToken) {
      this.state.sessionToken.isValid = false;
    }
    this.state = {
      phase: 'DORMANT',
      progress: 0,
      bioSignature: null,
      sessionToken: null,
      veilOpacity: 0,
      errorMessage: null,
    };
    this.emit();
  }
}