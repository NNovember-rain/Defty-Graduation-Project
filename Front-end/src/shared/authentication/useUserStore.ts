import { create } from 'zustand';

// --- Types ---
export interface Permission {
    name: string;
}

export interface Role {
    name: string;
    description?: string;
    permissions: Permission[];
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    dob?: string;
    roles: Role[];
}

export interface UserState {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    setUser: (userData: UserProfile) => void;
    clearUser: () => void;
    setLoading: (status: boolean) => void;
    setError: (errorMessage: string | null) => void;
    updateProfile: (partialUser: Partial<UserProfile>) => void;
    hasRole: (roleName: string) => boolean;
    hasAnyRole: (roleNames: string[]) => boolean;
    hasPermission: (permissionName: string) => boolean;
}

// --- Store ---
export const useUserStore = create<UserState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    setUser: (userData) => {
        set({
            user: userData,
            isAuthenticated: true,
            error: null,
        });
    },

    clearUser: () => {
        set({
            user: null,
            isAuthenticated: false,
            error: null,
        });
    },

    setLoading: (status) => {
        set({ isLoading: status });
    },

    setError: (errorMessage) => {
        set({ error: errorMessage });
    },

    updateProfile: (partialUser) => {
        set((state) => ({
            user: state.user
                ? { ...state.user, ...partialUser }
                : null,
        }));
    },

    hasRole: (roleName) => {
        const userRoles = get().user?.roles;
        return userRoles ? userRoles.some(role => role.name === roleName) : false;
    },

    hasAnyRole: (roleNames) => {
        const userRoles = get().user?.roles;
        if (!userRoles) return false;
        return roleNames.some(targetRole => userRoles.some(userRole => userRole.name === targetRole));
    },

    hasPermission: (permissionName) => {
        const userRoles = get().user?.roles;
        if (!userRoles) return false;
        return userRoles.some(role =>
            role.permissions.some(perm => perm.name === permissionName)
        );
    },
}));