/**
 * Python Calculation Engine via Pyodide Web Worker
 * Loads drawing_engine.py and related modules from bundle
 */

interface CalculationRequest {
	system: string;
	props: Record<string, unknown>;
}

interface CalculationResult {
	system: string;
	props: Record<string, unknown>;
	cuts: Record<string, unknown>;
	bars: Record<string, unknown>;
	materials: Record<string, unknown>;
	price: number;
	area: number;
	image?: string; // Base64 encoded 2D drawing
	warnings?: string[];
	errors?: string[];
}

class PythonEngine {
	private worker: Worker | null = null;
	private requestId = 0;
	private pendingRequests = new Map<
		number,
		{ resolve: (result: any) => void; reject: (error: any) => void }
	>();

	constructor() {
		// Worker will be initialized on first use
	}

	private ensureWorker() {
		if (!this.worker) {
			this.worker = new Worker(new URL('../worker/pyodide-worker.ts', import.meta.url), {
				type: 'module'
			});

			this.worker.onmessage = (event: MessageEvent) => {
				const { id, success, result, error } = event.data;
				const pending = this.pendingRequests.get(id);

				if (pending) {
					if (success) {
						pending.resolve(result);
					} else {
						pending.reject(new Error(error));
					}
					this.pendingRequests.delete(id);
				}
			};

			this.worker.onerror = (error: ErrorEvent) => {
				console.error('Worker error:', error);
			};
		}
	}

	async initialize(pythonCode: string) {
		this.ensureWorker();

		return new Promise<void>((resolve, reject) => {
			const id = this.requestId++;
			this.pendingRequests.set(id, {
				resolve: () => resolve(),
				reject
			});

			this.worker!.postMessage({
				id,
				type: 'execute',
				code: pythonCode
			});
		});
	}

	async calculate(request: CalculationRequest): Promise<CalculationResult> {
		this.ensureWorker();

		return new Promise<CalculationResult>((resolve, reject) => {
			const id = this.requestId++;
			this.pendingRequests.set(id, {
				resolve: (result: any) => {
					// Convert result from Python
					resolve({
						system: request.system,
						props: request.props,
						cuts: result.cuts || {},
						bars: result.bars || {},
						materials: result.materials || {},
						price: result.price || 0,
						area: result.area || 0,
						image: result.image,
						warnings: result.warnings,
						errors: result.errors
					} as CalculationResult);
				},
				reject
			});

			this.worker!.postMessage({
				id,
				type: 'call',
				function: 'calculate',
				args: [request.system, request.props]
			});
		});
	}

	terminate() {
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}
	}
}

export const pythonEngine = new PythonEngine();
