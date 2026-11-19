export interface UiTheme {
  id: string;
  name: string;
  emoji: string;
  type: 'dark' | 'light';
  preview: string;
  colors: {
    appBg: string;
    sidebarBg: string;
    headerBg: string;
    panelBg: string;
    previewBg: string;
    border: string;
    borderSubtle: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    inputBg: string;
    btnPrimary: string;
    btnPrimaryHover: string;
    btnPrimaryText: string;
    accent: string;
    accentLight: string;
    cardBorder: string;
  };
}

export const UI_THEMES: Record<string, UiTheme> = {
  'dark-red': {
    id: 'dark-red',
    name: '经典黑曜红',
    emoji: '📕',
    type: 'dark',
    preview: '#FF2442',
    colors: {
      appBg: '#090D16',
      sidebarBg: '#0F172A',
      headerBg: 'rgba(15, 23, 42, 0.75)',
      panelBg: '#131D33',
      previewBg: '#070A10',
      border: '#1E293B',
      borderSubtle: '#334155',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      inputBg: '#0B1120',
      btnPrimary: 'linear-gradient(135deg, #FF2442 0%, #E11D48 100%)',
      btnPrimaryHover: 'linear-gradient(135deg, #FF4560 0%, #FF2442 100%)',
      btnPrimaryText: '#FFFFFF',
      accent: '#FF2442',
      accentLight: 'rgba(255, 36, 66, 0.15)',
      cardBorder: '#1E293B',
    }
  },
  'light-clean': {
    id: 'light-clean',
    name: '素雅极简白',
    emoji: '🤍',
    type: 'light',
    preview: '#F1F5F9',
    colors: {
      appBg: '#F8FAFC',
      sidebarBg: '#FFFFFF',
      headerBg: 'rgba(255, 255, 255, 0.85)',
      panelBg: '#FFFFFF',
      previewBg: '#F1F5F9',
      border: '#E2E8F0',
      borderSubtle: '#CBD5E1',
      text: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#94A3B8',
      inputBg: '#F8FAFC',
      btnPrimary: 'linear-gradient(135deg, #FF2442 0%, #E11D48 100%)',
      btnPrimaryHover: 'linear-gradient(135deg, #E01935 0%, #BE123C 100%)',
      btnPrimaryText: '#FFFFFF',
      accent: '#FF2442',
      accentLight: 'rgba(255, 36, 66, 0.08)',
      cardBorder: '#E2E8F0',
    }
  },
  'warm-cream': {
    id: 'warm-cream',
    name: '温润燕麦奶咖',
    emoji: '☕',
    type: 'light',
    preview: '#FBF7EE',
    colors: {
      appBg: '#F7F2E7',
      sidebarBg: '#FFFDF9',
      headerBg: 'rgba(255, 253, 249, 0.88)',
      panelBg: '#FFFDF9',
      previewBg: '#EFE9DC',
      border: '#E8DCC8',
      borderSubtle: '#D7C6AC',
      text: '#2C221E',
      textSecondary: '#6B584E',
      textMuted: '#9E887C',
      inputBg: '#F8F3EA',
      btnPrimary: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
      btnPrimaryHover: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      btnPrimaryText: '#FFFFFF',
      accent: '#D97706',
      accentLight: 'rgba(217, 119, 6, 0.12)',
      cardBorder: '#E6DAC5',
    }
  },
  'midnight-navy': {
    id: 'midnight-navy',
    name: '深海夜阑蓝',
    emoji: '🌌',
    type: 'dark',
    preview: '#0B192C',
    colors: {
      appBg: '#060E1A',
      sidebarBg: '#0B192C',
      headerBg: 'rgba(11, 25, 44, 0.85)',
      panelBg: '#0F223D',
      previewBg: '#040913',
      border: '#1E3E62',
      borderSubtle: '#2B588B',
      text: '#F0F8FF',
      textSecondary: '#9BC0E4',
      textMuted: '#5882AC',
      inputBg: '#081322',
      btnPrimary: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
      btnPrimaryHover: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
      btnPrimaryText: '#FFFFFF',
      accent: '#38BDF8',
      accentLight: 'rgba(56, 189, 248, 0.15)',
      cardBorder: '#1E3E62',
    }
  },
  'forest-green': {
    id: 'forest-green',
    name: '松柏墨玉绿',
    emoji: '🌲',
    type: 'dark',
    preview: '#0B231A',
    colors: {
      appBg: '#061610',
      sidebarBg: '#0B231A',
      headerBg: 'rgba(11, 35, 26, 0.85)',
      panelBg: '#0F2F23',
      previewBg: '#040F0B',
      border: '#1B4736',
      borderSubtle: '#26634C',
      text: '#F2FBF6',
      textSecondary: '#A3D9C3',
      textMuted: '#5D9981',
      inputBg: '#081B14',
      btnPrimary: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      btnPrimaryHover: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
      btnPrimaryText: '#FFFFFF',
      accent: '#10B981',
      accentLight: 'rgba(16, 185, 129, 0.15)',
      cardBorder: '#1B4736',
    }
  }
};
