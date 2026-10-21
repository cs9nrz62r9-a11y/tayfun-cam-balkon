import { json } from '@sveltejs/kit';
import { adminEmail, SESSION_COOKIE, validSession } from '#lib/server/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ cookies }) => {
	if (!validSession(cookies.get(SESSION_COOKIE))) {
		return json({ authenticated: false }, { status: 401 });
	}

	return json({ authenticated: true, user: { id: 'app-admin', email: adminEmail() } });
};
