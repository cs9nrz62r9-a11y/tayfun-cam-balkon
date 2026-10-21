import { findSystemDefinition, SYSTEMS, type SystemDefinition, type SystemKind } from './system-catalog';

export { SYSTEMS };
export type { SystemDefinition, SystemKind };

export interface ProductionInput {
	systemCode: string;
	width: number;
	height: number;
	quantity: number;
	panelCount?: number;
	color: string;
	glassType: string;
	stockLength?: number;
	kerf?: number;
	pricePerM2?: number;
	/** Her stok boyunun iki ucundan ayrı ayrı temizlenecek miktar. */
	edgeTrim?: number;
	/** Bu değere eşit veya büyük kalan parça yeniden kullanılabilir artık sayılır. */
	usableRemnantThreshold?: number;
}

export interface CutLine {
	profileCode: string;
	profileName: string;
	role: string;
	length: number;
	quantity: number;
	angle: string;
}

export interface StockBar {
	profileCode: string;
	profileName: string;
	barNo: number;
	stockLength: number;
	pieces: Array<{ length: number; role: string }>;
	used: number;
	waste: number;
	efficiency: number;
	usableLength: number;
	edgeTrim: number;
	reusableRemnant: boolean;
	reusableRemnantLength: number;
	scrapWaste: number;
}

export interface AccessoryLine {
	name: string;
	quantity: number;
	unit: string;
}

export interface ProductionResult {
	system: SystemDefinition;
	input: ProductionInput;
	panelCount: number;
	panelWidth: number;
	glassWidth: number;
	glassHeight: number;
	glassArea: number;
	area: number;
	price: number;
	cuts: CutLine[];
	bars: StockBar[];
	accessories: AccessoryLine[];
	profileMeters: number;
	stockBarCount: number;
	efficiency: number;
	totalWaste: number;
	totalReusableRemnant: number;
	totalScrapWaste: number;
	warnings: string[];
}

const profile = (code: string, name: string, role: string, length: number, quantity: number, angle = '45° / 45°'): CutLine => ({
	profileCode: code, profileName: name, role, length: Math.max(0, Math.round(length)), quantity: Math.max(0, Math.round(quantity)), angle
});

function optimizeStock(cuts: CutLine[], stockLength: number, kerf: number, edgeTrim: number, usableRemnantThreshold: number, warnings: string[]): StockBar[] {
	const usableLength = Math.max(stockLength - edgeTrim * 2, 0);
	const grouped = new Map<string, Array<{ length: number; role: string; name: string }>>();
	for (const cut of cuts) {
		const pieces = grouped.get(cut.profileCode) ?? [];
		for (let i = 0; i < cut.quantity; i += 1) pieces.push({ length: cut.length, role: cut.role, name: cut.profileName });
		grouped.set(cut.profileCode, pieces);
	}

	const result: StockBar[] = [];
	for (const [code, pieces] of grouped) {
		const validPieces = pieces.filter((piece) => {
			if (piece.length <= usableLength) return true;
			warnings.push(`${code} için ${piece.length} mm parça, ${stockLength} mm stok boyunun temizlenmiş kullanılabilir alanına sığmıyor.`);
			return false;
		});
		const bars: Array<Array<{ length: number; role: string; name: string }>> = [];
		for (const piece of [...validPieces].sort((a, b) => b.length - a.length)) {
			let bestBar: Array<{ length: number; role: string; name: string }> | undefined;
			let bestRemainder = Number.POSITIVE_INFINITY;
			for (const items of bars) {
				const occupied = items.reduce((sum, item) => sum + item.length, 0) + kerf * items.length;
				const remainder = usableLength - occupied - piece.length;
				if (remainder >= 0 && remainder < bestRemainder) {
					bestBar = items;
					bestRemainder = remainder;
				}
			}
			if (bestBar) bestBar.push(piece);
			else bars.push([piece]);
		}
		bars.forEach((items, index) => {
			const cutsTotal = items.reduce((sum, item) => sum + item.length, 0);
			const used = cutsTotal + kerf * Math.max(items.length - 1, 0);
			const remainder = Math.max(0, usableLength - used);
			const reusableRemnant = remainder >= usableRemnantThreshold;
			result.push({
				profileCode: code,
				profileName: items[0]?.name ?? code,
				barNo: index + 1,
				stockLength,
				pieces: items.map(({ length, role }) => ({ length, role })),
				used,
				waste: Math.max(0, stockLength - used),
				efficiency: Math.round(cutsTotal / stockLength * 1000) / 10,
				usableLength,
				edgeTrim,
				reusableRemnant,
				reusableRemnantLength: reusableRemnant ? remainder : 0,
				scrapWaste: edgeTrim * 2 + (reusableRemnant ? 0 : remainder)
			});
		});
	}
	return result;
}

function addFoldingRecipe(system: SystemDefinition, width: number, height: number, quantity: number, panelWidth: number, panelCount: number, cuts: CutLine[], accessories: AccessoryLine[]) {
	const oval = system.code === 'KATLANIR_OVAL';
	const insulated = system.code === 'KATLANIR_ISICAM';
	cuts.push(profile(insulated ? 'isi-1' : oval ? 'OVAL_UST_KASA' : '1250', insulated ? 'Isıcam Alt-Üst Kasa' : oval ? 'Oval Üst Kasa' : 'Gold Üst Kasa', 'Üst kasa', width, quantity));
	cuts.push(profile(insulated ? 'isi-1' : oval ? 'OVAL_ALT_KASA' : '1303', insulated ? 'Isıcam Alt-Üst Kasa' : oval ? 'Oval Alt Kasa' : 'Gold Damlalıklı Alt Kasa', 'Alt kasa', width, quantity));
	cuts.push(profile(insulated ? 'isi-3' : 'kat4', 'Yan Dikme', 'Yan dikme', height, quantity * 2));
	cuts.push(profile(insulated ? 'isi-2' : oval ? 'OVAL_BAZA' : 'kat3', insulated ? 'Isıcam Baza' : oval ? 'Oval Baza' : 'Baza 8 mm', 'Kanat yatay', panelWidth, panelCount * 2, '90° / 90°'));
	accessories.push({ name: 'Taşıyıcı teker', quantity: panelCount * 8, unit: 'adet' }, { name: 'Katlanır makas', quantity: panelCount * 2, unit: 'adet' }, { name: 'Kilit takımı', quantity, unit: 'takım' }, { name: 'Kılavuz', quantity: Math.max(0, panelCount - quantity) * 2, unit: 'adet' });
}

function addSlidingRecipe(system: SystemDefinition, width: number, quantity: number, panelWidth: number, panelCount: number, glassHeight: number, cuts: CutLine[], accessories: AccessoryLine[]) {
	cuts.push(profile(system.code === 'SURME_ISICAM' ? '1165' : 'SRM-KASA', 'Sürme Üst Kasa', 'Üst kasa', width, quantity));
	cuts.push(profile(system.code === 'SURME_ISICAM' ? '1164' : 'SRM-RAY', 'Sürme Alt Ray', 'Alt ray', width, quantity));
	cuts.push(profile('1169', 'Sürme Üst Kanat', 'Üst kanat', panelWidth, panelCount, '90° / 90°'));
	cuts.push(profile('1167', 'Sürme Alt Kanat', 'Alt kanat', panelWidth, panelCount, '90° / 90°'));
	cuts.push(profile('1171', 'Sürme Yan Çıta', 'Yan çıta', glassHeight, panelCount * 2, '90° / 90°'));
	accessories.push({ name: 'Sürme rulman', quantity: panelCount * 2, unit: 'adet' }, { name: 'Stoper', quantity: panelCount * 2, unit: 'adet' }, { name: 'Kilit takımı', quantity, unit: 'takım' });
}

function addGenericRecipe(system: SystemDefinition, width: number, height: number, quantity: number, panelsEach: number, panelCount: number, panelWidth: number, cuts: CutLine[], accessories: AccessoryLine[]) {
	if (system.kind === 'screen') {
		cuts.push(profile('SCREEN-17X25', '17x25 Sineklik Profili', 'Yatay çerçeve', width, quantity * 2));
		cuts.push(profile('SCREEN-17X25', '17x25 Sineklik Profili', 'Dikey çerçeve', height, quantity * 2));
		accessories.push({ name: 'Sineklik köşesi', quantity: quantity * 4, unit: 'adet' }, { name: 'Sineklik tülü', quantity: Math.round(width * height * quantity) / 1_000_000, unit: 'm²' }, { name: 'Fitil', quantity: Math.ceil((width + height) * 2 * quantity / 1000), unit: 'metre' });
	} else if (system.kind === 'railing') {
		const round = system.code === 'RAILING_ROUND';
		cuts.push(profile(round ? 'ROUND-TOP' : 'SQUARE-TOP', round ? 'Yuvarlak Küpeşte Borusu' : 'Kare Küpeşte Profili', 'Üst küpeşte', width, quantity, '90° / 90°'));
		cuts.push(profile(round ? 'ROUND-POST' : 'SQUARE-POST', round ? 'Yuvarlak Ayak' : 'Kare Dikme', 'Dikme', height, (panelsEach + 1) * quantity, '90° / 90°'));
		accessories.push({ name: round ? 'Yuvarlak bağlantı seti' : 'Kare dikme bağlantı seti', quantity: (panelsEach + 1) * quantity, unit: 'takım' }, { name: 'Montaj bağlantıları', quantity: (panelsEach + 1) * quantity, unit: 'takım' });
	} else if (system.kind === 'zip') {
		cuts.push(profile('ZIP-KASET', 'Zip Kaset Profili', 'Üst kaset', width, quantity, '90° / 90°'));
		cuts.push(profile('ZIP-YAN', 'Zip Yan Profil', 'Yan kanal', height, quantity * 2, '90° / 90°'));
		cuts.push(profile('ZIP-ETEK', 'Zip Etek Profili', 'Alt etek', width, quantity, '90° / 90°'));
		accessories.push({ name: 'Screen kumaş', quantity: Math.round(width * height * quantity) / 1_000_000, unit: 'm²' }, { name: 'Fermuar', quantity: Math.ceil(height * 2 * quantity / 1000), unit: 'metre' }, { name: 'Motor/mekanizma seti', quantity, unit: 'takım' });
	} else {
		cuts.push(profile('1106', 'Aldoks Geniş Kasa', 'Kasa yatay', width, quantity * 2));
		cuts.push(profile('1106', 'Aldoks Geniş Kasa', 'Kasa dikey', height, quantity * 2));
		cuts.push(profile('1104', 'Aldoks Geniş Kanat', 'Kanat yatay', panelWidth - 40, panelCount * 2));
		cuts.push(profile('1104', 'Aldoks Geniş Kanat', 'Kanat dikey', height - 80, panelCount * 2));
		if (panelsEach > 1) cuts.push(profile('1105', 'Aldoks Geniş Orta', 'Orta kayıt', height - 40, (panelsEach - 1) * quantity, '90° / 90°'));
		accessories.push({ name: 'Menteşe', quantity: panelCount * 3, unit: 'adet' }, { name: 'Kol ve kilit', quantity: panelCount, unit: 'takım' });
	}
}

export function calculateProduction(input: ProductionInput): ProductionResult {
	const system = findSystemDefinition(input.systemCode);
	const warnings: string[] = [];
	const width = Math.max(500, Number(input.width));
	const height = Math.max(500, Number(input.height));
	const quantity = Math.max(1, Math.round(Number(input.quantity) || 1));
	const panelsEach = Math.max(1, input.panelCount ? Math.round(input.panelCount) : Math.ceil(width / system.panelWidth));
	const panelCount = panelsEach * quantity;
	const panelWidth = width / panelsEach;
	const glassWidth = Math.max(0, panelWidth - system.glassSideDeduction);
	const glassHeight = Math.max(0, height - system.glassHeightDeduction);
	const area = width * height * quantity / 1_000_000;
	const glassArea = glassWidth * glassHeight * panelCount / 1_000_000;
	const cuts: CutLine[] = [];
	const accessories: AccessoryLine[] = [];

	if (system.kind === 'folding') addFoldingRecipe(system, width, height, quantity, panelWidth, panelCount, cuts, accessories);
	else if (system.kind === 'sliding') addSlidingRecipe(system, width, quantity, panelWidth, panelCount, glassHeight, cuts, accessories);
	else if (system.kind === 'guillotine') {
		cuts.push(profile('GIYOTIN_KASA', 'Giyotin Üst Kasa', 'Üst kasa', width, quantity));
		cuts.push(profile('1261', 'Giyotin Alt Kasa', 'Alt kasa', width, quantity));
		cuts.push(profile('GIYOTIN_DIKEY', 'Giyotin Dikey Kızak', 'Yan dikme', height, quantity * 2));
		cuts.push(profile('GIYOTIN_KANAT', 'Giyotin Kanat Profili', 'Kanat yatay', panelWidth, panelCount * 2, '90° / 90°'));
		accessories.push({ name: 'Motor ve kontrol seti', quantity, unit: 'takım' }, { name: 'Emniyet ve halat seti', quantity, unit: 'takım' }, { name: 'Kanat rulmanı', quantity: panelCount * 4, unit: 'adet' });
	} else addGenericRecipe(system, width, height, quantity, panelsEach, panelCount, panelWidth, cuts, accessories);

	if (system.kind === 'folding') accessories.push({ name: 'Cam fitili', quantity: Math.ceil((glassWidth + glassHeight) * 2 * panelCount / 1000), unit: 'metre' });
	if (system.kind === 'sliding') accessories.push({ name: 'Kıl fitil', quantity: Math.ceil((panelWidth + height) * 2 * panelCount / 1000), unit: 'metre' });
	if (system.kind === 'aldox') accessories.push({ name: 'Cam çıtası fitili', quantity: Math.ceil((glassWidth + glassHeight) * 2 * panelCount / 1000), unit: 'metre' });

	const requestedStock = Number(input.stockLength ?? 6500);
	const stockLength = Number.isFinite(requestedStock) && requestedStock >= 1000 ? requestedStock : 6500;
	const kerf = Math.max(0, Number(input.kerf ?? 5));
	const edgeTrim = Math.max(0, Number(input.edgeTrim ?? 0));
	const usableRemnantThreshold = Math.max(0, Number(input.usableRemnantThreshold ?? 300));
	if (!system.recipe.stockLengths.includes(stockLength)) warnings.push(`${stockLength} mm özel stok boyu kullanılıyor; standart seçenekler 6000, 6500 ve 7000 mm'dir.`);
	if (edgeTrim * 2 >= stockLength) warnings.push('Uç temizleme payı stok boyunun kullanılabilir alanını sıfırlıyor.');
	if (system.recipe.requiresManufacturerCalibration) warnings.push(`Üretici kalibrasyonu gerekli: ${system.recipe.notes.join(' ')}`);
	if (panelWidth > 1000) warnings.push('Kanat/panel genişliği 1.000 mm üzerinde. Kanat sayısını ve sistem sınırını kontrol edin.');

	const bars = optimizeStock(cuts, stockLength, kerf, edgeTrim, usableRemnantThreshold, warnings);
	const profileMeters = cuts.reduce((sum, cut) => sum + cut.length * cut.quantity, 0) / 1000;
	const stockTotal = bars.reduce((sum, bar) => sum + bar.stockLength, 0);
	const usedTotal = bars.reduce((sum, bar) => sum + bar.used, 0);
	return {
		system,
		input: { ...input, width, height, quantity, stockLength, kerf, edgeTrim, usableRemnantThreshold },
		panelCount,
		panelWidth: Math.round(panelWidth),
		glassWidth: Math.round(glassWidth),
		glassHeight: Math.round(glassHeight),
		glassArea: Math.round(glassArea * 100) / 100,
		area: Math.round(area * 100) / 100,
		price: Math.round(area * (input.pricePerM2 || system.pricePerM2)),
		cuts,
		bars,
		accessories,
		profileMeters: Math.round(profileMeters * 100) / 100,
		stockBarCount: bars.length,
		efficiency: stockTotal ? Math.round(usedTotal / stockTotal * 1000) / 10 : 0,
		totalWaste: Math.round(bars.reduce((sum, bar) => sum + bar.waste, 0)),
		totalReusableRemnant: Math.round(bars.reduce((sum, bar) => sum + bar.reusableRemnantLength, 0)),
		totalScrapWaste: Math.round(bars.reduce((sum, bar) => sum + bar.scrapWaste, 0)),
		warnings: [...new Set(warnings)]
	};
}
