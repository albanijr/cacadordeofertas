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
     * Load products from CSV
     */
    async loadProducts() {
        try {
            this.products = await CSVParser.loadProducts();
            this.filtersManager.setProducts(this.products);
            
            // Update last update time
            this.lastUpdateTime = new Date();
            this.updateLastUpdateDisplay();
            
            console.log(`Loaded ${this.products.length} products`);
        } catch (error) {
            console.error('Error loading products:', error);
            throw error;
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
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
    if (window.promotionsApp) {
        window.promotionsApp.showError('Ocorreu um erro inesperado. Recarregue a página se o problema persistir.');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault();
    if (window.promotionsApp) {
        window.promotionsApp.showError('Erro de conexão. Verifique sua internet e tente novamente.');
    }
});

// Export for debugging
window.PromotionsApp = PromotionsApp;

