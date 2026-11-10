"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps keyboard focus inside an open overlay, closes on Escape, and returns
 * focus to the trigger when the overlay closes. Works for dialogs, drawers,
 * and full-screen players without changing their visual structure.
 */
export function useFocusTrap<T extends HTMLElement>(
  isOpen: boolean,
  containerRef: RefObject<T | null>,
  onClose: () => void
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0
      );

    const first = getFocusable()[0];
    if (first) {
      first.focus({ preventScroll: true });
    } else {
      container.focus({ preventScroll: true });
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;
      const activeInside = active !== container && container.contains(active);

      if (event.shiftKey && (active === firstItem || !activeInside)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && (active === lastItem || !activeInside)) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Defer restoration so an inert background is released first.
      requestAnimationFrame(() => {
        if (previouslyFocused && typeof previouslyFocused.focus === "function") {
          previouslyFocused.focus({ preventScroll: true });
        }
      });
    };
  }, [isOpen, containerRef]);
}
