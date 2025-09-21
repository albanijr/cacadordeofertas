class Logger {
	// chave localStorage: logs:YYYY-MM-DD -> JSON array de entries
	static getDateKey(date = new Date()) {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `logs:${y}-${m}-${d}`;
	}

	static init(options = {}) {
		this.options = options;
		this.maxEntries = options.maxEntries || 1000;
		this.autoConsole = options.autoConsole !== false;
		this.debugConsole = options.debug === true; // se true, mostra debug no console
		this.cleanOldLogsDays = options.cleanOldLogsDays || 30;
		this._cleanupOldLogs();
		this.info('Logger inicializado');
	}

	static _getRaw(key) {
		try {
			const raw = localStorage.getItem(key);
			return raw ? JSON.parse(raw) : [];
		} catch (e) {
			// falha ao parse -> reset
			localStorage.removeItem(key);
			return [];
		}
	}

	static _saveRaw(key, arr) {
		try {
			localStorage.setItem(key, JSON.stringify(arr.slice(-this.maxEntries)));
		} catch (e) {
			// localStorage cheio ou indisponível
			if (this.autoConsole) console.warn('Logger: falha ao salvar localStorage', e);
		}
	}

	static _append(level, message, meta) {
		const key = this.getDateKey();
		const list = this._getRaw(key);
		const entry = {
			timestamp: new Date().toISOString(),
			level,
			message: String(message),
			meta: meta || null
		};
		list.push(entry);
		this._saveRaw(key, list);
		if (this.autoConsole) {
			const out = `[${entry.timestamp}] ${level.toUpperCase()}: ${entry.message}`;
			if (level === 'error') console.error(out, meta); 
			else if (level === 'warn') console.warn(out, meta);
			else if (level === 'debug') {
				if (this.debugConsole) console.debug(out, meta);
			} else console.info(out, meta);
		}
	}

	static info(message, meta) { this._append('info', message, meta); }
	static warn(message, meta) { this._append('warn', message, meta); }
	static error(message, meta) { this._append('error', message, meta); }
	static debug(message, meta) { this._append('debug', message, meta); }

	// retorna todas as entradas do dia (array)
	static getTodayEntries(date = new Date()) {
		const key = this.getDateKey(date);
		return this._getRaw(key);
	}

	// gera e baixa o arquivo TXT com os logs do dia
	static downloadToday(date = new Date()) {
		const entries = this.getTodayEntries(date);
		const lines = entries.map(e => `[${e.timestamp}] ${e.level.toUpperCase()}: ${e.message}${e.meta ? ' | ' + JSON.stringify(e.meta) : ''}`);
		const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
		const filename = `logs_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}.txt`;
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		this.info('Log diário baixado', { filename });
	}

	// envio opcional para servidor (endpoint configurado)
	static async sendToday(endpoint, date = new Date()) {
		try {
			const entries = this.getTodayEntries(date);
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ date: date.toISOString(), entries })
			});
			if (!res.ok) throw new Error(`status ${res.status}`);
			this.info('Logs enviados para servidor', { endpoint });
			return true;
		} catch (err) {
			this.error('Falha ao enviar logs para servidor', { endpoint, error: String(err) });
			return false;
		}
	}

	static _cleanupOldLogs() {
		try {
			const now = new Date();
			for (let i = 31; i < 365; i++) { // limitar iterações
				const d = new Date(now);
				d.setDate(now.getDate() - i);
				const key = this.getDateKey(d);
				// se older than cleanOldLogsDays, remove
				const age = i;
				if (age > this.cleanOldLogsDays && localStorage.getItem(key)) {
					localStorage.removeItem(key);
				}
			}
		} catch (e) {
			// ignore
		}
	}
}

// disponibiliza globalmente
window.Logger = Logger;
