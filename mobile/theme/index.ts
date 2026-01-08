import { TextStyle } from 'react-native';

export const COLORS = {
    background: '#0A0A0A',
    surface: '#111111',
    card: '#161616',
    primary: '#E10600',
    secondaryRed: '#FF3B3B',
    border: '#2A2A2A',
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    success: '#22C55E',
    danger: '#EF4444',
} as const;

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
} as const;

export const BORDER_RADIUS = {
    s: 8,
    m: 12,
    l: 16,
    full: 9999,
} as const;

// Properly typed typography for React Native
export const TYPOGRAPHY: Record<string, TextStyle> = {
    h1: { fontSize: 32, fontWeight: '700', color: COLORS.textPrimary },
    h2: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
    h3: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary },
    body: { fontSize: 16, color: COLORS.textPrimary },
    label: { fontSize: 14, color: COLORS.textSecondary },
    small: { fontSize: 12, color: COLORS.textSecondary },
};

export const THEME = {
    colors: COLORS,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    typography: TYPOGRAPHY,
};
