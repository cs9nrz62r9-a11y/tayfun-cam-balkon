import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'tayfun_session';

function safeEqual(left: string, right: string) {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);

	return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sessionToken() {
	if (!process.env.APP_SESSION_SECRET) return '';

	return createHmac('sha256', process.env.APP_SESSION_SECRET)
		.update('tayfun-cam-balkon-session-v1')
		.digest('hex');
}

export function validCredentials(email: string, password: string) {
	if (!process.env.APP_ADMIN_EMAIL || !process.env.APP_ADMIN_PASSWORD) return false;

	return (
		safeEqual(
			email.trim().toLocaleLowerCase('tr-TR'),
			process.env.APP_ADMIN_EMAIL.trim().toLocaleLowerCase('tr-TR')
		) && safeEqual(password, process.env.APP_ADMIN_PASSWORD)
	);
}

export function createSessionToken() {
	return sessionToken();
}

export function validSession(token: string | undefined) {
	const expected = sessionToken();
	return Boolean(token && expected && safeEqual(token, expected));
}

export function adminEmail() {
	return process.env.APP_ADMIN_EMAIL ?? '';
}
