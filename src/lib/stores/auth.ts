import { writable, derived } from 'svelte/store';
import { supabase } from '../supabase';
import type { Session } from '@supabase/supabase-js';

const session = writable<Session | null>(null);
export const user = derived(session, $session => $session?.user ?? null);
export const isAuthenticated = derived(session, $session => $session !== null);

export const auth = {
	session,
	user,
	isAuthenticated,
	async initialize() {
		const { data } = await supabase.auth.getSession();
		session.set(data.session);

		// Listen for auth changes
		const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
			session.set(newSession);
		});

		return () => listener?.subscription.unsubscribe();
	},
	async signInWithPassword(email: string, password: string) {
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) throw error;
	},
	async signUp(email: string, password: string) {
		const { error } = await supabase.auth.signUp({ email, password });
		if (error) throw error;
	},
	async signOut() {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
	}
};
