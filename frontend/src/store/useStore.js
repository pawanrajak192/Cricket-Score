import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid } from '../utils/id';
import { api } from '../api/client';

// Sync strategy: local-first.
// - Guest accounts (per the spec) never touch the server — everything stays
//   in this store's localStorage persistence, full stop.
// - Signed-up users: every action updates local state immediately (so the
//   UI never waits on a network round trip), then fires the matching API
//   call in the background. On login/signup we pull the user's matches down
//   from the server and merge them in, so a second device picks up where
//   the first left off.
// Swap the `api.*` calls below for different endpoints and nothing else in
// the app needs to change — every page only ever calls this store.

const useStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      matches: [],
      syncing: false,
      syncError: null,

      // ---- auth ----
      signup: async ({ name, email, mobile, password }) => {
        try {
          const { token, user } = await api.signup({ name, email, mobile, password });
          set({ user: { ...user, guest: false }, token });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      },
      login: async ({ identifier, password }) => {
        try {
          const { token, user } = await api.login({ identifier, password });
          set({ user: { ...user, guest: false }, token });
          get().syncFromServer();
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      },
      loginGuest: () => {
        const user = { id: uid('guest'), name: 'Guest', guest: true };
        set({ user, token: null });
        return { ok: true };
      },
      logout: () => set({ user: null, token: null }),

      // pulls this user's matches from the server and merges them into the
      // local cache (server copy wins for matches that exist in both places)
      syncFromServer: async () => {
        const { user, token } = get();
        if (!user || user.guest || !token) return;
        set({ syncing: true, syncError: null });
        try {
          const { matches: remote } = await api.listMatches(token);
          set((s) => {
            const others = s.matches.filter((m) => m.ownerId !== user.id);
            return { matches: [...others, ...remote], syncing: false };
          });
        } catch (e) {
          set({ syncing: false, syncError: e.message });
        }
      },

      // ---- matches ----
      createMatch: (match) => {
        const { user, token } = get();
        const full = { id: uid('m'), status: 'draft', innings: [], result: null, ...match };
        set((s) => ({ matches: [...s.matches, full] }));
        if (user && !user.guest && token) {
          api.createMatch(token, full).catch((e) => set({ syncError: e.message }));
        }
        return full;
      },
      updateMatch: (id, patch) => {
        const { user, token } = get();
        let updated = null;
        set((s) => ({
          matches: s.matches.map((m) => {
            if (m.id !== id) return m;
            updated = { ...m, ...patch };
            return updated;
          })
        }));
        if (user && !user.guest && token && updated) {
          api.updateMatch(token, id, updated).catch((e) => set({ syncError: e.message }));
        }
      },
      deleteMatch: (id) => {
        const { user, token } = get();
        set((s) => ({ matches: s.matches.filter((m) => m.id !== id) }));
        if (user && !user.guest && token) {
          api.deleteMatch(token, id).catch((e) => set({ syncError: e.message }));
        }
      },
      getMatch: (id) => get().matches.find((m) => m.id === id),
      myMatches: () => {
        const u = get().user;
        if (!u) return [];
        return get().matches.filter((m) => m.ownerId === u.id);
      }
    }),
    { name: 'crease-store', partialize: (s) => ({ user: s.user, token: s.token, matches: s.matches }) }
  )
);

export default useStore;
