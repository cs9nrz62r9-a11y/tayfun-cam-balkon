import { writable } from 'svelte/store';
import { supabase } from '../supabase';
import type { Database } from '../supabase';

type CBRecord = Database['public']['Tables']['cb_records']['Row'];

interface DataStore {
	projects: Record<string, CBRecord>;
	customers: Record<string, CBRecord>;
	drawings: Record<string, CBRecord>;
	quotes: Record<string, CBRecord>;
	templates: Record<string, CBRecord>;
	bundle: CBRecord | null;
	loading: boolean;
	error: string | null;
}

function createDataStore() {
	const store = writable<DataStore>({
		projects: {},
		customers: {},
		drawings: {},
		quotes: {},
		templates: {},
		bundle: null,
		loading: false,
		error: null
	});

	return {
		subscribe: store.subscribe,
		async loadAll() {
			store.update(s => ({ ...s, loading: true }));
			try {
				const { data, error } = await supabase
					.from('cb_records')
					.select('*')
					.or('kind.eq.customer,kind.eq.project,kind.eq.drawing,kind.eq.quote,kind.eq.template,kind.eq.bundle')
					.eq('deleted', false);

				if (error) throw error;

				const projects: Record<string, CBRecord> = {};
				const customers: Record<string, CBRecord> = {};
				const drawings: Record<string, CBRecord> = {};
				const quotes: Record<string, CBRecord> = {};
				const templates: Record<string, CBRecord> = {};
				let bundle: CBRecord | null = null;

				data?.forEach(record => {
					if (record.kind === 'project') projects[record.key] = record;
					else if (record.kind === 'customer') customers[record.key] = record;
					else if (record.kind === 'drawing') drawings[record.key] = record;
					else if (record.kind === 'quote') quotes[record.key] = record;
					else if (record.kind === 'template') templates[record.key] = record;
					else if (record.kind === 'bundle') bundle = record;
				});

				store.update(s => ({
					...s,
					projects,
					customers,
					drawings,
					quotes,
					templates,
					bundle,
					loading: false,
					error: null
				}));
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Failed to load data';
				store.update(s => ({ ...s, loading: false, error: message }));
			}
		},
		setupRealtimeListeners() {
			// Subscribe to all changes
			const subscription = supabase
				.channel('cb_records')
				.on(
					'postgres_changes',
					{ event: '*', schema: 'public', table: 'cb_records' },
					payload => {
						const record = payload.new as CBRecord;
						if (record.deleted) {
							// Remove deleted record
							store.update(s => {
								const newState = { ...s };
								if (record.kind === 'project') delete newState.projects[record.key];
								else if (record.kind === 'customer') delete newState.customers[record.key];
								else if (record.kind === 'drawing') delete newState.drawings[record.key];
								else if (record.kind === 'quote') delete newState.quotes[record.key];
								else if (record.kind === 'template') delete newState.templates[record.key];
								return newState;
							});
						} else {
							// Add or update record
							store.update(s => {
								if (record.kind === 'project') return { ...s, projects: { ...s.projects, [record.key]: record } };
								if (record.kind === 'customer') return { ...s, customers: { ...s.customers, [record.key]: record } };
								if (record.kind === 'drawing') return { ...s, drawings: { ...s.drawings, [record.key]: record } };
								if (record.kind === 'quote') return { ...s, quotes: { ...s.quotes, [record.key]: record } };
								if (record.kind === 'template') return { ...s, templates: { ...s.templates, [record.key]: record } };
								if (record.kind === 'bundle') return { ...s, bundle: record };
								return s;
							});
						}
					}
				)
				.subscribe();

			return () => subscription.unsubscribe();
		}
	};
}

export const data = createDataStore();
