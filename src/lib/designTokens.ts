export const DESIGN_TOKENS = {
  colors: {
    publicSurface: "var(--app-public-surface)",
    publicPaper: "var(--app-public-paper)",
    publicPrimary: "var(--app-public-primary)",
    publicAccent: "var(--app-public-accent)",
    publicHighlight: "var(--app-public-highlight)",
    adminDanger: "var(--app-admin-danger)",
  },
  classes: {
    publicAccentLink:
      "text-[var(--app-public-accent)] transition-colors hover:text-[var(--app-public-highlight)]",
    publicPaperBadge:
      "bg-[var(--app-public-paper)] text-[var(--app-public-surface)]",
    publicSurfaceBg: "bg-[var(--app-public-surface)]",
    publicPrimaryBg: "bg-[var(--app-public-primary)]",
    adminDangerText: "text-[var(--app-admin-danger)]",
  },
} as const;
