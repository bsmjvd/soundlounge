/**
 * Lightweight mobile haptic feedback helper using the standard Navigator.vibrate API.
 * Fails safely and silently when running on unsupported platforms or during SSR.
 */
export function triggerHaptic(pattern: number | number[] = 10): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {}
}

export const hapticLight = () => triggerHaptic(8);
export const hapticMedium = () => triggerHaptic(18);
export const hapticSuccess = () => triggerHaptic([12, 40, 15]);
