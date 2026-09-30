import React from "react";

/**
 * Premium glassmorphic tooltip hover pill.
 * Supports bottom, right, top, left positions with backdrop-blur and micro-animations.
 */
export default function HoverPill({ children, text, position = "bottom", className = "" }) {
  if (!text) return children;

  const positionClasses = {
    bottom: "top-[calc(100%+8px)] left-1/2 -translate-x-1/2",
    top: "bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2",
    right: "left-[calc(100%+10px)] top-1/2 -translate-y-1/2",
    left: "right-[calc(100%+10px)] top-1/2 -translate-y-1/2",
  };

  const arrowClasses = {
    bottom: "-top-1 left-1/2 -translate-x-1/2 border-t border-l",
    top: "-bottom-1 left-1/2 -translate-x-1/2 border-b border-r",
    right: "-left-1 top-1/2 -translate-y-1/2 border-b border-l",
    left: "-right-1 top-1/2 -translate-y-1/2 border-t border-r",
  };

  return (
    <div className={`relative group flex items-center justify-center ${className}`}>
      {children}
      <div
        className={`absolute ${positionClasses[position] || positionClasses.bottom} z-50 pointer-events-none opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out px-2.5 py-1 rounded-lg bg-[var(--island-bg)] text-[var(--text-main)] text-[11px] font-semibold border border-[var(--glass-border)] shadow-xl whitespace-nowrap backdrop-blur-2xl`}
      >
        {text}
        <div
          className={`absolute w-2 h-2 rotate-45 bg-[var(--island-bg)] ${arrowClasses[position] || arrowClasses.bottom} border-[var(--glass-border)]`}
        />
      </div>
    </div>
  );
}
