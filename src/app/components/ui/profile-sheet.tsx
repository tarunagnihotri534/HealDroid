/**
 * ProfileSheet — Bottom sheet overlay triggered by the profile avatar.
 * All sub-components are exported individually for clean Vercel deployment.
 */

import React from "react";
import {
  Key, CreditCard, Sun, Moon, LogOut, ChevronRight, X,
} from "lucide-react";

// ── TOKENS (mirrors App.tsx) ─────────────────────────────────────────────────
const T = {
  white:    "#FFFFFF",
  bg:       "#F2F4F8",
  surf2:    "#F8F9FB",
  border:   "#E4E7EC",
  text1:    "#101828",
  text2:    "#344054",
  text3:    "#667085",
  text4:    "#98A2B3",
  accent:   "#13B8A6",
  accentBg: "rgba(19,184,166,0.08)",
  critical: "#F04438",
  critBg:   "rgba(240,68,56,0.08)",
  success:  "#13B8A6",
  shadow:   "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
} as const;

const ui   = "Inter, system-ui, sans-serif";
const mono = "IBM Plex Mono, monospace";

// ── USER PROFILE HEADER ──────────────────────────────────────────────────────
interface UserProfileProps {
  name: string;
  email: string;
  initials: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ name, email, initials }) => (
  <div className="flex items-center gap-4 px-6 pt-6 pb-5">
    {/* Avatar — 56px, meets WCAG touch target when wrapped */}
    <div
      className="flex items-center justify-center flex-shrink-0 text-lg font-bold"
      style={{
        width: 56, height: 56, borderRadius: 999,
        background: "linear-gradient(135deg, #13B8A6 0%, #0E9284 100%)",
        color: T.white,
        fontFamily: ui,
        boxShadow: "0 4px 14px rgba(19,184,166,0.3)",
      }}
    >
      {initials}
    </div>
    <div className="min-w-0">
      <p className="text-base font-bold truncate" style={{ color: T.text1, fontFamily: ui }}>{name}</p>
      <p className="text-sm mt-0.5 truncate" style={{ color: T.text3, fontFamily: ui }}>{email}</p>
      {/* Verified badge */}
      <span
        className="inline-block text-[10px] font-semibold px-2 py-0.5 mt-1"
        style={{ borderRadius: 999, backgroundColor: T.accentBg, color: T.accent, fontFamily: ui }}
      >
        Enterprise · Verified
      </span>
    </div>
  </div>
);

// ── SETTINGS GROUP ITEM ───────────────────────────────────────────────────────
interface SettingsItemProps {
  icon: React.ElementType;
  label: string;
  value?: string;
  valueColor?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  icon: Icon,
  label,
  value,
  valueColor = T.text3,
  onPress,
  showArrow = true,
}) => (
  <button
    onClick={onPress}
    className="w-full flex items-center gap-4 px-5 py-3.5 active:bg-gray-50 transition-colors text-left"
  >
    {/* Icon container — 36px */}
    <div
      className="w-9 h-9 flex items-center justify-center flex-shrink-0"
      style={{ borderRadius: 10, backgroundColor: T.bg }}
    >
      <Icon className="w-4 h-4" style={{ color: T.text2 }} strokeWidth={1.8} />
    </div>
    <span className="flex-1 text-sm font-medium" style={{ color: T.text1, fontFamily: ui }}>{label}</span>
    {value && (
      <span className="text-xs font-semibold px-2 py-0.5 mr-1"
        style={{ borderRadius: 999, backgroundColor: `${valueColor}15`, color: valueColor, fontFamily: mono }}>
        {value}
      </span>
    )}
    {showArrow && <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: T.text4 }} strokeWidth={1.5} />}
  </button>
);

// ── SETTINGS GROUP (card wrapper) ─────────────────────────────────────────────
interface SettingsGroupProps {
  children: React.ReactNode;
}

export const SettingsGroup: React.FC<SettingsGroupProps> = ({ children }) => (
  <div
    className="mx-4 overflow-hidden"
    style={{
      borderRadius: 16,
      backgroundColor: T.white,
      border: `1px solid ${T.border}`,
      boxShadow: T.shadow,
    }}
  >
    {React.Children.map(children, (child, i) => (
      <div key={i} style={{ borderBottom: i < React.Children.count(children) - 1 ? `1px solid ${T.border}` : "none" }}>
        {child}
      </div>
    ))}
  </div>
);

// ── THEME TOGGLE ROW ──────────────────────────────────────────────────────────
interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export const ThemeToggleItem: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => {
  const Icon = isDark ? Moon : Sun;
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <div className="w-9 h-9 flex items-center justify-center flex-shrink-0"
        style={{ borderRadius: 10, backgroundColor: T.bg }}>
        <Icon className="w-4 h-4" style={{ color: T.text2 }} strokeWidth={1.8} />
      </div>
      <span className="flex-1 text-sm font-medium" style={{ color: T.text1, fontFamily: ui }}>
        {isDark ? "Dark Mode" : "Light Mode"}
      </span>
      {/* Toggle pill */}
      <button
        onClick={onToggle}
        className="relative flex-shrink-0 transition-colors"
        style={{
          width: 44, height: 26, borderRadius: 999,
          backgroundColor: isDark ? T.accent : T.border,
          boxShadow: isDark ? "0 0 0 2px rgba(19,184,166,0.2)" : "none",
          transition: "background-color 0.2s",
        }}
      >
        <span
          className="absolute top-1"
          style={{
            width: 20, height: 20, borderRadius: 999,
            backgroundColor: T.white,
            boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
            left: isDark ? 22 : 2,
            transition: "left 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </button>
    </div>
  );
};

// ── BILLING TIER ─────────────────────────────────────────────────────────────
export const BillingTierItem: React.FC = () => (
  <SettingsItem
    icon={CreditCard}
    label="Billing Tier"
    value="Enterprise"
    valueColor={T.success}
    showArrow
  />
);

// ── SIGN OUT ─────────────────────────────────────────────────────────────────
interface SignOutProps {
  onSignOut: () => void;
}

export const SignOutButton: React.FC<SignOutProps> = ({ onSignOut }) => (
  <div className="mx-4">
    <button
      onClick={onSignOut}
      className="w-full flex items-center justify-center gap-2.5 py-3.5 active:opacity-80 transition-opacity"
      style={{
        borderRadius: 14,
        backgroundColor: T.critBg,
        border: `1px solid rgba(240,68,56,0.15)`,
      }}
    >
      <LogOut className="w-4 h-4" style={{ color: T.critical }} strokeWidth={2} />
      <span className="text-sm font-semibold" style={{ color: T.critical, fontFamily: ui }}>Sign Out</span>
    </button>
  </div>
);

// ── DRAG HANDLE ───────────────────────────────────────────────────────────────
export const DragHandle: React.FC = () => (
  <div className="flex justify-center pt-3 pb-1">
    <div style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: T.border }} />
  </div>
);

// ── SHEET DIVIDER LABEL ───────────────────────────────────────────────────────
export const SheetSectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="px-5 pt-5 pb-2 text-[10px] font-semibold tracking-widest uppercase"
    style={{ color: T.text4, fontFamily: ui }}>
    {children}
  </p>
);

// ── CLOSE BUTTON ─────────────────────────────────────────────────────────────
export const SheetCloseButton: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <button
    onClick={onClose}
    className="absolute top-4 right-4 flex items-center justify-center"
    style={{
      width: 32, height: 32, borderRadius: 999,
      backgroundColor: T.bg,
      border: `1px solid ${T.border}`,
    }}
    aria-label="Close"
  >
    <X className="w-4 h-4" style={{ color: T.text3 }} strokeWidth={2} />
  </button>
);

// ── MAIN PROFILE SHEET ───────────────────────────────────────────────────────
interface ProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onThemeToggle: () => void;
  onSignOut?: () => void;
}

export const ProfileSheet: React.FC<ProfileSheetProps> = ({
  isOpen,
  onClose,
  isDark,
  onThemeToggle,
  onSignOut,
}) => {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 z-40"
        style={{
          backgroundColor: "rgba(16,24,40,0.45)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Sheet panel */}
      <div
        className="absolute bottom-0 left-0 right-0 z-50"
        style={{
          borderRadius: "24px 24px 0 0",
          backgroundColor: T.bg,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.12), 0 -2px 8px rgba(0,0,0,0.06)",
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
          /* iOS safe area at the bottom */
          paddingBottom: "env(safe-area-inset-bottom, 24px)",
        }}
      >
        <DragHandle />
        <SheetCloseButton onClose={onClose} />

        {/* User info */}
        <UserProfile
          name="Jamie Davidson"
          email="jamie@acmecorp.io"
          initials="JD"
        />

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: T.border, margin: "0 16px 4px" }} />

        {/* Account settings group */}
        <SheetSectionLabel>Account</SheetSectionLabel>
        <SettingsGroup>
          <SettingsItem icon={Key} label="API & Security Settings" showArrow />
          <BillingTierItem />
        </SettingsGroup>

        {/* Preferences group */}
        <SheetSectionLabel>Preferences</SheetSectionLabel>
        <SettingsGroup>
          <ThemeToggleItem isDark={isDark} onToggle={onThemeToggle} />
        </SettingsGroup>

        {/* Sign out */}
        <div className="mt-5 mb-3">
          <SignOutButton onSignOut={onSignOut ?? (() => {})} />
        </div>
      </div>
    </>
  );
};
