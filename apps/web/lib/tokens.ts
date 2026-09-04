/**
 * CreditIn Design Tokens
 * Extracted verbatim from existing tailwind.config.ts and globals.css
 * UI Freeze: Do NOT modify or add new tokens.
 */

export const tokens = {
  colors: {
    background: "hsl(0 0% 0%)",          // #000000 Pure black
    foreground: "hsl(0 0% 100%)",        // #ffffff Pure white
    card: "hsl(240 5% 10%)",             // #19191b Dark slate card
    cardForeground: "hsl(0 0% 100%)",
    popover: "hsl(240 5% 10%)",
    popoverForeground: "hsl(0 0% 100%)",
    primary: "hsl(271 81% 56%)",         // #9333ea Vibrant purple
    primaryForeground: "hsl(0 0% 100%)",
    secondary: "hsl(240 5% 16%)",        // #26262a Dark gray
    secondaryForeground: "hsl(0 0% 100%)",
    muted: "hsl(240 5% 20%)",            // #303036
    mutedForeground: "hsl(240 5% 65%)",  // #a1a1aa Soft gray
    accent: "hsl(271 81% 56%)",
    accentForeground: "hsl(0 0% 100%)",
    destructive: "hsl(0 62.8% 30.6%)",   // #7f1d1d Red
    destructiveForeground: "hsl(0 0% 100%)",
    border: "hsl(240 5% 16%)",           // #26262a
    input: "hsl(240 5% 16%)",
    ring: "hsl(271 81% 56%)",
    // Glassmorphism tokens
    glass: {
      bg: "rgba(255, 255, 255, 0.03)",
      border: "rgba(255, 255, 255, 0.09)",
      blur: "24px",
      btnBg: "rgba(255, 255, 255, 0.05)",
      btnBorder: "rgba(255, 255, 255, 0.14)",
    },
  },
  typography: {
    fontSans: "var(--font-outfit)",
    fontOrbitron: "var(--font-orbitron)",
  },
  borderRadius: {
    sm: "calc(1rem - 4px)",
    md: "calc(1rem - 2px)",
    lg: "1rem", // 16px
    full: "9999px",
  },
  spacing: {
    containerPadding: "2rem",
  },
} as const;
