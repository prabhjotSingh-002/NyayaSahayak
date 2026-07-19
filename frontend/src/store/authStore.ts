import { create } from 'zustand'

interface AuthState {
  user: any;
  session: any;
  loading: boolean;
  setUser: (user: any) => void;
  setSession: (session: any) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    const { supabase } = await import('../lib/supabase')
    await supabase.auth.signOut()
    set({ user: null, session: null })
  }
}))
