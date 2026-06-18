import { create } from 'zustand';

type Theme = 'dark' | 'light';

function apply(t: Theme) {
  const el = document.documentElement;
  if (t === 'light') el.classList.add('light');
  else el.classList.remove('light');
}

const stored: Theme =
  typeof localStorage !== 'undefined' && localStorage.getItem('theme') === 'light' ? 'light' : 'dark';

// Apply the persisted theme as early as possible (called from main.tsx).
export function initTheme() {
  apply(stored);
}

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: stored,
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    apply(next);
    set({ theme: next });
  },
}));
