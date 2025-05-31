// src/services/ThemeService.ts
export type Theme = 'light' | 'dark';

export class ThemeService {
  private static readonly THEME_KEY = 'sentra-theme';
  
  /**
   * Get the current theme from localStorage or default to light
   */
  static getCurrentTheme(): Theme {
    if (typeof window === 'undefined') return 'light';
    
    try {
      const savedTheme = localStorage.getItem(this.THEME_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
    } catch (error) {
      console.warn('Error reading theme from localStorage:', error);
    }
    
    // Check system preference as fallback
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  }
  
  /**
   * Set the theme and save to localStorage
   */
  static setTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.THEME_KEY, theme);
      this.applyTheme(theme);
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme }
      }));
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }
  
  /**
   * Apply theme by adding/removing class on document body
   */
  static applyTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;
    
    const body = document.body;
    if (theme === 'dark') {
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
    }
  }
  
  /**
   * Toggle between light and dark theme
   */
  static toggleTheme(): Theme {
    const currentTheme = this.getCurrentTheme();
    const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    return newTheme;
  }
  
  /**
   * Initialize theme on app start
   */
  static initializeTheme(): void {
    const theme = this.getCurrentTheme();
    this.applyTheme(theme);
  }
  
  /**
   * Listen for system theme changes
   */
  static listenForSystemThemeChanges(): () => void {
    if (typeof window === 'undefined') return () => {};
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedTheme = localStorage.getItem(this.THEME_KEY);
      if (!savedTheme) {
        const systemTheme: Theme = e.matches ? 'dark' : 'light';
        this.applyTheme(systemTheme);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Return cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }
}