import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from './themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light');
    useThemeStore.setState({ theme: 'dark' });
  });

  it('toggles dark→light: updates state, persists, adds the html.light class', () => {
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('toggles back to dark: removes the class and persists', () => {
    useThemeStore.getState().toggle(); // → light
    useThemeStore.getState().toggle(); // → dark
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });
});
