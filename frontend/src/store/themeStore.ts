import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: localStorage.getItem('theme') === 'dark',
  toggle: () =>
    set((state) => {
      const newDark = !state.isDark;
      localStorage.setItem('theme', newDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newDark);
      return { isDark: newDark };
    }),
  setDark: (isDark) => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
    set({ isDark });
  },
}));