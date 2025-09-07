import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

// This custom hook manages the application's color theme.
export function useTheme(): [Theme, () => void] {
  // State to hold the current theme, defaulting to 'dark' initially.
  const [theme, setTheme] = useState<Theme>('dark'); 

  // Effect to run on initial component mount to determine the correct theme.
  useEffect(() => {
    // Check localStorage for a previously saved theme preference.
    const storedTheme = window.localStorage.getItem('theme') as Theme | null;
    
    // Default to 'dark' mode if no theme is stored, ignoring system preference for design consistency.
    const initialTheme = storedTheme || 'dark';
    setTheme(initialTheme);
  }, []);

  // Effect to run whenever the theme state changes.
  useEffect(() => {
    const root = document.documentElement;
    // Add or remove the 'dark' class on the <html> element based on the current theme.
    // Tailwind's `darkMode: 'class'` strategy relies on this.
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Persist the new theme choice to localStorage.
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  // A memoized function to toggle the theme between 'light' and 'dark'.
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  // Return the current theme and the function to toggle it.
  return [theme, toggleTheme];
}
