export interface ThemeStyle {
  id: string;
  name: string;
  emoji: string;
  previewColor: string;
  primary: string;
  primaryLight: string;
  primaryGradient1: string;
  primaryGradient2: string;
  accent: string;
  text: string;
  textLight: string;
  textMuted: string;
  bg: string;
  bgCard: string;
  border: string;
  tagBg: string;
  tagText: string;
}

export const THEMES: Record<string, ThemeStyle> = {
  rose: {
    id: 'rose',
    name: '小红书经典红',
    emoji: '📕',
    previewColor: '#FF2442',
    primary: '#FF2442',
    primaryLight: '#FFF1F3',
    primaryGradient1: '#FF5E7A',
    primaryGradient2: '#FF2442',
    accent: '#FF4D6D',
    text: '#1F2937',
    textLight: '#4B5563',
    textMuted: '#9CA3AF',
    bg: '#FAFAFA',
    bgCard: '#FFFFFF',
    border: '#FFE4E8',
    tagBg: '#FFF0F2',
    tagText: '#E11D48',
  },
  cream: {
    id: 'cream',
    name: '暖调奶油咖',
    emoji: '☕',
    previewColor: '#D97706',
    primary: '#D97706',
    primaryLight: '#FEF3C7',
    primaryGradient1: '#FBBF24',
    primaryGradient2: '#D97706',
    accent: '#B45309',
    text: '#292524',
    textLight: '#57534E',
    textMuted: '#A8A29E',
    bg: '#FFFDF9',
    bgCard: '#FFFFFF',
    border: '#F5E6D3',
    tagBg: '#FEF3C7',
    tagText: '#B45309',
  },
  dark: {
    id: 'dark',
    name: '极客硬核黑',
    emoji: '⚡',
    previewColor: '#38BDF8',
    primary: '#38BDF8',
    primaryLight: 'rgba(56, 189, 248, 0.15)',
    primaryGradient1: '#38BDF8',
    primaryGradient2: '#0284C7',
    accent: '#34D399',
    text: '#F8FAFC',
    textLight: '#CBD5E1',
    textMuted: '#64748B',
    bg: '#0F172A',
    bgCard: '#1E293B',
    border: '#334155',
    tagBg: 'rgba(56, 189, 248, 0.2)',
    tagText: '#38BDF8',
  },
  mint: {
    id: 'mint',
    name: '薄荷清新绿',
    emoji: '🌿',
    previewColor: '#10B981',
    primary: '#059669',
    primaryLight: '#ECFDF5',
    primaryGradient1: '#34D399',
    primaryGradient2: '#059669',
    accent: '#047857',
    text: '#064E3B',
    textLight: '#047857',
    textMuted: '#6EE7B7',
    bg: '#F7FCF9',
    bgCard: '#FFFFFF',
    border: '#D1FAE5',
    tagBg: '#DEF7EC',
    tagText: '#03543F',
  },
  ocean: {
    id: 'ocean',
    name: '冰川专业蓝',
    emoji: '❄️',
    previewColor: '#2563EB',
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    primaryGradient1: '#60A5FA',
    primaryGradient2: '#2563EB',
    accent: '#1D4ED8',
    text: '#1E293B',
    textLight: '#475569',
    textMuted: '#94A3B8',
    bg: '#F8FAFC',
    bgCard: '#FFFFFF',
    border: '#DBEAFE',
    tagBg: '#E0F2FE',
    tagText: '#0369A1',
  },
  lavender: {
    id: 'lavender',
    name: '优雅暮色紫',
    emoji: '🔮',
    previewColor: '#8B5CF6',
    primary: '#7C3AED',
    primaryLight: '#F5F3FF',
    primaryGradient1: '#A78BFA',
    primaryGradient2: '#7C3AED',
    accent: '#6D28D9',
    text: '#2E1065',
    textLight: '#5B21B6',
    textMuted: '#C4B5FD',
    bg: '#FAF8FF',
    bgCard: '#FFFFFF',
    border: '#EDE9FE',
    tagBg: '#F3E8FF',
    tagText: '#6B21A8',
  }
};
