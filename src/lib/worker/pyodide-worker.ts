// Web Worker for Pyodide Python execution
let pyodideReady = false;
let pyodide: any = null;

async function initPyodide() {
	if (pyodideReady) return;

	// Dynamic import for Pyodide with proper CDN loading
	const PyodideModule = await import('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.mjs');
	pyodide = await PyodideModule.loadPyodide({
		indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
	});
	pyodideReady = true;
}

self.onmessage = async (event: MessageEvent) => {
	const { id, type, code, function: funcName, args } = event.data;

	try {
		await initPyodide();

		let result;

		if (type === 'execute') {
			// Execute raw Python code
			result = await pyodide.runPythonAsync(code);
		} else if (type === 'call') {
			// Call a Python function
			const func = pyodide.globals.get(funcName);
			if (!func) throw new Error(`Function ${funcName} not found`);
			const pyArgs = pyodide.toPy(args);
			result = func(...pyArgs);
		}

		self.postMessage({
			id,
			success: true,
			result: pyodide.toPy(result)
		});
	} catch (error) {
		self.postMessage({
			id,
			success: false,
			error: error instanceof Error ? error.message : String(error)
		});
	}
};
