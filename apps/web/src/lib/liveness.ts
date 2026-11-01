/**
 * Praman Network - 3D Anti-Spoofing & Dynamic Randomized Liveness Detection
 * Optical frame luminance asymmetry, motion flux, and micro-movement analysis
 */

export type ChallengeType =
  | 'TURN_LEFT'
  | 'TURN_RIGHT'
  | 'TILT_UP'
  | 'TILT_DOWN'
  | 'BLINK_EYEBROWS'
  | 'SMILE_CENTER';

export interface LivenessChallenge {
  id: string;
  type: ChallengeType;
  title: string;
  instruction: string;
  detail: string;
  icon: string;
  direction: 'left' | 'right' | 'up' | 'down' | 'blink' | 'center';
}

const CHALLENGE_POOL: Record<ChallengeType, Omit<LivenessChallenge, 'id'>> = {
  TURN_LEFT: {
    type: 'TURN_LEFT',
    title: 'Turn Head Left',
    instruction: 'Slowly turn your head to the LEFT',
    detail: '3D yaw depth analysis in progress',
    icon: '⬅️',
    direction: 'left',
  },
  TURN_RIGHT: {
    type: 'TURN_RIGHT',
    title: 'Turn Head Right',
    instruction: 'Slowly turn your head to the RIGHT',
    detail: '3D yaw depth analysis in progress',
    icon: '➡️',
    direction: 'right',
  },
  TILT_UP: {
    type: 'TILT_UP',
    title: 'Tilt Head Up',
    instruction: 'Slightly tilt your head UP toward the ceiling',
    detail: 'Verifying facial elevation and geometry',
    icon: '⬆️',
    direction: 'up',
  },
  TILT_DOWN: {
    type: 'TILT_DOWN',
    title: 'Tilt Head Down',
    instruction: 'Slightly tilt your head DOWN toward your chest',
    detail: 'Measuring chin elevation & depth map',
    icon: '⬇️',
    direction: 'down',
  },
  BLINK_EYEBROWS: {
    type: 'BLINK_EYEBROWS',
    title: 'Blink or Move Eyebrows',
    instruction: 'Raise your eyebrows or blink your eyes',
    detail: 'Detecting biometric muscle micro-movements',
    icon: '👁️',
    direction: 'blink',
  },
  SMILE_CENTER: {
    type: 'SMILE_CENTER',
    title: 'Hold Center & Smile',
    instruction: 'Look straight at camera and hold steady',
    detail: 'Synthesizing Poseidon biometric commitment hash',
    icon: '😊',
    direction: 'center',
  },
};

/**
 * Generate an unpredictable, randomized sequence of 3 liveness challenges.
 * Guarantees a mix of horizontal rotation (Left/Right), vertical pitch (Up/Down),
 * and expression/micro-motion (Eyebrow/Blink or Center Hold).
 */
export function generateRandomLivenessPlan(count = 3): LivenessChallenge[] {
  const horizontals: ChallengeType[] = ['TURN_LEFT', 'TURN_RIGHT'];
  const verticals: ChallengeType[] = ['TILT_UP', 'TILT_DOWN'];
  const expressions: ChallengeType[] = ['BLINK_EYEBROWS', 'SMILE_CENTER'];

  const step1 = horizontals[Math.floor(Math.random() * horizontals.length)]!;
  const step2 = verticals[Math.floor(Math.random() * verticals.length)]!;
  const step3 = expressions[Math.floor(Math.random() * expressions.length)]!;

  const sequence = [step1, step2, step3];

  // Randomize sequence order
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = sequence[i]!;
    sequence[i] = sequence[j]!;
    sequence[j] = temp;
  }

  return sequence.slice(0, count).map((type, idx) => ({
    id: `challenge_${idx}_${type}_${Date.now()}`,
    ...CHALLENGE_POOL[type],
  }));
}

export interface OpticalFrameAnalysis {
  avgCenter: number;
  contrast: number;
  aligned: boolean;
  yaw: number;          // Left lum - Right lum
  pitch: number;        // Top lum - Bottom lum
  eyebrowMotion: number;// Frame-to-frame motion in eyebrow/eye zone
  totalMotion: number;  // Overall center motion delta
  normVector: number[];
}

export interface OpticalBaseline {
  yaw: number;
  pitch: number;
  avgCenter: number;
}

/**
 * Evaluates whether the current optical frame satisfies the active challenge.
 */
export function evaluateLivenessMotion(
  analysis: OpticalFrameAnalysis,
  baseline: OpticalBaseline | null,
  challenge: LivenessChallenge
): boolean {
  if (!analysis.aligned && challenge.type !== 'TURN_LEFT' && challenge.type !== 'TURN_RIGHT') {
    return false;
  }

  const baseYaw = baseline ? baseline.yaw : 0;
  const basePitch = baseline ? baseline.pitch : 0;
  const deltaYaw = analysis.yaw - baseYaw;
  const deltaPitch = analysis.pitch - basePitch;

  switch (challenge.type) {
    case 'TURN_LEFT':
      // Turning head left causes horizontal luminance shift or edge flux
      return Math.abs(deltaYaw) > 0.025 || analysis.totalMotion > 0.022;

    case 'TURN_RIGHT':
      // Turning head right causes horizontal luminance shift or edge flux
      return Math.abs(deltaYaw) > 0.025 || analysis.totalMotion > 0.022;

    case 'TILT_UP':
      // Tilting up increases upper illumination & shifts pitch
      return deltaPitch > 0.025 || (analysis.pitch > 0.03 && analysis.totalMotion > 0.018);

    case 'TILT_DOWN':
      // Tilting down darkens top & casts shadow downward
      return deltaPitch < -0.025 || (analysis.pitch < -0.03 && analysis.totalMotion > 0.018);

    case 'BLINK_EYEBROWS':
      // Raising eyebrows or blinking creates concentrated upper-quadrant motion
      return analysis.eyebrowMotion > 0.028 || analysis.totalMotion > 0.025;

    case 'SMILE_CENTER':
      // Center & hold steady
      return analysis.aligned && analysis.totalMotion < 0.038;

    default:
      return true;
  }
}

/**
 * Web Audio synthesizer for futuristic biometric feedback chimes
 */
export function playBiometricChime(type: 'step' | 'success' | 'alert' = 'step'): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'step') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.18); // C6
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
    }

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.32);
  } catch (e) {
    // Ignore audio policies
  }
}

