import { supabase } from '../supabase';
import type { Database } from '../supabase';

export interface Bundle {
	systems: Array<{ code: string; name: string; kind: string }>;
	contexts: Record<string, unknown>;
	cut_fields: Record<string, unknown>;
	engine_source: string; // drawing_engine.py
	viewer_source: string; // viewer3d.py
	railing_source: string; // railing.py
	mobile_bridge_source: string; // mobile_bridge.py
	colors: Record<string, unknown>;
	glass_types: Record<string, unknown>;
	company: Record<string, unknown>;
	doc: Record<string, unknown>;
}

let cachedBundle: Bundle | null = null;

export async function loadBundle(): Promise<Bundle> {
	// Return cache if available
	if (cachedBundle) return cachedBundle;

	// Fetch from Supabase
	const { data, error } = await supabase
		.from('cb_records')
		.select('data')
		.eq('key', 'bundle')
		.single();

	if (error) {
		throw new Error(`Failed to load bundle: ${error.message}`);
	}

	if (!data?.data) {
		throw new Error('Bundle data is empty');
	}

	cachedBundle = data.data as unknown as Bundle;
	return cachedBundle;
}

export function getBundle(): Bundle | null {
	return cachedBundle;
}

export async function getPythonCode(): Promise<string> {
	const bundle = await loadBundle();

	// Combine all Python sources into one runnable module
	const code = `
# Bundle sources
${bundle.engine_source || ''}

${bundle.railing_source || ''}

${bundle.mobile_bridge_source || ''}

${bundle.viewer_source || ''}

# System contexts
SYSTEM_CONTEXTS = ${JSON.stringify(bundle.contexts || {})}
CUT_FIELDS = ${JSON.stringify(bundle.cut_fields || {})}
COLORS = ${JSON.stringify(bundle.colors || {})}
GLASS_TYPES = ${JSON.stringify(bundle.glass_types || {})}

# Calculate wrapper
def calculate(system_code, props):
	"""Calculate drawing from system and properties."""
	try:
		# Import the calculation function from engine
		if system_code.startswith('KATLANIR'):
			result = calculate_folding(system_code, props)
		elif system_code.startswith('SURME'):
			result = calculate_sliding(system_code, props)
		elif system_code.startswith('GIYOTIN'):
			result = calculate_guillotine(system_code, props)
		elif system_code.startswith('ALDOKS'):
			result = calculate_aldoks(system_code, props)
		elif system_code.startswith('ZIP'):
			result = calculate_zip(system_code, props)
		else:
			raise ValueError(f"Unknown system: {system_code}")

		return {
			"system": system_code,
			"props": props,
			"cuts": result.get("cuts", {}),
			"bars": result.get("bars", {}),
			"materials": result.get("materials", {}),
			"price": result.get("price", 0),
			"area": result.get("area", 0),
			"warnings": result.get("warnings", []),
			"errors": result.get("errors", [])
		}
	except Exception as e:
		return {
			"system": system_code,
			"props": props,
			"cuts": {},
			"bars": {},
			"materials": {},
			"price": 0,
			"area": 0,
			"errors": [str(e)]
		}
`;

	return code;
}
