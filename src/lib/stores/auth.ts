import { writable, derived } from 'svelte/store';

type AppUser = {
	id: string;
	email: string;
};

const currentUser = writable<AppUser | null>(null);
export const user = derived(currentUser, ($user) => $user);
export const isAuthenticated = derived(currentUser, ($user) => $user !== null);

export const auth = {
	session: currentUser,
	user,
	isAuthenticated,
	async initialize() {
		const response = await fetch('/api/auth/session');
		if (!response.ok) {
			currentUser.set(null);
			return;
		}

		const data = await response.json();
		currentUser.set(data.user ?? null);
	},
	async signInWithPassword(email: string, password: string) {
		const response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ email, password })
		});
		const data = await response.json();

		if (!response.ok) throw new Error(data.message ?? 'Giriş başarısız');
		currentUser.set({ id: 'app-admin', email: data.email });
	},
	async signUp() {
		throw new Error('Yeni kullanıcı kaydı yönetici tarafından yapılır');
	},
	async signOut() {
		await fetch('/api/auth/logout', { method: 'POST' });
		currentUser.set(null);
	}
};
