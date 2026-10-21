import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
	public: {
		Tables: {
			cb_records: {
				Row: {
					key: string;
					kind:
						| 'customer'
						| 'project'
						| 'drawing'
						| 'bundle'
						| 'webapp'
						| 'cut'
						| 'sysedit'
						| 'quote'
						| 'template'
						| 'service'
						| 'payment'
						| 'stock'
						| 'recipe';
					data: Record<string, unknown>;
					origin: 'desktop' | 'mobile' | 'web';
					deleted: boolean;
					updated_at: string;
				};
				Insert: Omit<Database['public']['Tables']['cb_records']['Row'], 'updated_at'>;
				Update: Partial<Database['public']['Tables']['cb_records']['Row']>;
			};
		};
	};
};
