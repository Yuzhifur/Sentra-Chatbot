// src/components/ThemeToggle.tsx
import React, { useState, useEffect } from 'react';
import { ThemeService, Theme } from '../services/ThemeService';
import './ThemeToggle.css';

interface ThemeToggleProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  size = 'medium',
  showLabel = true 
}) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Initialize theme on component mount
    const currentTheme = ThemeService.getCurrentTheme();
    setTheme(currentTheme);

    // Listen for theme changes from other components
    const handleThemeChange = (event: CustomEvent<{ theme: Theme }>) => {
      setTheme(event.detail.theme);
    };

    window.addEventListener('themeChanged', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
    };
  }, []);

  const handleToggle = () => {
    const newTheme = ThemeService.toggleTheme();
    setTheme(newTheme);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`theme-toggle-container ${className}`}>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? '🌙' : '☀️'} {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
      <button
        onClick={handleToggle}
        className={`theme-toggle-button ${size} ${isDark ? 'dark' : 'light'}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <div className="theme-toggle-track">
          <div className="theme-toggle-thumb">
            <span className="theme-toggle-icon">
              {isDark ? '🌙' : '☀️'}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};

export default ThemeToggle;