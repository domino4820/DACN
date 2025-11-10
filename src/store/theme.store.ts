import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ThemeState {
    isDark: boolean;
}

interface ThemeActions {
    toggleTheme: () => void;
    setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState & ThemeActions>()(
    persist(
        (set) => ({
            isDark: false,
            toggleTheme: () =>
                set((state) => {
                    const newIsDark = !state.isDark;
                    if (newIsDark) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                    return { isDark: newIsDark };
                }),
            setTheme: (isDark: boolean) =>
                set(() => {
                    if (isDark) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                    return { isDark };
                })
        }),
        {
            name: 'theme',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    if (state.isDark) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                }
            }
        }
    )
);
