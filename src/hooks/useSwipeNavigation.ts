import { useRef } from "react";
import type { MouseEventHandler, TouchEventHandler } from "react";

interface SwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

const INTERACTIVE_SELECTOR = "input, textarea, select, a";

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 72,
}: SwipeNavigationOptions) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isInteractive = useRef(false);
  const didSwipe = useRef(false);

  const onTouchStart: TouchEventHandler<HTMLElement> = (event) => {
    const target = event.target;
    isInteractive.current =
      target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null;
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd: TouchEventHandler<HTMLElement> = (event) => {
    const start = touchStart.current;
    touchStart.current = null;

    if (!start || isInteractive.current) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.abs(deltaX) < threshold || Math.abs(deltaY) > 60) return;

    didSwipe.current = true;
    if (event.cancelable) event.preventDefault();
    window.setTimeout(() => {
      didSwipe.current = false;
    }, 250);

    if (deltaX < 0) {
      onSwipeLeft?.();
    } else {
      onSwipeRight?.();
    }
  };

  const onClickCapture: MouseEventHandler<HTMLElement> = (event) => {
    if (!didSwipe.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return { onTouchStart, onTouchEnd, onClickCapture };
}
