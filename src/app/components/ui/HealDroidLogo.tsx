"use client";

import React from "react";

interface HealDroidLogoProps {
  size?: number | "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "green" | "dark";
}

export function HealDroidLogo({ size = "md", className = "", variant = "green" }: HealDroidLogoProps) {
  let dimension = 36;
  let textSize = "text-lg";
  let rounded = "rounded-xl";

  if (typeof size === "number") {
    dimension = size;
    textSize = size >= 50 ? "text-3xl" : size >= 36 ? "text-xl" : "text-sm";
    rounded = size >= 50 ? "rounded-[18px]" : size >= 36 ? "rounded-xl" : "rounded-lg";
  } else {
    switch (size) {
      case "sm":
        dimension = 28;
        textSize = "text-sm";
        rounded = "rounded-lg";
        break;
      case "md":
        dimension = 36;
        textSize = "text-lg";
        rounded = "rounded-xl";
        break;
      case "lg":
        dimension = 44;
        textSize = "text-2xl";
        rounded = "rounded-2xl";
        break;
      case "xl":
        dimension = 58;
        textSize = "text-3xl";
        rounded = "rounded-[18px]";
        break;
    }
  }

  const isGreen = variant === "green";

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none transition-transform ${rounded} ${className}`}
      style={{
        width: dimension,
        height: dimension,
        background: isGreen
          ? "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)"
          : "#111827",
        boxShadow: isGreen
          ? "0 8px 24px rgba(19, 184, 166, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.3)"
          : "0 2px 8px rgba(0, 0, 0, 0.25)",
      }}
    >
      <span
        className={`font-serif italic font-bold leading-none ${textSize} ${
          isGreen ? "text-white" : "text-teal-400"
        }`}
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        H
      </span>
    </div>
  );
}
