import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateProduction, SYSTEMS } from './production-engine';

const input = (systemCode: string, overrides: Record<string, unknown> = {}) => ({ systemCode, width: 3200, height: 2700, quantity: 1, color: 'Eloksal', glassType: '8 mm temperli', ...overrides });

test('catalog exposes every requested production family', () => {
	const codes = new Set(SYSTEMS.map((system) => system.code));
	for (const code of ['KATLANIR_8MM', 'KATLANIR_OVAL', 'KATLANIR_ISICAM', 'SURME_GOLD_8MM', 'SURME_ISICAM', 'GIYOTIN', 'ALDOX', 'SINEKLIK_17X25', 'RAILING_25X60', 'RAILING_ROUND', 'ZIP_PERDE']) assert.ok(codes.has(code), `${code} katalogda bulunamadı`);
});

test('legacy folding calculation remains compatible', () => {
	const result = calculateProduction(input('KATLANIR_8MM'));
	assert.equal(result.panelCount, 5);
	assert.equal(result.panelWidth, 640);
	assert.equal(result.glassWidth, 598);
	assert.equal(result.glassHeight, 2575);
	assert.ok(result.cuts.length > 0);
});

test('legacy sliding alias resolves to the canonical system', () => {
	assert.equal(calculateProduction(input('SURME_8MM')).system.code, 'SURME_GOLD_8MM');
});

test('6000, 6500 and 7000 mm stock lengths honor kerf and edge trim', () => {
	for (const stockLength of [6000, 6500, 7000]) {
		const result = calculateProduction(input('SINEKLIK_17X25', { width: 1100, height: 1400, stockLength, kerf: 4, edgeTrim: 20, usableRemnantThreshold: 300 }));
		assert.ok(result.bars.length > 0);
		assert.ok(result.bars.every((bar) => bar.stockLength === stockLength));
		assert.ok(result.bars.every((bar) => bar.usableLength === stockLength - 40));
		assert.ok(result.bars.every((bar) => bar.used <= bar.usableLength));
	}
});

test('reusable remnants are separated from scrap', () => {
	const result = calculateProduction(input('ZIP_PERDE', { width: 2000, height: 2200, stockLength: 6500, edgeTrim: 20, usableRemnantThreshold: 500 }));
	assert.ok(result.totalReusableRemnant >= 0);
	assert.ok(result.totalScrapWaste >= 0);
	assert.ok(result.bars.every((bar) => bar.reusableRemnant ? bar.reusableRemnantLength >= 500 : bar.reusableRemnantLength === 0));
});

test('new generic recipes produce output and calibration warnings', () => {
	for (const code of ['SINEKLIK_17X25', 'RAILING_25X60', 'RAILING_ROUND', 'ZIP_PERDE']) {
		const result = calculateProduction(input(code));
		assert.ok(result.cuts.length > 0, `${code} kesim üretmedi`);
		assert.ok(result.accessories.length > 0, `${code} aksesuar üretmedi`);
		assert.ok(result.warnings.some((warning) => warning.includes('Üretici kalibrasyonu gerekli')));
	}
});
