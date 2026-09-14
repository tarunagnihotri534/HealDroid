import React from "react";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  indicatorPosition: number;
  position: number;
}

const NavItem: React.FC<NavItemProps> = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  indicatorPosition,
  position,
}) => {
  const distance = Math.abs(indicatorPosition - position);
  const spotlightOpacity = isActive ? 1 : Math.max(0, 1 - distance * 0.6);

  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="relative flex items-center justify-center w-12 h-12 mx-2"
      style={{ transition: "all 0.3s ease" }}
    >
      {/* spotlight beam */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-24 rounded-full blur-lg pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.45), transparent)",
          opacity: spotlightOpacity,
          transition: "opacity 0.35s ease",
          transitionDelay: isActive ? "0.08s" : "0s",
        }}
      />
      <Icon
        style={{
          width: 22,
          height: 22,
          color: isActive ? "#ffffff" : "rgba(156,163,175,1)",
          strokeWidth: isActive ? 2.5 : 2,
          transition: "color 0.2s ease, stroke-width 0.2s ease",
          position: "relative",
          zIndex: 1,
        }}
      />
    </button>
  );
};

interface SpotlightNavProps {
  items: { icon: React.ElementType; label: string }[];
  activeIndex: number;
  onSelect: (i: number) => void;
}

// Each nav slot = w-12 (48px) + mx-2 (8px × 2) = 64px
// Indicator left = activeIndex * 64 + px-2 (8px nav padding)
const SLOT_W = 64;
const NAV_PAD = 8; // px-2

export const SpotlightNav: React.FC<SpotlightNavProps> = ({
  items,
  activeIndex,
  onSelect,
}) => {
  const indicatorLeft = activeIndex * SLOT_W + NAV_PAD;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2"
      style={{ bottom: "max(22px, calc(env(safe-area-inset-bottom, 0px) + 12px))", zIndex: 50 }}
    >
      <nav
        className="relative flex items-center"
        style={{
          padding: "12px 8px",
          backgroundColor: "rgba(10, 10, 12, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.15)",
        }}
      >
        {/* sliding white indicator line at top */}
        <div
          className="absolute top-0"
          style={{
            left: indicatorLeft,
            width: 48,
            height: 2,
            borderRadius: 999,
            backgroundColor: "#ffffff",
            transform: "translateY(-1px)",
            boxShadow: "0 0 10px 2px rgba(255,255,255,0.55)",
            transition: "left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />

        {items.map(({ icon, label }, i) => (
          <NavItem
            key={label}
            icon={icon}
            label={label}
            isActive={activeIndex === i}
            onClick={() => onSelect(i)}
            indicatorPosition={activeIndex}
            position={i}
          />
        ))}
      </nav>
    </div>
  );
};
