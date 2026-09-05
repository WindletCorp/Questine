"use client";

import { useState, useEffect, useRef, Children, cloneElement, ReactElement } from "react";
import { useRouter } from "next/navigation";
import styles from "../theme.module.css";

import { cn } from "@/lib/utils";

interface CardComponentProps {
  position?: 0 | 1 | 2 | 3;
  isExpanded?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

interface StackedDeckProps {
  children: ReactElement<CardComponentProps>[];
  entryModeActive?: boolean;
}

export function StackedDeck({ children, entryModeActive = false }: StackedDeckProps) {
  const router = useRouter();
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);
  const [isFannedOut, setIsFannedOut] = useState(!entryModeActive);

  useEffect(() => {
    if (entryModeActive) {
      setIsFannedOut(false);
    } else {
      const timer = setTimeout(() => {
        setIsFannedOut(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [entryModeActive]);

  const [expandedCardIndex, setExpandedCardIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);
  const dragStartX = useRef<number | null>(null);

  const totalCards = Children.count(children);

  const cycleDeck = (direction: 1 | -1) => {
    setExpandedCardIndex(-1);
    if (direction === 1) {
      setActiveDeckIndex((prev) => (prev + 1) % totalCards);
    } else {
      setActiveDeckIndex((prev) => (prev - 1 + totalCards) % totalCards);
    }
  };

  const handleCardClick = (index: number, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, label, .custom-glass-scroll")) {
      return;
    }
    const isHeaderClick = !!(e.target as HTMLElement).closest(".deck-card-header");

    if (activeDeckIndex !== index) {
      setActiveDeckIndex(index);
      setExpandedCardIndex(index);
    } else {
      if (isHeaderClick) {
        setExpandedCardIndex((prev) => (prev === index ? -1 : index));
      } else if (expandedCardIndex === index) {
        router.push("/dashboard");
      }
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.body.classList.contains("entry-mode-active")) return;
      if (e.key === "ArrowRight") cycleDeck(1);
      if (e.key === "ArrowLeft") cycleDeck(-1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalCards]);

  // Wheel Gesture Handling
  const handleWheel = (e: React.WheelEvent) => {
    if ((e.target as HTMLElement).closest(".custom-glass-scroll")) {
      return;
    }
    const now = Date.now();
    if (now - lastScrollTime.current < 400) return;

    if (Math.abs(e.deltaX) > 20 || Math.abs(e.deltaY) > 20) {
      lastScrollTime.current = now;
      if (e.deltaY > 0 || e.deltaX > 0) cycleDeck(1);
      else cycleDeck(-1);
    }
  };

  // Touch Swipe Handling (Mobile-optimized)
  const touchCoords = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button, input, label, .custom-glass-scroll")) {
      touchCoords.current = null;
      return;
    }
    touchCoords.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchCoords.current) return;
    const diffX = e.changedTouches[0].clientX - touchCoords.current.x;
    const diffY = e.changedTouches[0].clientY - touchCoords.current.y;

    // Detect horizontal swipe or vertical flick
    if (Math.abs(diffX) > 30 || Math.abs(diffY) > 35) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) cycleDeck(1);
        else cycleDeck(-1);
      } else {
        if (diffY < 0) cycleDeck(1);
        else cycleDeck(-1);
      }
    }
    touchCoords.current = null;
  };

  // Mouse Drag Handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, label, .custom-glass-scroll")) {
      dragStartX.current = null;
      return;
    }
    dragStartX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStartX.current === null) return;
    const diffX = e.clientX - dragStartX.current;
    if (Math.abs(diffX) > 40) {
      if (diffX < 0) cycleDeck(1);
      else cycleDeck(-1);
    }
    dragStartX.current = null;
  };

  return (
    <div
      ref={containerRef}
      className={cn(styles.deckPerspective, !isFannedOut && styles.deckTucked)}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {Children.map(children, (child, index) => {
        const relativePos = ((index - activeDeckIndex + totalCards) % totalCards) as 0 | 1 | 2 | 3;
        const isExpanded = index === activeDeckIndex && index === expandedCardIndex;

        return cloneElement(child as ReactElement<CardComponentProps>, {
          position: relativePos,
          isExpanded,
          onClick: (e: React.MouseEvent) => handleCardClick(index, e),
        });
      })}
    </div>
  );
}
