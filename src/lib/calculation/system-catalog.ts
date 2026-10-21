export type SystemKind = 'folding' | 'sliding' | 'guillotine' | 'aldox' | 'screen' | 'railing' | 'zip';

export type RecipeAccuracy = 'legacy-web-baseline' | 'generic-workflow';

export interface RecipeMetadata {
	accuracy: RecipeAccuracy;
	source: string;
	stockLengths: readonly number[];
	requiresManufacturerCalibration: boolean;
	notes: readonly string[];
}

export interface SystemDefinition {
	code: string;
	aliases?: readonly string[];
	name: string;
	description: string;
	kind: SystemKind;
	glassType: string;
	panelWidth: number;
	glassSideDeduction: number;
	glassHeightDeduction: number;
	pricePerM2: number;
	recipe: RecipeMetadata;
}

const STOCK_LENGTHS = [6000, 6500, 7000] as const;

const legacyRecipe = (source: string, notes: readonly string[] = []): RecipeMetadata => ({
	accuracy: 'legacy-web-baseline', source, stockLengths: STOCK_LENGTHS, requiresManufacturerCalibration: true, notes
});

const genericRecipe = (notes: readonly string[]): RecipeMetadata => ({
	accuracy: 'generic-workflow',
	source: 'Cam Balkon Analiz Pro iş akışı; üretici reçetesi doğrulanmadı',
	stockLengths: STOCK_LENGTHS,
	requiresManufacturerCalibration: true,
	notes
});

export const SYSTEMS: SystemDefinition[] = [
	{ code: 'KATLANIR_8MM', name: '8 mm Katlanır', description: 'Gold seri katlanır cam balkon', kind: 'folding', glassType: '8 mm temperli', panelWidth: 650, glassSideDeduction: 42, glassHeightDeduction: 125, pricePerM2: 4800, recipe: legacyRecipe('Mevcut web reçetesi', ['Kapak, köşe ve dikme payları üretici serisine göre doğrulanmalıdır.']) },
	{ code: 'KATLANIR_OVAL', name: 'Oval Katlanır', description: 'Oval profilli katlanır sistem', kind: 'folding', glassType: '8 mm temperli', panelWidth: 650, glassSideDeduction: 44, glassHeightDeduction: 128, pricePerM2: 5000, recipe: legacyRecipe('Mevcut web reçetesi', ['Oval seri profil ve kapak düşümleri tedarikçi kataloğuyla eşleştirilmelidir.']) },
	{ code: 'KATLANIR_ISICAM', name: 'Isıcamlı Katlanır', description: '4+12+4 ısıcamlı katlanır sistem', kind: 'folding', glassType: '4+12+4 ısıcam', panelWidth: 700, glassSideDeduction: 52, glassHeightDeduction: 142, pricePerM2: 6200, recipe: legacyRecipe('Mevcut web reçetesi', ['Isıcam fitil, baza ve kapak girişleri seri bazında kalibre edilmelidir.']) },
	{ code: 'SURME_GOLD_8MM', aliases: ['SURME_8MM'], name: '8 mm Sürme', description: 'Gold seri raylı sürme sistem', kind: 'sliding', glassType: '8 mm temperli', panelWidth: 800, glassSideDeduction: 38, glassHeightDeduction: 105, pricePerM2: 4200, recipe: legacyRecipe('Mevcut web reçetesi', ['Ray sayısı ve eşik seçimi sonraki doğruluk paketinde reçeteye bağlanmalıdır.']) },
	{ code: 'SURME_ISICAM', name: 'Isıcamlı Sürme', description: '4+12+4 ısıcamlı raylı sürme', kind: 'sliding', glassType: '4+12+4 ısıcam', panelWidth: 850, glassSideDeduction: 48, glassHeightDeduction: 125, pricePerM2: 5900, recipe: legacyRecipe('Mevcut web reçetesi', ['Üç, dört ve beş ray profil eşleşmeleri üretici serisine göre doğrulanmalıdır.']) },
	{ code: 'GIYOTIN', name: 'Giyotin Sistem', description: 'Motorlu dikey hareketli cam sistemi', kind: 'guillotine', glassType: '8 mm temperli', panelWidth: 1200, glassSideDeduction: 92, glassHeightDeduction: 190, pricePerM2: 9500, recipe: legacyRecipe('Mevcut web reçetesi', ['Motor modeli, boru payı ve Star Plus profil düşümleri seçilen üreticiye göre kalibre edilmelidir.']) },
	{ code: 'ALDOX', name: 'Aldoks C60', description: 'Sabit doğrama ve cam kapı sistemi', kind: 'aldox', glassType: '4+12+4 ısıcam', panelWidth: 900, glassSideDeduction: 78, glassHeightDeduction: 78, pricePerM2: 4500, recipe: legacyRecipe('Mevcut web reçetesi', ['Kasa, kanat, orta kayıt ve çıta payları hücre tipine göre doğrulanmalıdır.']) },
	{ code: 'SINEKLIK_17X25', name: '17/25 Sineklik', description: '17x25 çerçeve, tül ve fitil reçetesi', kind: 'screen', glassType: 'Sineklik tülü', panelWidth: 1200, glassSideDeduction: 0, glassHeightDeduction: 0, pricePerM2: 0, recipe: genericRecipe(['17x25 profil kesimleri net dış ölçü üzerinden başlatılır.', 'Köşe birleştirme ve tül/fitil payı üretici aparatına göre tanımlanmalıdır.']) },
	{ code: 'RAILING_25X60', name: 'Kare Küpeşte', description: 'Kare profilli camlı veya bariyerli korkuluk', kind: 'railing', glassType: 'Korkuluk camı', panelWidth: 1000, glassSideDeduction: 0, glassHeightDeduction: 0, pricePerM2: 0, recipe: genericRecipe(['Dikme aralığı proje ve yönetmelik şartlarına göre onaylanmalıdır.', 'Küpeşte, dikme, baza ve cam giriş payları seçilen seriye göre kalibre edilmelidir.']) },
	{ code: 'RAILING_ROUND', name: 'Yuvarlak Küpeşte', description: 'Yuvarlak küpeşte, ayak ve çubuklu korkuluk', kind: 'railing', glassType: 'Çubuklu korkuluk', panelWidth: 700, glassSideDeduction: 0, glassHeightDeduction: 0, pricePerM2: 0, recipe: genericRecipe(['Ayak ve çubuk aralıkları proje ve yönetmelik şartlarına göre onaylanmalıdır.', 'Boru çapı, et kalınlığı ve bağlantı aksesuarları üretici kataloğuyla eşleştirilmelidir.']) },
	{ code: 'ZIP_PERDE', name: 'Zip Perde', description: 'Kasetli, fermuarlı dikey screen sistemi', kind: 'zip', glassType: 'Screen kumaş', panelWidth: 3000, glassSideDeduction: 0, glassHeightDeduction: 0, pricePerM2: 0, recipe: genericRecipe(['Kaset, sarım borusu, kumaş ve etek kesimleri net dış ölçüden başlatılır.', 'Kaset seçimi, sarım payı ve motor torku üretici tablosu olmadan kesinleştirilmemelidir.']) }
];

export function findSystemDefinition(code: string): SystemDefinition {
	return SYSTEMS.find((item) => item.code === code || item.aliases?.includes(code)) ?? SYSTEMS[0];
}
