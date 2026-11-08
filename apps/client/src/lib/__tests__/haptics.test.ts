import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { hapticLight, hapticMedium, hapticSuccess } from "../haptics";

interface MockNavigator {
  vibrate?: (pattern: number | number[]) => boolean;
}

describe("Mobile Haptic Feedback Engine", () => {
  let vibrateCalls: (number | number[])[] = [];
  const originalVibrate = (globalThis.navigator as unknown as MockNavigator | undefined)?.vibrate;

  beforeEach(() => {
    vibrateCalls = [];
    Object.defineProperty(globalThis.navigator, "vibrate", {
      value: (pattern: number | number[]) => {
        vibrateCalls.push(pattern);
        return true;
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    if (originalVibrate) {
      Object.defineProperty(globalThis.navigator, "vibrate", {
        value: originalVibrate,
        configurable: true,
        writable: true,
      });
    } else {
      delete (globalThis.navigator as unknown as Record<string, unknown>).vibrate;
    }
  });

  it("triggers light haptic tap with 8ms", () => {
    hapticLight();
    expect(vibrateCalls.length).toBe(1);
    expect(vibrateCalls[0]).toBe(8);
  });

  it("triggers medium haptic pulse with 18ms", () => {
    hapticMedium();
    expect(vibrateCalls.length).toBe(1);
    expect(vibrateCalls[0]).toBe(18);
  });

  it("triggers success sequence pattern", () => {
    hapticSuccess();
    expect(vibrateCalls.length).toBe(1);
    expect(vibrateCalls[0]).toEqual([12, 40, 15]);
  });

  it("fails silently when navigator.vibrate is missing", () => {
    delete (globalThis.navigator as unknown as Record<string, unknown>).vibrate;
    expect(() => hapticLight()).not.toThrow();
  });
});
