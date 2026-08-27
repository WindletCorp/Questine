"use client";

import { useState, useEffect, useRef, Children, cloneElement, ReactElement } from "react";

interface CardComponentProps {
  position?: 0 | 1 | 2 | 3;
  isExpanded?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

interface StackedDeckProps {
  children: ReactElement<CardComponentProps>[];
}

export function StackedDeck({ children }: StackedDeckProps) {
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);
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
    if (activeDeckIndex !== index) {
      setActiveDeckIndex(index);
      setExpandedCardIndex(index);
    } else {
      setExpandedCardIndex((prev) => (prev === index ? -1 : index));
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

  // Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartX.current === null) return;
    const diffX = e.changedTouches[0].clientX - dragStartX.current;
    if (Math.abs(diffX) > 40) {
      if (diffX < 0) cycleDeck(1);
      else cycleDeck(-1);
    }
    dragStartX.current = null;
  };

  // Mouse Drag Handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, label, .custom-glass-scroll")) {
      return;
    }
    dragStartX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStartX.current === null) return;
    const diffX = e.clientX - dragStartX.current;
    if (Math.abs(diffX) > 50) {
      if (diffX < 0) cycleDeck(1);
      else cycleDeck(-1);
    }
    dragStartX.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="deck-perspective"
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
