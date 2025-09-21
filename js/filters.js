// Filters Manager for product filtering and sorting

class FiltersManager {
    constructor() {
        this.allProducts = [];
        this.filteredProducts = [];
        this.currentFilters = {
            search: '',
            platform: '',
            category: '',
            sort: 'discount'
        };
        this.currentPage = 1;
        this.itemsPerPage = 12;
        
        this.initializeEventListeners();
    }
    
    /**
     * Initialize event listeners for filter controls
     */
    initializeEventListeners() {
        // Search input with debouncing
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.updateFilter('search', e.target.value);
            }, 300));
        }
        
        // Platform filter
        const platformFilter = document.getElementById('platform-filter');
        if (platformFilter) {
            platformFilter.addEventListener('change', (e) => {
                this.updateFilter('platform', e.target.value);
            });
        }
        
        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.updateFilter('category', e.target.value);
            });
        }
        
        // Sort filter
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.updateFilter('sort', e.target.value);
            });
        }
        
        // Load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreProducts();
            });
        }
    }
    
    /**
     * Set all products data
     * @param {Array} products - Array of all products
     */
    setProducts(products) {
        this.allProducts = products;
        this.applyFilters();
        this.products = products || [];
		if (typeof Logger !== 'undefined') Logger.info('FiltersManager.setProducts', { count: this.products.length });
    }
    
    /**
     * Update a specific filter
     * @param {string} filterType - Type of filter to update
     * @param {string} value - New filter value
     */
    updateFilter(filterType, value) {
        this.currentFilters[filterType] = value;
        this.currentPage = 1; // Reset to first page
        this.applyFilters();
        
        // Update URL parameters
        if (value) {
            Utils.setQueryParam(filterType, value);
        } else {
            Utils.removeQueryParam(filterType);
        }
		this.filters[filterType] = value;
		if (typeof Logger !== 'undefined') Logger.info('Filter atualizado', { key: filterType, value });
    }
    
    /**
     * Apply all current filters
     */
    applyFilters() {
        let filtered = [...this.allProducts];
        
        // Apply search filter
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.titulo.toLowerCase().includes(searchTerm) ||
                product.descricao.toLowerCase().includes(searchTerm) ||
                product.categoria_principal.toLowerCase().includes(searchTerm) ||
                product.plataforma.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply platform filter
        if (this.currentFilters.platform) {
            filtered = filtered.filter(product => 
                product.plataforma === this.currentFilters.platform
            );
        }
        
        // Apply category filter
        if (this.currentFilters.category) {
            filtered = filtered.filter(product => 
                product.categoria_principal === this.currentFilters.category
            );
        }
        
        // Apply sorting
        filtered = this.sortProducts(filtered, this.currentFilters.sort);
        
        this.filteredProducts = filtered;
        this.renderFilteredProducts();
        this.updateFilterStats();
    }
    
    /**
     * Sort products by specified criteria
     * @param {Array} products - Products to sort
     * @param {string} sortBy - Sort criteria
     * @returns {Array} Sorted products
     */
    sortProducts(products, sortBy) {
        const sorted = [...products];
        
        switch (sortBy) {
            case 'discount':
                return sorted.sort((a, b) => b.desconto_percentual - a.desconto_percentual);
            
            case 'price-low':
                return sorted.sort((a, b) => a.preco_promocional - b.preco_promocional);
            
            case 'price-high':
                return sorted.sort((a, b) => b.preco_promocional - a.preco_promocional);
            
            case 'newest':
                return sorted.sort((a, b) => {
                    const dateA = a.data_publicacao ? new Date(a.data_publicacao) : new Date(0);
                    const dateB = b.data_publicacao ? new Date(b.data_publicacao) : new Date(0);
                    return dateB - dateA;
                });
            
            case 'rating':
                return sorted.sort((a, b) => b.avaliacao - a.avaliacao);
            
            case 'sales':
                return sorted.sort((a, b) => b.vendas - a.vendas);
            
            default:
                return sorted;
        }
    }
    
    /**
     * Get products by niche
     * @param {string} niche - Niche name
     * @returns {Array} Products in the specified niche
     */
    getProductsByNiche(niche) {
        return this.allProducts.filter(product => 
            product.nichos.includes(niche)
        );
    }
    
    /**
     * Render filtered products in all sections
     */
    renderFilteredProducts() {
        // Render niche-specific sections
        this.renderNicheSection('ofertas relampago', 'ofertas-relampago-grid', 8);
        this.renderNicheSection('novidades', 'novidades-grid', 8);
        this.renderNicheSection('mais vendidos', 'mais-vendidos-grid', 8);
        
        // Render all products section with pagination
        this.renderAllProductsSection();
    }
    
    /**
     * Render products for a specific niche section
     * @param {string} niche - Niche name
     * @param {string} containerId - Container element ID
     * @param {number} limit - Maximum number of products to show
     */
    renderNicheSection(niche, containerId, limit = 8) {
        const nicheProducts = this.getProductsByNiche(niche);
        const limitedProducts = nicheProducts.slice(0, limit);
        ProductRenderer.renderProductGrid(limitedProducts, containerId);
    }
    
    /**
     * Render all products section with pagination
     */
    renderAllProductsSection() {
        const hasMore = ProductRenderer.renderProductsWithPagination(
            this.filteredProducts,
            'produtos-grid',
            this.currentPage,
            this.itemsPerPage
        );
        
        // Update load more button visibility
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = hasMore ? 'block' : 'none';
        }
    }
    
    /**
     * Load more products (pagination)
     */
    loadMoreProducts() {
        this.currentPage++;
        const hasMore = ProductRenderer.renderProductsWithPagination(
            this.filteredProducts,
            'produtos-grid',
            this.currentPage,
            this.itemsPerPage
        );
        
        // Update load more button visibility
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = hasMore ? 'block' : 'none';
        }
        
        // Show notification
        Utils.showNotification(`Carregados mais ${Math.min(this.itemsPerPage, this.filteredProducts.length - (this.currentPage - 1) * this.itemsPerPage)} produtos`, 'info', 2000);
    }
    
    /**
     * Update filter statistics display
     */
    updateFilterStats() {
        // Update results count
        const resultsCount = document.getElementById('results-count');
        if (resultsCount) {
            resultsCount.textContent = `${this.filteredProducts.length} produtos encontrados`;
        }
        
        // Update section visibility based on filters
        this.updateSectionVisibility();
    }
    
    /**
     * Update section visibility based on active filters
     */
    updateSectionVisibility() {
        const hasActiveFilters = Object.values(this.currentFilters).some(value => value && value !== 'discount');
        
        // Hide niche sections if filters are active
        const nicheSections = ['ofertas-relampago', 'novidades', 'mais-vendidos'];
        nicheSections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = hasActiveFilters ? 'none' : 'block';
            }
        });
        
        // Show/hide all products section
        const allProductsSection = document.getElementById('todos-produtos');
        if (allProductsSection) {
            allProductsSection.style.display = 'block';
        }
    }
    
    /**
     * Clear all filters
     */
    clearFilters() {
        this.currentFilters = {
            search: '',
            platform: '',
            category: '',
            sort: 'discount'
        };
        this.currentPage = 1;
        
        // Reset form controls
        const searchInput = document.getElementById('search-input');
        const platformFilter = document.getElementById('platform-filter');
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');
        
        if (searchInput) searchInput.value = '';
        if (platformFilter) platformFilter.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (sortFilter) sortFilter.value = 'discount';
        
        // Clear URL parameters
        ['search', 'platform', 'category', 'sort'].forEach(param => {
            Utils.removeQueryParam(param);
        });
        
        this.applyFilters();
        Utils.showNotification('Filtros limpos', 'info', 2000);
		this.filters = {};
		if (typeof Logger !== 'undefined') Logger.info('Todos os filtros limpos');
    }
    
    /**
     * Load filters from URL parameters
     */
    loadFiltersFromURL() {
        const urlFilters = {
            search: Utils.getQueryParam('search') || '',
            platform: Utils.getQueryParam('platform') || '',
            category: Utils.getQueryParam('category') || '',
            sort: Utils.getQueryParam('sort') || 'discount'
        };
        
        // Update form controls
        const searchInput = document.getElementById('search-input');
        const platformFilter = document.getElementById('platform-filter');
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');
        
        if (searchInput && urlFilters.search) searchInput.value = urlFilters.search;
        if (platformFilter && urlFilters.platform) platformFilter.value = urlFilters.platform;
        if (categoryFilter && urlFilters.category) categoryFilter.value = urlFilters.category;
        if (sortFilter && urlFilters.sort) sortFilter.value = urlFilters.sort;
        
        // Apply filters
        this.currentFilters = urlFilters;
        this.applyFilters();
		if (typeof Logger !== 'undefined') Logger.info('FiltersManager.loadFiltersFromURL', { url: window.location.href });
    }
    
    /**
     * Export filtered products data
     * @param {string} format - Export format (json, csv)
     * @returns {string} Exported data
     */
    exportFilteredProducts(format = 'json') {
        if (format === 'csv') {
            const headers = ['Título', 'Descrição', 'Preço Original', 'Preço Promocional', 'Desconto', 'Plataforma', 'Categoria', 'Link'];
            const rows = this.filteredProducts.map(product => [
                product.titulo,
                product.descricao,
                product.preco_original,
                product.preco_promocional,
                `${product.desconto_percentual}%`,
                product.plataforma,
                product.categoria_principal,
                product.link_afiliado
            ]);
            
            return [headers, ...rows].map(row => 
                row.map(cell => `"${cell}"`).join(',')
            ).join('\n');
        }
        
        return JSON.stringify(this.filteredProducts, null, 2);
		if (typeof Logger !== 'undefined') Logger.info('Exportando produtos filtrados', { format, count: /*...computed count...*/ 0 });
    }
    
    /**
     * Get filter summary for display
     * @returns {Object} Filter summary
     */
    getFilterSummary() {
        const activeFilters = [];
        
        if (this.currentFilters.search) {
            activeFilters.push(`Busca: "${this.currentFilters.search}"`);
        }
        
        if (this.currentFilters.platform) {
            activeFilters.push(`Plataforma: ${this.currentFilters.platform}`);
        }
        
        if (this.currentFilters.category) {
            activeFilters.push(`Categoria: ${this.currentFilters.category}`);
        }
        
        const sortLabels = {
            'discount': 'Maior Desconto',
            'price-low': 'Menor Preço',
            'price-high': 'Maior Preço',
            'newest': 'Mais Recentes',
            'rating': 'Melhor Avaliação',
            'sales': 'Mais Vendidos'
        };
        
        if (this.currentFilters.sort && this.currentFilters.sort !== 'discount') {
            activeFilters.push(`Ordenação: ${sortLabels[this.currentFilters.sort]}`);
        }
        
        const summary = {
            activeFilters,
            totalProducts: this.allProducts.length,
            filteredProducts: this.filteredProducts.length,
            hasActiveFilters: activeFilters.length > 0
        };
		if (typeof Logger !== 'undefined') Logger.info('FiltersManager.getFilterSummary', { summary });
        return summary;
    }
}

// Export for use in other modules
window.FiltersManager = FiltersManager;

