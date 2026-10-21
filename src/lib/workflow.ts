export const PROJECT_STATUSES = [
	{ code: 'OLCULDU', label: 'Ölçü Alındı', color: '#64748b' },
	{ code: 'TEKLIF_VERILDI', label: 'Teklif Verildi', color: '#2563eb' },
	{ code: 'ONAYLANDI', label: 'Onaylandı', color: '#7c3aed' },
	{ code: 'URETIMDE', label: 'Üretimde', color: '#d97706' },
	{ code: 'HAZIR', label: 'Üretim Hazır', color: '#ca8a04' },
	{ code: 'MONTAJ_PLANLANDI', label: 'Montaj Planlandı', color: '#0891b2' },
	{ code: 'MONTAJDA', label: 'Montajda', color: '#0f8b8d' },
	{ code: 'TESLIM', label: 'Teslim Edildi', color: '#16a34a' },
	{ code: 'IPTAL', label: 'İptal Edildi', color: '#dc2626' }
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]['code'];

export function statusInfo(code?: string) {
	return PROJECT_STATUSES.find((item) => item.code === code) ?? PROJECT_STATUSES[0];
}

export function nextStatus(code?: string) {
	const flow = PROJECT_STATUSES.filter((item) => item.code !== 'IPTAL');
	const index = flow.findIndex((item) => item.code === code);
	return flow[Math.min(Math.max(index + 1, 1), flow.length - 1)];
}

export function recordData(record: unknown): Record<string, any> {
	if (!record || typeof record !== 'object') return {};
	const data = (record as { data?: unknown }).data;
	return data && typeof data === 'object' ? data as Record<string, any> : {};
}

export function formatMoney(value: unknown) {
	return Number(value || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
}
