import { json } from '@sveltejs/kit';
import { SESSION_COOKIE } from '#lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	cookies.delete(SESSION_COOKIE, { path: '/' });
	return json({ ok: true });
};
