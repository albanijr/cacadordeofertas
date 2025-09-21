// Product Renderer for displaying products on the page

class ProductRenderer {
    /**
     * Render a single product card
     * @param {Object} product - Product data
     * @returns {string} HTML string for product card
     */
    static renderProduct(product) {
        if (typeof Logger !== 'undefined') Logger.debug('Renderizando produto', { id: product.id, titulo: product.titulo });

        const platformColorClass = Utils.getPlatformColorClass(product.plataforma);

        // Escolhe primeira imagem válida entre imagens_base64 / imagens
        const candidates = (product.imagens_base64 && product.imagens_base64.length) ? product.imagens_base64
                        : (product.imagens && product.imagens.length) ? product.imagens
                        : [];

        let imageSrc = Utils.getPlaceholderImage(300, 200);
        for (const c of candidates) {
            const src = this.normalizeImageSrc(c);
            if (src) {
                imageSrc = src;
                break;
            }
        }

        const savings = (product.preco_original || 0) - (product.preco_promocional || 0);

        // Generate rating stars
        const ratingStars = this.generateRatingStars(product.avaliacao || 0);

        // Format niche badges
        const nicheBadges = (product.nichos || []).slice(0, 2).map(nicho => 
            `<span class="niche-badge">${Utils.sanitizeHtml(nicho)}</span>`
        ).join('');

        return `
            <div class="product-card bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden" data-product-id="${product.id}">
                <!-- Image Container -->
                <div class="relative">
                    <img 
                        src="${imageSrc}" 
                        alt="${Utils.sanitizeHtml(product.titulo || 'Produto')}"
                        class="product-image w-full h-48 object-cover"
                        loading="lazy"
                        onerror="this.src='${Utils.getPlaceholderImage(300, 200)}'"
                    >
                    
                    <!-- Discount Badge -->
                    ${product.desconto_percentual && Number(product.desconto_percentual) > 0 ? `
                        <div class="discount-badge absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                            -${product.desconto_percentual}%
                        </div>
                    ` : (typeof Logger !== 'undefined' ? (Logger.debug('Badge de desconto omitida por valor ausente/zero', { id: product.id, desconto: product.desconto_percentual }) , '') : '')}
                    
                    <!-- Platform Badge -->
                    ${product.plataforma && String(product.plataforma).trim() ? `
                        <div class="platform-badge absolute top-2 right-2 ${platformColorClass} text-white px-2 py-1 rounded text-xs font-medium">
                            ${Utils.sanitizeHtml(product.plataforma)}
                        </div>
                    ` : (typeof Logger !== 'undefined' ? (Logger.debug('Badge de plataforma omitida por valor ausente', { id: product.id }), '') : '')}
                    
                    <!-- Niche Badges -->
                    ${nicheBadges ? `
                        <div class="niche-badges absolute bottom-2 left-2 flex flex-wrap gap-1">
                            ${nicheBadges}
                        </div>
                    ` : ''}
                </div>
                
                <!-- Content -->
                <div class="product-content p-4">
                    <!-- Title -->
                    ${product.titulo ? `<h3 class="product-title font-semibold text-gray-800 mb-2 line-clamp-2 h-12">${Utils.sanitizeHtml(product.titulo)}</h3>`
                     : (typeof Logger !== 'undefined' ? (Logger.debug('Título omitido na renderização por valor ausente', { id: product.id }), '') : '')}
                    
                    <!-- Description -->
                    ${product.descricao ? `<p class="product-description text-gray-600 text-sm mb-3 line-clamp-2 h-10">${Utils.sanitizeHtml(product.descricao)}</p>`
                     : (typeof Logger !== 'undefined' ? (Logger.debug('Descrição omitida na renderização por valor ausente', { id: product.id }), '') : '')}
                    
                    <!-- Prices -->
                    ${product.preco_promocional && Number(product.preco_promocional) > 0 ? `
                        <div class="price-container mb-3">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="price-current text-2xl font-bold text-green-600">
                                    ${Utils.formatCurrency(product.preco_promocional)}
                                </span>
                                ${product.preco_original && product.preco_original > product.preco_promocional ? `
                                    <span class="price-original text-sm text-gray-500 line-through">
                                        ${Utils.formatCurrency(product.preco_original)}
                                    </span>
                                ` : ''}
                            </div>
                            ${savings > 0 ? `
                                <div class="price-savings text-sm text-green-600 font-medium">
                                    Economia de ${Utils.formatCurrency(savings)}
                                </div>
                            ` : ''}
                        </div>
                    ` : (typeof Logger !== 'undefined' ? (Logger.debug('Bloco de preço omitido por preco_promocional ausente/zero', { id: product.id, preco_promocional: product.preco_promocional }), '') : '')}
                    
                    <!-- Rating and Sales -->
                    ${product.avaliacao > 0 || product.vendas > 0 ? `
                        <div class="rating-container flex items-center justify-between text-sm text-gray-500 mb-3">
                            ${product.avaliacao > 0 ? `
                                <div class="flex items-center">
                                    ${ratingStars}
                                    <span class="ml-1">${(product.avaliacao || 0).toFixed(1)}</span>
                                </div>
                            ` : '<div></div>'}
                            ${product.vendas > 0 ? `
                                <div>${Utils.formatNumber(product.vendas)} vendidos</div>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <!-- Action Button -->
                    <a 
                        href="${product.link_afiliado}" 
                        ${product.link_afiliado ? `target="_blank" rel="noopener noreferrer"` : ''}
                        class="btn-primary block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium ${!product.link_afiliado ? 'opacity-60 pointer-events-none' : ''}"
                        onclick="${product.id && product.plataforma ? `Utils.trackClick('${product.id}', '${product.plataforma}')` : ''}"
                    >
                        ${product.link_afiliado ? 'Ver Oferta' : 'Link indisponível'}
                        <i data-lucide="external-link" class="w-4 h-4 inline ml-1"></i>
                    </a>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate rating stars HTML
     * @param {number} rating - Rating value (0-5)
     * @returns {string} HTML string for rating stars
     */
    static generateRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHtml = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i data-lucide="star" class="w-4 h-4 text-yellow-400 fill-current"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            starsHtml += '<i data-lucide="star-half" class="w-4 h-4 text-yellow-400 fill-current"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i data-lucide="star" class="w-4 h-4 text-gray-300"></i>';
        }
        
        return starsHtml;
    }
    
    /**
     * Render products in a grid container
     * @param {Array} products - Array of products
     * @param {string} containerId - ID of container element
     */
    static renderProductGrid(products, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container with ID '${containerId}' not found`);
            return;
        }
        
        if (products.length === 0) {
            container.innerHTML = this.renderEmptyState();
            if (typeof Logger !== 'undefined') Logger.info('Render grid vazio', { containerId });
            return;
        }
        
        if (typeof Logger !== 'undefined') Logger.info('Renderizando grid', { containerId, count: products.length });
        container.innerHTML = products.map(product => this.renderProduct(product)).join('');
        
        // Re-initialize Lucide icons for new content
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    /**
     * Render products with pagination
     * @param {Array} products - Array of products
     * @param {string} containerId - ID of container element
     * @param {number} page - Page number (1-based)
     * @param {number} itemsPerPage - Items per page
     * @returns {boolean} True if there are more products to load
     */
    static renderProductsWithPagination(products, containerId, page = 1, itemsPerPage = 12) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container with ID '${containerId}' not found`);
            return false;
        }
        
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedProducts = products.slice(startIndex, endIndex);
        
        if (paginatedProducts.length === 0) {
            if (page === 1) {
                container.innerHTML = this.renderEmptyState();
            }
            return false;
        }
        
        if (page === 1) {
            // First page - replace content
            container.innerHTML = paginatedProducts.map(product => this.renderProduct(product)).join('');
        } else {
            // Subsequent pages - append content
            const newProductsHTML = paginatedProducts.map(product => this.renderProduct(product)).join('');
            container.insertAdjacentHTML('beforeend', newProductsHTML);
        }
        
        // Re-initialize Lucide icons for new content
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        return endIndex < products.length; // Return true if there are more products
    }
    
    /**
     * Render empty state when no products are found
     * @returns {string} HTML string for empty state
     */
    static renderEmptyState() {
        return `
            <div class="empty-state col-span-full text-center py-12">
                <div class="empty-state-icon mx-auto mb-4">
                    <i data-lucide="search-x" class="w-16 h-16 text-gray-300"></i>
                </div>
                <h3 class="empty-state-title text-xl font-semibold text-gray-600 mb-2">
                    Nenhum produto encontrado
                </h3>
                <p class="empty-state-description text-gray-500">
                    Tente ajustar os filtros ou buscar por outros termos.
                </p>
            </div>
        `;
    }
    
    /**
     * Render loading skeleton cards
     * @param {number} count - Number of skeleton cards to render
     * @returns {string} HTML string for loading skeletons
     */
    static renderLoadingSkeletons(count = 8) {
        const skeletons = [];
        for (let i = 0; i < count; i++) {
            skeletons.push(`
                <div class="loading-card bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="loading-image skeleton"></div>
                    <div class="loading-content">
                        <div class="loading-title skeleton mb-2"></div>
                        <div class="loading-description skeleton mb-3"></div>
                        <div class="loading-price skeleton"></div>
                    </div>
                </div>
            `);
        }
        return skeletons.join('');
    }
    
    /**
     * Show loading state in container
     * @param {string} containerId - ID of container element
     * @param {number} count - Number of skeleton cards
     */
    static showLoadingState(containerId, count = 8) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = this.renderLoadingSkeletons(count);
        }
    }
    
    /**
     * Render product modal/popup
     * @param {Object} product - Product data
     * @returns {string} HTML string for product modal
     */
    static renderProductModal(product) {
        // normaliza todas as imagens para srcs utilizáveis
        const rawImages = (product.imagens_base64 && product.imagens_base64.length) ? product.imagens_base64
                        : (product.imagens && product.imagens.length) ? product.imagens
                        : [];

        const imagesToShow = rawImages.map(img => this.normalizeImageSrc(img)).filter(Boolean);
        const finalImages = imagesToShow.length ? imagesToShow : [Utils.getPlaceholderImage(400, 300)];

        const imageGallery = finalImages.map((img, index) => `
            <img 
                src="${img}" 
                alt="${Utils.sanitizeHtml(product.titulo)} - Imagem ${index + 1}"
                class="w-full h-64 object-cover rounded-lg cursor-pointer"
                onclick="this.requestFullscreen()"
                onerror="this.src='${Utils.getPlaceholderImage(400,300)}'"
            >
        `).join('');

        return `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="this.remove()">
                <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                    <div class="p-6">
                        <!-- Header -->
                        <div class="flex justify-between items-start mb-4">
                            <h2 class="text-2xl font-bold text-gray-800 pr-4">
                                ${Utils.sanitizeHtml(product.titulo)}
                            </h2>
                            <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                                <i data-lucide="x" class="w-6 h-6"></i>
                            </button>
                        </div>
                        
                        <!-- Content Grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Images -->
                            <div class="space-y-4">
                                ${imageGallery}
                            </div>
                            
                            <!-- Product Info -->
                            <div>
                                <!-- Platform Badge -->
                                <div class="mb-4">
                                    <span class="platform-badge ${Utils.getPlatformColorClass(product.plataforma)} text-white px-3 py-1 rounded-full text-sm font-medium">
                                        ${Utils.sanitizeHtml(product.plataforma)}
                                    </span>
                                </div>
                                
                                <!-- Description -->
                                <p class="text-gray-600 mb-4">
                                    ${Utils.sanitizeHtml(product.descricao)}
                                </p>
                                
                                <!-- Prices -->
                                <div class="mb-4">
                                    <div class="flex items-center gap-3 mb-2">
                                        <span class="text-3xl font-bold text-green-600">
                                            ${Utils.formatCurrency(product.preco_promocional)}
                                        </span>
                                        ${product.preco_original > product.preco_promocional ? `
                                            <span class="text-lg text-gray-500 line-through">
                                                ${Utils.formatCurrency(product.preco_original)}
                                            </span>
                                            <span class="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                                                -${product.desconto_percentual}%
                                            </span>
                                        ` : ''}
                                    </div>
                                    ${product.preco_original > product.preco_promocional ? `
                                        <div class="text-green-600 font-medium">
                                            Economia de ${Utils.formatCurrency(product.preco_original - product.preco_promocional)}
                                        </div>
                                    ` : ''}
                                </div>
                                
                                <!-- Rating and Sales -->
                                ${product.avaliacao > 0 || product.vendas > 0 ? `
                                    <div class="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                                        ${product.avaliacao > 0 ? `
                                            <div class="flex items-center">
                                                ${this.generateRatingStars(product.avaliacao)}
                                                <span class="ml-2 font-medium">${(product.avaliacao || 0).toFixed(1)}</span>
                                            </div>
                                        ` : '<div></div>'}
                                        ${product.vendas > 0 ? `
                                            <div class="text-gray-600">
                                                <i data-lucide="shopping-cart" class="w-4 h-4 inline mr-1"></i>
                                                ${Utils.formatNumber(product.vendas)} vendidos
                                            </div>
                                        ` : ''}
                                    </div>
                                ` : ''}
                                
                                <!-- Category and Niches -->
                                <div class="mb-4">
                                    <div class="flex flex-wrap gap-2">
                                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                            ${Utils.sanitizeHtml(product.categoria_principal)}
                                        </span>
                                        ${product.nichos.map(nicho => `
                                            <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
                                                ${Utils.sanitizeHtml(nicho)}
                                            </span>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <!-- Action Buttons -->
                                <div class="space-y-3">
                                    <a 
                                        href="${product.link_afiliado}" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        class="btn-primary block w-full text-center py-4 text-lg"
                                        onclick="Utils.trackClick('${product.id}', '${product.plataforma}', 'modal_click')"
                                    >
                                        Ver Oferta na ${Utils.sanitizeHtml(product.plataforma)}
                                        <i data-lucide="external-link" class="w-5 h-5 inline ml-2"></i>
                                    </a>
                                    
                                    <button 
                                        onclick="Utils.copyToClipboard('${product.link_afiliado}').then(success => success ? Utils.showNotification('Link copiado!', 'success') : Utils.showNotification('Erro ao copiar link', 'error'))"
                                        class="btn-secondary block w-full text-center py-3"
                                    >
                                        <i data-lucide="copy" class="w-4 h-4 inline mr-2"></i>
                                        Copiar Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Show product modal
     * @param {Object} product - Product data
     */
    static showProductModal(product) {
        if (typeof Logger !== 'undefined') Logger.debug('Abrindo modal produto', { id: product.id, titulo: product.titulo });
        const modal = document.createElement('div');
        modal.innerHTML = this.renderProductModal(product);
        document.body.appendChild(modal.firstElementChild);
        
        // Initialize Lucide icons for modal content
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    // Helper: normaliza string de imagem para um src utilizável
    static normalizeImageSrc(imgStr) {
        if (!imgStr) return null;
        const s = String(imgStr).trim();

        // Já é data URI
        if (s.startsWith('data:')) return s;

        // URL absoluta (http/https)
        if (/^https?:\/\//i.test(s)) return s;

        // Se parece com "mime-type;base64,..." (ex: image/png;base64,...)
        if (/^[a-z0-9\/\-\+]+;base64,/i.test(s)) {
            return `data:${s}`;
        }

        // Se for base64 "puro" (muito longo sem espaços), assumir PNG
        if (/^[A-Za-z0-9+/=\s]{100,}$/.test(s)) {
            return `data:image/png;base64,${s.replace(/\s+/g, '')}`;
        }

        // fallback: se contém ',' e sem https, pode ser lista — deixar para ser tratado externamente
        return s;
    }
}

// Export for use in other modules
window.ProductRenderer = ProductRenderer;

