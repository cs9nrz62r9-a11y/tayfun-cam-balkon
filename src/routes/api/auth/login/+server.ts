import { json } from '@sveltejs/kit';
import { createSessionToken, SESSION_COOKIE, validCredentials } from '#lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json().catch(() => null);
	const email = typeof body?.email === 'string' ? body.email : '';
	const password = typeof body?.password === 'string' ? body.password : '';

	if (!validCredentials(email, password)) {
		return json({ message: 'E-posta veya şifre hatalı' }, { status: 401 });
	}

	cookies.set(SESSION_COOKIE, createSessionToken(), {
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		path: '/',
		maxAge: 60 * 60 * 24 * 30
	});

	return json({ ok: true, email });
};
