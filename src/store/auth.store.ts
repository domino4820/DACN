import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Visibility = 'PUBLIC' | 'GROUP_ONLY';

interface UserProfile {
    name: string | null;
    avatar_url: string | null;
    bio: string | null;
    visibility: Visibility;
    facebook: string | null;
    github: string | null;
}

interface UserStats {
    xp: number;
}

interface User {
    username: string;
    email: string;
    created_at: string | Date;
    profile: UserProfile | null;
    stats: UserStats | null;
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
}

interface AuthActions {
    setAuth: (token: string) => void;
    setFullUser: (user: User) => void;
    logout: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            setAuth: (token) =>
                set({
                    token,
                    isAuthenticated: true
                }),
            setFullUser: (user) =>
                set({
                    user
                }),
            logout: () =>
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false
                })
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage)
        }
    )
);
