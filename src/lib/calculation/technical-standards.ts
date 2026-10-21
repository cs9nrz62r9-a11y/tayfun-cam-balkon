export const STOCK_LENGTH_OPTIONS = [6000, 6500, 7000] as const;

export type StockLength = (typeof STOCK_LENGTH_OPTIONS)[number];
export type RecipeApprovalStatus = 'pending' | 'verified';

export type ProductionSettings = {
	stockLength: StockLength;
	sawKerf: number;
	endTrim: number;
	reusableOffcutThreshold: number;
	recipeApproval: {
		status: RecipeApprovalStatus;
		manufacturer: string;
		series: string;
		catalogUrl: string;
		catalogRevision: string;
		approvedBy: string;
		approvedAt: string;
	};
};

export const DEFAULT_PRODUCTION_SETTINGS: ProductionSettings = {
	stockLength: 6500,
	sawKerf: 3,
	endTrim: 10,
	reusableOffcutThreshold: 500,
	recipeApproval: {
		status: 'pending',
		manufacturer: '',
		series: '',
		catalogUrl: '',
		catalogRevision: '',
		approvedBy: '',
		approvedAt: ''
	}
};

export const TECHNICAL_STANDARDS = [
	{
		code: 'TS EN 12150',
		title: 'Temperli emniyet camı',
		note: 'Temperli camın ürün standardı ve uygunluk doğrulaması.'
	},
	{
		code: 'TS EN 1279',
		title: 'Yalıtım camı birimleri',
		note: 'Isıcam üretimi, toleransları ve kalite değerlendirmesi.'
	},
	{
		code: 'TS EN 12488',
		title: 'Cam takma esasları',
		note: 'Düşey ve eğimli camların taşıma, takozlama ve montaj önerileri.'
	}
] as const;

export function normalizeProductionSettings(value: unknown): ProductionSettings {
	const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
	const approval =
		source.recipeApproval && typeof source.recipeApproval === 'object'
			? (source.recipeApproval as Record<string, unknown>)
			: {};
	const stock = Number(source.stockLength);

	return {
		stockLength: STOCK_LENGTH_OPTIONS.includes(stock as StockLength)
			? (stock as StockLength)
			: DEFAULT_PRODUCTION_SETTINGS.stockLength,
		sawKerf: finiteNumber(source.sawKerf, DEFAULT_PRODUCTION_SETTINGS.sawKerf),
		endTrim: finiteNumber(source.endTrim, DEFAULT_PRODUCTION_SETTINGS.endTrim),
		reusableOffcutThreshold: finiteNumber(
			source.reusableOffcutThreshold,
			DEFAULT_PRODUCTION_SETTINGS.reusableOffcutThreshold
		),
		recipeApproval: {
			status: approval.status === 'verified' ? 'verified' : 'pending',
			manufacturer: text(approval.manufacturer),
			series: text(approval.series),
			catalogUrl: text(approval.catalogUrl),
			catalogRevision: text(approval.catalogRevision),
			approvedBy: text(approval.approvedBy),
			approvedAt: text(approval.approvedAt)
		}
	};
}

export function validateProductionSettings(settings: ProductionSettings): string[] {
	const errors: string[] = [];
	if (!STOCK_LENGTH_OPTIONS.includes(settings.stockLength))
		errors.push('Stok boyu 6000, 6500 veya 7000 mm olmalıdır.');
	if (!inRange(settings.sawKerf, 0, 20)) errors.push('Testere payı 0-20 mm arasında olmalıdır.');
	if (!inRange(settings.endTrim, 0, 100))
		errors.push('Uç temizleme payı 0-100 mm arasında olmalıdır.');
	if (!inRange(settings.reusableOffcutThreshold, 0, settings.stockLength))
		errors.push('Kullanılabilir artık eşiği stok boyundan büyük olamaz.');

	if (settings.recipeApproval.status === 'verified') {
		const approval = settings.recipeApproval;
		if (!approval.manufacturer.trim()) errors.push('Doğrulanmış reçete için üretici zorunludur.');
		if (!approval.series.trim()) errors.push('Doğrulanmış reçete için sistem serisi zorunludur.');
		if (!isHttpUrl(approval.catalogUrl))
			errors.push('Geçerli bir üretici katalog bağlantısı girilmelidir.');
		if (!approval.catalogRevision.trim()) errors.push('Katalog tarihi veya revizyonu zorunludur.');
		if (!approval.approvedBy.trim()) errors.push('Reçeteyi onaylayan kişi zorunludur.');
		if (!approval.approvedAt) errors.push('Reçete onay tarihi zorunludur.');
	}
	return errors;
}

function finiteNumber(value: unknown, fallback: number) {
	const number = Number(value);
	return Number.isFinite(number) ? number : fallback;
}

function text(value: unknown) {
	return typeof value === 'string' ? value : '';
}

function inRange(value: number, minimum: number, maximum: number) {
	return Number.isFinite(value) && value >= minimum && value <= maximum;
}

function isHttpUrl(value: string) {
	try {
		const url = new URL(value);
		return url.protocol === 'https:' || url.protocol === 'http:';
	} catch {
		return false;
	}
}
