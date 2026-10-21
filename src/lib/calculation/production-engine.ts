export type SystemKind = 'folding' | 'sliding' | 'guillotine' | 'aldox';

export interface SystemDefinition {
	code: string;
	name: string;
	description: string;
	kind: SystemKind;
	glassType: string;
	panelWidth: number;
	glassSideDeduction: number;
	glassHeightDeduction: number;
	pricePerM2: number;
}

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
	warnings: string[];
}

export const SYSTEMS: SystemDefinition[] = [
	{ code: 'KATLANIR_8MM', name: '8 mm Katlanır', description: 'Gold seri katlanır cam balkon', kind: 'folding', glassType: '8 mm temperli', panelWidth: 650, glassSideDeduction: 42, glassHeightDeduction: 125, pricePerM2: 4800 },
	{ code: 'KATLANIR_OVAL', name: 'Oval Katlanır', description: 'Oval profilli katlanır sistem', kind: 'folding', glassType: '8 mm temperli', panelWidth: 650, glassSideDeduction: 44, glassHeightDeduction: 128, pricePerM2: 5000 },
	{ code: 'KATLANIR_ISICAM', name: 'Isıcamlı Katlanır', description: '4+12+4 ısıcamlı katlanır sistem', kind: 'folding', glassType: '4+12+4 ısıcam', panelWidth: 700, glassSideDeduction: 52, glassHeightDeduction: 142, pricePerM2: 6200 },
	{ code: 'SURME_GOLD_8MM', name: '8 mm Sürme', description: 'Gold seri raylı sürme sistem', kind: 'sliding', glassType: '8 mm temperli', panelWidth: 800, glassSideDeduction: 38, glassHeightDeduction: 105, pricePerM2: 4200 },
	{ code: 'SURME_ISICAM', name: 'Isıcamlı Sürme', description: '4+12+4 ısıcamlı raylı sürme', kind: 'sliding', glassType: '4+12+4 ısıcam', panelWidth: 850, glassSideDeduction: 48, glassHeightDeduction: 125, pricePerM2: 5900 },
	{ code: 'GIYOTIN', name: 'Giyotin Sistem', description: 'Motorlu dikey hareketli cam sistemi', kind: 'guillotine', glassType: '8 mm temperli', panelWidth: 1200, glassSideDeduction: 92, glassHeightDeduction: 190, pricePerM2: 9500 },
	{ code: 'ALDOX', name: 'Aldoks C60', description: 'Sabit doğrama ve cam kapı sistemi', kind: 'aldox', glassType: '4+12+4 ısıcam', panelWidth: 900, glassSideDeduction: 78, glassHeightDeduction: 78, pricePerM2: 4500 }
];

const profile = (code: string, name: string, role: string, length: number, quantity: number, angle = '45° / 45°'): CutLine => ({
	profileCode: code, profileName: name, role, length: Math.round(length), quantity: Math.max(0, Math.round(quantity)), angle
});

function optimizeStock(cuts: CutLine[], stockLength: number, kerf: number): StockBar[] {
	const grouped = new Map<string, Array<{ length: number; role: string; name: string }>>();
	for (const cut of cuts) {
		const pieces = grouped.get(cut.profileCode) ?? [];
		for (let i = 0; i < cut.quantity; i += 1) pieces.push({ length: cut.length, role: cut.role, name: cut.profileName });
		grouped.set(cut.profileCode, pieces);
	}
	const result: StockBar[] = [];
	for (const [code, pieces] of grouped) {
		const bars: Array<Array<{ length: number; role: string; name: string }>> = [];
		for (const piece of [...pieces].sort((a, b) => b.length - a.length)) {
			const bar = bars.find(items => items.reduce((sum, item) => sum + item.length, 0) + kerf * items.length + piece.length <= stockLength);
			if (bar) bar.push(piece); else bars.push([piece]);
		}
		bars.forEach((items, index) => {
			const cutsTotal = items.reduce((sum, item) => sum + item.length, 0);
			const used = cutsTotal + kerf * Math.max(items.length - 1, 0);
			result.push({ profileCode: code, profileName: items[0]?.name ?? code, barNo: index + 1, stockLength, pieces: items.map(({ length, role }) => ({ length, role })), used, waste: Math.max(0, stockLength - used), efficiency: Math.round(cutsTotal / stockLength * 1000) / 10 });
		});
	}
	return result;
}

export function calculateProduction(input: ProductionInput): ProductionResult {
	const system = SYSTEMS.find(item => item.code === input.systemCode) ?? SYSTEMS[0];
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

	if (system.kind === 'folding') {
		const oval = system.code === 'KATLANIR_OVAL';
		const insulated = system.code === 'KATLANIR_ISICAM';
		cuts.push(profile(insulated ? 'isi-1' : oval ? 'OVAL_UST_KASA' : '1250', insulated ? 'Isıcam Alt-Üst Kasa' : oval ? 'Oval Üst Kasa' : 'Gold Üst Kasa', 'Üst kasa', width, quantity));
		cuts.push(profile(insulated ? 'isi-1' : oval ? 'OVAL_ALT_KASA' : '1303', insulated ? 'Isıcam Alt-Üst Kasa' : oval ? 'Oval Alt Kasa' : 'Gold Damlalıklı Alt Kasa', 'Alt kasa', width, quantity));
		cuts.push(profile(insulated ? 'isi-3' : 'kat4', 'Yan Dikme', 'Yan dikme', height, quantity * 2));
		cuts.push(profile(insulated ? 'isi-2' : oval ? 'OVAL_BAZA' : 'kat3', insulated ? 'Isıcam Baza' : oval ? 'Oval Baza' : 'Baza 8 mm', 'Kanat yatay', panelWidth, panelCount * 2, '90° / 90°'));
		accessories.push({ name: 'Taşıyıcı teker', quantity: panelCount * 8, unit: 'adet' }, { name: 'Katlanır makas', quantity: panelCount * 2, unit: 'adet' }, { name: 'Kilit takımı', quantity: quantity, unit: 'takım' }, { name: 'Kılavuz', quantity: Math.max(0, panelCount - quantity) * 2, unit: 'adet' }, { name: 'Cam fitili', quantity: Math.ceil((glassWidth + glassHeight) * 2 * panelCount / 1000), unit: 'metre' });
	} else if (system.kind === 'sliding') {
		cuts.push(profile(system.code === 'SURME_ISICAM' ? '1165' : 'SRM-KASA', 'Sürme Üst Kasa', 'Üst kasa', width, quantity));
		cuts.push(profile(system.code === 'SURME_ISICAM' ? '1164' : 'SRM-RAY', 'Sürme Alt Ray', 'Alt ray', width, quantity));
		cuts.push(profile('1169', 'Sürme Üst Kanat', 'Üst kanat', panelWidth, panelCount, '90° / 90°'));
		cuts.push(profile('1167', 'Sürme Alt Kanat', 'Alt kanat', panelWidth, panelCount, '90° / 90°'));
		cuts.push(profile('1171', 'Sürme Yan Çıta', 'Yan çıta', glassHeight, panelCount * 2, '90° / 90°'));
		accessories.push({ name: 'Sürme rulman', quantity: panelCount * 2, unit: 'adet' }, { name: 'Stoper', quantity: panelCount * 2, unit: 'adet' }, { name: 'Kilit takımı', quantity, unit: 'takım' }, { name: 'Kıl fitil', quantity: Math.ceil((panelWidth + height) * 2 * panelCount / 1000), unit: 'metre' });
	} else if (system.kind === 'guillotine') {
		cuts.push(profile('GIYOTIN_KASA', 'Giyotin Üst Kasa', 'Üst kasa', width, quantity));
		cuts.push(profile('1261', 'Giyotin Alt Kasa', 'Alt kasa', width, quantity));
		cuts.push(profile('GIYOTIN_DIKEY', 'Giyotin Dikey Kızak', 'Yan dikme', height, quantity * 2));
		cuts.push(profile('GIYOTIN_KANAT', 'Giyotin Kanat Profili', 'Kanat yatay', panelWidth, panelCount * 2, '90° / 90°'));
		accessories.push({ name: 'Motor ve kontrol seti', quantity, unit: 'takım' }, { name: 'Emniyet ve halat seti', quantity, unit: 'takım' }, { name: 'Kanat rulmanı', quantity: panelCount * 4, unit: 'adet' });
	} else {
		cuts.push(profile('1106', 'Aldoks Geniş Kasa', 'Kasa yatay', width, quantity * 2));
		cuts.push(profile('1106', 'Aldoks Geniş Kasa', 'Kasa dikey', height, quantity * 2));
		cuts.push(profile('1104', 'Aldoks Geniş Kanat', 'Kanat yatay', panelWidth - 40, panelCount * 2));
		cuts.push(profile('1104', 'Aldoks Geniş Kanat', 'Kanat dikey', height - 80, panelCount * 2));
		if (panelsEach > 1) cuts.push(profile('1105', 'Aldoks Geniş Orta', 'Orta kayıt', height - 40, (panelsEach - 1) * quantity, '90° / 90°'));
		accessories.push({ name: 'Menteşe', quantity: panelCount * 3, unit: 'adet' }, { name: 'Kol ve kilit', quantity: panelCount, unit: 'takım' }, { name: 'Cam çıtası fitili', quantity: Math.ceil((glassWidth + glassHeight) * 2 * panelCount / 1000), unit: 'metre' });
	}

	const bars = optimizeStock(cuts, input.stockLength ?? 6500, input.kerf ?? 5);
	const profileMeters = cuts.reduce((sum, cut) => sum + cut.length * cut.quantity, 0) / 1000;
	const stockTotal = bars.reduce((sum, bar) => sum + bar.stockLength, 0);
	const usedTotal = bars.reduce((sum, bar) => sum + bar.used, 0);
	return {
		system, input: { ...input, width, height, quantity }, panelCount, panelWidth: Math.round(panelWidth), glassWidth: Math.round(glassWidth), glassHeight: Math.round(glassHeight), glassArea: Math.round(glassArea * 100) / 100, area: Math.round(area * 100) / 100,
		price: Math.round(area * (input.pricePerM2 || system.pricePerM2)), cuts, bars, accessories, profileMeters: Math.round(profileMeters * 100) / 100, stockBarCount: bars.length,
		efficiency: stockTotal ? Math.round(usedTotal / stockTotal * 1000) / 10 : 0, totalWaste: Math.round(bars.reduce((sum, bar) => sum + bar.waste, 0)),
		warnings: panelWidth > 1000 ? ['Kanat genişliği 1.000 mm üzerinde. Kanat sayısını artırmanız önerilir.'] : []
	};
}
