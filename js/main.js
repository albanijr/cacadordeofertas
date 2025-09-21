// Main application script

class PromotionsApp {
    constructor() {
        this.filtersManager = new FiltersManager();
        this.products = [];
        this.lastUpdateTime = null;
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            // Show loading overlay
            this.showLoadingOverlay(true);
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            // Load products
            await this.loadProducts();
            
            // Load filters from URL
            this.filtersManager.loadFiltersFromURL();
            
            // Hide loading overlay
            this.showLoadingOverlay(false);
            
            // Initialize other features
            this.initializeLazyLoading();
            this.initializeAnalytics();
            
            console.log('Promotions app initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Erro ao carregar a aplicação. Tente recarregar a página.');
        }
    }
    
    /**
     * Load products from SQLite (sql.js) — sem fallback para CSV
     * Agora tenta múltiplos nomes de arquivo em data/ e fornece logs detalhados
     */
    async loadProducts() {
        try {
            // Possíveis caminhos do arquivo SQLite (prioridade)
            const candidatePaths = [
                'data/produtos.db'
            ];

            // Ensure sql.js is initialized
            const SQL = await ensureInitSqlJs();

            let resp = null;
            let usedPath = null;
            const errors = [];

            // Tentar encontrar um arquivo válido
            for (const p of candidatePaths) {
                try {
                    console.info(`Tentando carregar SQLite em: ${p}`);
                    const r = await fetch(p);
                    if (r.ok) {
                        resp = r;
                        usedPath = p;
                        console.info(`Encontrado arquivo SQLite em: ${p}`);
                        break;
                    } else {
                        errors.push({ path: p, status: r.status, statusText: r.statusText });
                        console.warn(`Arquivo não disponível em ${p} (status ${r.status})`);
                    }
                } catch (fetchErr) {
                    errors.push({ path: p, error: String(fetchErr) });
                    console.warn(`Erro ao tentar fetch ${p}:`, fetchErr);
                }
            }

            if (!resp) {
                console.error('Nenhum arquivo SQLite encontrado. Tentativas:', errors);
                const tried = candidatePaths.join(', ');
                this.showError(`Arquivo de dados não encontrado. Foram tentados: ${tried}`);
                // Mantém produtos vazios e atualiza UI
                this.products = [];
                this.filtersManager.setProducts(this.products);
                this.lastUpdateTime = null;
                this.updateLastUpdateDisplay();
                return;
            }

            // Carrega DB a partir do arquivo encontrado
            const buffer = await resp.arrayBuffer();
            const db = new SQL.Database(new Uint8Array(buffer));

            // Possíveis nomes de tabela (priorizar 'produtos' conforme sua imagem)
            const tableCandidates = ['produtos', 'products'];

            // Encontrar tabela válida usando PRAGMA table_info
            let foundTable = null;
            for (const t of tableCandidates) {
                try {
                    const pragma = db.exec(`PRAGMA table_info('${t}')`);
                    if (pragma && pragma.length > 0 && pragma[0].values && pragma[0].values.length > 0) {
                        foundTable = t;
                        console.info(`Tabela encontrada: ${t}`);
                        break;
                    }
                } catch (err) {
                    // ignora e tenta próxima
                }
            }

            // Se nenhuma das tabelas esperadas existir, tentar identificar a primeira tabela do DB
            if (!foundTable) {
                try {
                    const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
                    if (tablesRes && tablesRes.length && tablesRes[0].values.length) {
                        foundTable = tablesRes[0].values[0][0]; // primeiro nome de tabela
                        console.warn(`Nenhuma tabela esperada encontrada; usando primeira tabela detectada: ${foundTable}`);
                    }
                } catch (err) {
                    // nada
                }
            }

            if (!foundTable) {
                throw new Error('Nenhuma tabela válida encontrada no banco de dados SQLite.');
            }

            // Expected columns (em português conforme sua imagem)
            const expectedCols = [
                'id','titulo','descricao','preco_original','preco_promocional','desconto_percentual',
                'link_afiliado','imagens_base64','categoria_principal','nichos','plataforma','avaliacao',
                'vendas','data_inicio_promocao','data_fim_promocao','data_publicacao','status'
            ];

            // Inspeciona colunas existentes na tabela encontrada
            let existingCols = [];
            try {
                const pragma = db.exec(`PRAGMA table_info('${foundTable}')`);
                if (pragma && pragma.length > 0) {
                    // pragma[0].values: cada entrada [cid, name, type, notnull, dflt_value, pk]
                    existingCols = pragma[0].values.map(r => r[1]);
                }
            } catch (pErr) {
                console.warn('PRAGMA table_info falhou. Tentando prosseguir.', pErr);
            }

            const colsToSelect = expectedCols.filter(c => existingCols.length === 0 ? true : existingCols.includes(c));
            if (colsToSelect.length === 0) {
                throw new Error(`Nenhuma coluna esperada encontrada em ${foundTable}. Verifique o esquema do banco de dados.`);
            }

            const query = `SELECT ${colsToSelect.join(', ')} FROM "${foundTable}"`;
            const result = db.exec(query);

            if (!result || result.length === 0) {
                throw new Error('Consulta SQLite retornou vazia. Verifique o conteúdo do banco de dados.');
            }

            const cols = result[0].columns;
            const values = result[0].values;

            console.info(`Colunas carregadas do SQLite (${foundTable}):`, cols);
            const missing = expectedCols.filter(c => !cols.includes(c));
            if (missing.length) console.info('Colunas ausentes (não obrigatórias):', missing);

            // Map rows to product objects and normalize fields
            this.products = values.map(row => {
                const obj = {};
                cols.forEach((c, i) => obj[c] = row[i]);

                // Normalizações (mesma forma esperada pela aplicação)
                obj.id = ('id' in obj) ? String(obj.id) : '';
                if (!obj.id && typeof Logger !== 'undefined') Logger.debug('Campo ausente ao normalizar produto', { field: 'id', row: row });
                
                obj.titulo = obj.titulo || '';
                if (!obj.titulo && typeof Logger !== 'undefined') Logger.debug('Campo ausente ao normalizar produto', { id: obj.id, field: 'titulo' });

                obj.descricao = obj.descricao || '';
                if (!obj.descricao && typeof Logger !== 'undefined') Logger.debug('Campo ausente ao normalizar produto', { id: obj.id, field: 'descricao' });

                obj.link_afiliado = obj.link_afiliado || '';
                if (!obj.link_afiliado && typeof Logger !== 'undefined') Logger.debug('Campo ausente ao normalizar produto', { id: obj.id, field: 'link_afiliado' });

                obj.categoria_principal = obj.categoria_principal || 'Outros';
                obj.plataforma = obj.plataforma || '';
                if (!obj.plataforma && typeof Logger !== 'undefined') Logger.debug('Campo ausente ao normalizar produto', { id: obj.id, field: 'plataforma' });

                obj.status = obj.status || '';

                obj.preco_original = ('preco_original' in obj && obj.preco_original !== null) ? Number(obj.preco_original) : 0;
                obj.preco_promocional = ('preco_promocional' in obj && obj.preco_promocional !== null) ? Number(obj.preco_promocional) : 0;
                if (!obj.preco_promocional && typeof Logger !== 'undefined') Logger.debug('Campo ausente ou zero ao normalizar produto', { id: obj.id, field: 'preco_promocional' });

                obj.desconto_percentual = ('desconto_percentual' in obj && obj.desconto_percentual !== null) ? Number(obj.desconto_percentual) : 0;
                obj.avaliacao = ('avaliacao' in obj && obj.avaliacao !== null) ? Number(obj.avaliacao) : 0;
                obj.vendas = ('vendas' in obj && obj.vendas !== null) ? Number(obj.vendas) : 0;

                // Imagens -> aceitar JSON array, pipe/comma-separated, URL, data URI ou base64 puro
                let imagesArr = [];
                if ('imagens_base64' in obj && obj.imagens_base64) {
                    try {
                        if (typeof obj.imagens_base64 === 'string') {
                            const trimmed = obj.imagens_base64.trim();
                            // tenta JSON
                            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || trimmed.startsWith('{"')) {
                                const parsed = JSON.parse(trimmed);
                                imagesArr = Array.isArray(parsed) ? parsed : [];
                            } else {
                                // fallback em separadores
                                imagesArr = trimmed.includes('|') ? trimmed.split('|') : (trimmed.includes(',') ? trimmed.split(',') : [trimmed]);
                            }
                        } else if (Array.isArray(obj.imagens_base64)) {
                            imagesArr = obj.imagens_base64;
                        } else {
                            imagesArr = [String(obj.imagens_base64)];
                        }
                    } catch (e) {
                        const s = String(obj.imagens_base64);
                        imagesArr = s.includes('|') ? s.split('|') : (s.includes(',') ? s.split(',') : [s]);
                    }
                }
                obj.imagens_base64 = imagesArr.map(s => String(s).trim()).filter(Boolean);
                if (obj.imagens_base64.length === 0 && typeof Logger !== 'undefined') Logger.debug('Produto sem imagens', { id: obj.id });

                // manter compatibilidade com 'imagens'
                obj.imagens = obj.imagens_base64.slice();

                // Nichos -> array
                if ('nichos' in obj && obj.nichos) {
                    if (Array.isArray(obj.nichos)) {
                        obj.nichos = obj.nichos.map(n => String(n).trim()).filter(Boolean);
                    } else {
                        obj.nichos = String(obj.nichos).split(',').map(n => n.trim()).filter(Boolean);
                    }
                } else {
                    obj.nichos = [];
                    if (typeof Logger !== 'undefined') Logger.debug('Produto sem nichos', { id: obj.id });
                }

                // Datas
                ['data_inicio_promocao', 'data_fim_promocao', 'data_publicacao'].forEach(k => {
                    if (k in obj) {
                        obj[k] = obj[k] ? new Date(obj[k]) : null;
                    } else {
                        obj[k] = null;
                    }
                });

                return obj;
            });

            this.filtersManager.setProducts(this.products);

            // Atualiza hora da última atualização
            this.lastUpdateTime = new Date();
            this.updateLastUpdateDisplay();

            console.log(`Loaded ${this.products.length} products from SQLite (file: ${usedPath}, table: ${foundTable})`);
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Erro ao carregar produtos do banco de dados SQLite. Verifique se o arquivo e a tabela "produtos" estão presentes e acessíveis.');
            // Mantém produtos vazios para evitar comportamento inesperado
            this.products = [];
            this.filtersManager.setProducts(this.products);
            this.lastUpdateTime = null;
            this.updateLastUpdateDisplay();
        }
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
        
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                Utils.scrollToElement(targetId, 80);
            });
        });
        
        // Product card click handlers (for modal)
        document.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (productCard && !e.target.closest('a')) {
                const productId = productCard.dataset.productId;
                const product = this.products.find(p => p.id === productId);
                if (product) {
                    ProductRenderer.showProductModal(product);
                }
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape key to close modals
            if (e.key === 'Escape') {
                const modal = document.querySelector('.fixed.inset-0');
                if (modal) {
                    modal.remove();
                }
            }
            
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
        
        // Window resize handler
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
        
        // Scroll handler for animations
        window.addEventListener('scroll', Utils.debounce(() => {
            this.handleScroll();
        }, 100));
        
        // Visibility change handler (for analytics)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.trackPageView();
            }
        });
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth >= 768) {
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
            }
        }
        
        // Update device type tracking
        const deviceType = Utils.getDeviceType();
        if (typeof gtag !== 'undefined') {
            gtag('event', 'device_type', {
                event_category: 'user_interaction',
                event_label: deviceType
            });
        }
    }
    
    /**
     * Handle scroll events
     */
    handleScroll() {
        // Add/remove header shadow based on scroll position
        const header = document.querySelector('header');
        if (header) {
            if (window.scrollY > 10) {
                header.classList.add('shadow-lg');
            } else {
                header.classList.remove('shadow-lg');
            }
        }
        
        // Animate elements on scroll (if not reduced motion)
        if (!Utils.prefersReducedMotion()) {
            this.animateOnScroll();
        }
    }
    
    /**
     * Animate elements when they come into view
     */
    animateOnScroll() {
        const elements = document.querySelectorAll('.product-card:not(.animated)');
        elements.forEach(element => {
            if (Utils.isInViewport(element)) {
                element.classList.add('animated');
                element.style.animation = 'fadeIn 0.5s ease-out';
            }
        });
    }
    
    /**
     * Initialize lazy loading for images
     */
    initializeLazyLoading() {
        Utils.lazyLoadImages('img[data-src]');
    }
    
    /**
     * Initialize analytics tracking
     */
    initializeAnalytics() {
        // Track initial page view
        this.trackPageView();
        
        // Track user engagement
        this.trackUserEngagement();
    }
    
    /**
     * Track page view
     */
    trackPageView() {
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                page_title: document.title,
                page_location: window.location.href
            });
        }
        
        console.log('Page view tracked:', window.location.href);
    }
    
    /**
     * Track user engagement metrics
     */
    trackUserEngagement() {
        let startTime = Date.now();
        let maxScroll = 0;
        
        // Track scroll depth
        window.addEventListener('scroll', Utils.debounce(() => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                // Track milestone scroll depths
                if ([25, 50, 75, 90].includes(scrollPercent)) {
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'scroll_depth', {
                            event_category: 'engagement',
                            event_label: `${scrollPercent}%`,
                            value: scrollPercent
                        });
                    }
                }
            }
        }, 500));
        
        // Track time on page when leaving
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'time_on_page', {
                    event_category: 'engagement',
                    value: timeOnPage
                });
            }
        });
    }
    
    /**
     * Show/hide loading overlay
     * @param {boolean} show - Whether to show the overlay
     */
    showLoadingOverlay(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }
    
    /**
     * Show error message to user
     * @param {string} message - Error message
     */
    showError(message) {
        Utils.showNotification(message, 'error', 5000);
        this.showLoadingOverlay(false);
    }
    
    /**
     * Update last update time display
     */
    updateLastUpdateDisplay() {
        const elements = ['last-update', 'footer-last-update'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element && this.lastUpdateTime) {
                element.textContent = Utils.formatDate(this.lastUpdateTime);
            }
        });
    }
    
    /**
     * Refresh products data
     */
    async refreshProducts() {
        try {
            this.showLoadingOverlay(true);
            await this.loadProducts();
            this.showLoadingOverlay(false);
            Utils.showNotification('Produtos atualizados com sucesso!', 'success');
        } catch (error) {
            console.error('Error refreshing products:', error);
            this.showError('Erro ao atualizar produtos. Tente novamente.');
        }
    }
    
    /**
     * Search products by query
     * @param {string} query - Search query
     */
    searchProducts(query) {
        this.filtersManager.updateFilter('search', query);
    }
    
    /**
     * Filter products by platform
     * @param {string} platform - Platform name
     */
    filterByPlatform(platform) {
        this.filtersManager.updateFilter('platform', platform);
    }
    
    /**
     * Filter products by category
     * @param {string} category - Category name
     */
    filterByCategory(category) {
        this.filtersManager.updateFilter('category', category);
    }
    
    /**
     * Sort products
     * @param {string} sortBy - Sort criteria
     */
    sortProducts(sortBy) {
        this.filtersManager.updateFilter('sort', sortBy);
    }
    
    /**
     * Clear all filters
     */
    clearAllFilters() {
        this.filtersManager.clearFilters();
    }
    
    /**
     * Get app statistics
     * @returns {Object} App statistics
     */
    getStatistics() {
        const filterSummary = this.filtersManager.getFilterSummary();
        
        return {
            totalProducts: this.products.length,
            filteredProducts: filterSummary.filteredProducts,
            platforms: [...new Set(this.products.map(p => p.plataforma))],
            categories: [...new Set(this.products.map(p => p.categoria_principal))],
            averageDiscount: Math.round(
                this.products.reduce((sum, p) => sum + p.desconto_percentual, 0) / this.products.length
            ),
            lastUpdate: this.lastUpdateTime,
            deviceType: Utils.getDeviceType(),
            filterSummary
        };
    }
    
    /**
     * Export current data
     * @param {string} format - Export format
     */
    exportData(format = 'json') {
        const data = this.filtersManager.exportFilteredProducts(format);
        const blob = new Blob([data], { 
            type: format === 'csv' ? 'text/csv' : 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `promocoes_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification(`Dados exportados em formato ${format.toUpperCase()}`, 'success');
    }
}

/*
  Helper: garante que initSqlJs esteja disponível e inicializa-o,
  apontando locateFile para o .wasm no CDN (evita erro "initSqlJs não encontrado").
*/
async function ensureInitSqlJs() {
	// Versão do sql.js a usar no CDN
	const SQLJS_VERSION = '1.6.2';
	const wasmUrl = `https://cdnjs.cloudflare.com/ajax/libs/sql.js/${SQLJS_VERSION}/sql-wasm.wasm`;
	const scriptUrl = `https://cdnjs.cloudflare.com/ajax/libs/sql.js/${SQLJS_VERSION}/sql-wasm.js`;

	// Se já estiver presente, retorna a instância
	if (typeof initSqlJs === 'function') {
		return initSqlJs({ locateFile: () => wasmUrl });
	}

	// Carrega o script dinamicamente e aguarda
	await new Promise((resolve, reject) => {
		const s = document.createElement('script');
		s.src = scriptUrl;
		s.async = true;
		s.onload = () => resolve();
		s.onerror = (e) => reject(new Error('Falha ao carregar sql-wasm.js do CDN: ' + e));
		document.head.appendChild(s);
	});

	// Depois de carregado, inicializa apontando para o .wasm no CDN
	if (typeof initSqlJs !== 'function') {
		throw new Error('initSqlJs não está disponível após o carregamento do script sql-wasm.js.');
	}
	return initSqlJs({ locateFile: () => wasmUrl });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa Logger primeiro
    if (typeof Logger !== 'undefined') {
        Logger.init({ maxEntries: 2000, cleanOldLogsDays: 30 });
        Logger.info('DOM loaded - iniciando aplicação');
    }
     // Initialize Lucide icons
     if (typeof lucide !== 'undefined') {
         lucide.createIcons();
     }
     
     // Create global app instance
    window.promotionsApp = new PromotionsApp();
});

// Service Worker registration for caching (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (typeof Logger !== 'undefined') {
        Logger.error('Global error', { message: e.message, stack: e.error && e.error.stack ? e.error.stack : null });
    }
     if (window.promotionsApp) {
         window.promotionsApp.showError('Ocorreu um erro inesperado. Recarregue a página se o problema persistir.');
     }
 });

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (typeof Logger !== 'undefined') {
        Logger.error('Unhandled promise rejection', { reason: e.reason });
    }
     e.preventDefault();
     if (window.promotionsApp) {
         window.promotionsApp.showError('Erro de conexão. Verifique sua internet e tente novamente.');
     }
 });

// Export for debugging
window.PromotionsApp = PromotionsApp;
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (typeof Logger !== 'undefined') {
        Logger.error('Global error', { message: e.message, stack: e.error && e.error.stack ? e.error.stack : null });
    }
     if (window.promotionsApp) {
         window.promotionsApp.showError('Ocorreu um erro inesperado. Recarregue a página se o problema persistir.');
     }
 });

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (typeof Logger !== 'undefined') {
        Logger.error('Unhandled promise rejection', { reason: e.reason });
    }
     e.preventDefault();
     if (window.promotionsApp) {
         window.promotionsApp.showError('Erro de conexão. Verifique sua internet e tente novamente.');
     }
 });

// Export for debugging
window.PromotionsApp = PromotionsApp;

