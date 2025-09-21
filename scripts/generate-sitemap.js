const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const BASE_URL = 'https://seudominio.com'; // <-- ALTERE para seu domínio (sem barra final)
const DB_PATH = path.join(__dirname, '..', 'data', 'produtos.db');
const SITEMAP_PATH = path.join(__dirname, '..', 'sitemap.xml');

function formatDateSQLToYMD(raw) {
	// tenta parsear strings de data comuns e retornar YYYY-MM-DD, senão retorna null
	if (!raw) return null;
	const d = new Date(raw);
	if (isNaN(d)) return null;
	return d.toISOString().split('T')[0];
}

function escapeUrl(u) {
	return u.replace(/&/g, '&amp;').replace(/"/g, '%22');
}

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
	if (err) {
		console.error('Erro ao abrir banco SQLite:', err.message);
		process.exit(1);
	}
});

const stream = fs.createWriteStream(SITEMAP_PATH, { encoding: 'utf8' });
stream.write('<?xml version="1.0" encoding="UTF-8"?>\n');
stream.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');

// adiciona URLs estáticas principais
const staticUrls = [
	{ loc: `${BASE_URL}/`, changefreq: 'daily', priority: '1.0' },
	{ loc: `${BASE_URL}/promocoes`, changefreq: 'daily', priority: '0.9' },
	{ loc: `${BASE_URL}/categorias`, changefreq: 'weekly', priority: '0.8' }
];

staticUrls.forEach(u => {
	stream.write('  <url>\n');
	stream.write(`    <loc>${escapeUrl(u.loc)}</loc>\n`);
	stream.write(`    <changefreq>${u.changefreq}</changefreq>\n`);
	stream.write(`    <priority>${u.priority}</priority>\n`);
	stream.write('  </url>\n');
});

// consulta produtos e adiciona cada produto (assume que página de produto é /produto/{id} - ajuste se necessário)
db.all("SELECT id, data_publicacao FROM products", [], (err, rows) => {
	if (err) {
		console.error('Erro ao consultar produtos:', err.message);
		db.close();
		stream.end('</urlset>\n');
		process.exit(1);
	}

	rows.forEach(row => {
		const id = row.id == null ? '' : String(row.id);
		const lastmod = formatDateSQLToYMD(row.data_publicacao) || null;
		const loc = `${BASE_URL}/produto/${encodeURIComponent(id)}`;

		stream.write('  <url>\n');
		stream.write(`    <loc>${escapeUrl(loc)}</loc>\n`);
		if (lastmod) stream.write(`    <lastmod>${lastmod}</lastmod>\n`);
		stream.write('    <changefreq>weekly</changefreq>\n');
		stream.write('    <priority>0.6</priority>\n');
		stream.write('  </url>\n');
	});

	stream.end('</urlset>\n', () => {
		console.log(`Sitemap gerado em: ${SITEMAP_PATH}`);
		db.close();
	});
});
