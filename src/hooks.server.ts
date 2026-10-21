import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, validSession } from '#lib/server/session';

const protectedRoutes = [
	'/analytics',
	'/customers',
	'/designs',
	'/projects',
	'/settings',
	'/systems',
	'/teklif',
	'/templates',
	'/wizard'
];

export const handle = async ({ event, resolve }: { event: any; resolve: any }) => {
	const { pathname } = event.url;

	if (pathname === '/auth/signup') {
		redirect(303, '/auth/login');
	}

	if (
		protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) &&
		!validSession(event.cookies.get(SESSION_COOKIE))
	) {
		redirect(303, '/auth/login');
	}

	return resolve(event);
};
