import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AdminState {
    isAuthenticated: boolean;
    token: string | null;
}

interface AdminActions {
    login: (token: string) => void;
    logout: () => void;
    setToken: (token: string) => void;
}

export const useAdminStore = create<AdminState & AdminActions>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            token: null,

            login: (token: string) =>
                set({
                    isAuthenticated: true,
                    token
                }),

            logout: () =>
                set({
                    isAuthenticated: false,
                    token: null
                }),

            setToken: (token: string) =>
                set({
                    token,
                    isAuthenticated: !!token
                })
        }),
        {
            name: 'admin-storage',
            storage: createJSONStorage(() => sessionStorage)
        }
    )
);
