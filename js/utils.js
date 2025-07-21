// Utility functions for the promotions site

/**
 * Debounce function to limit the rate of function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format currency value to Brazilian Real
 * @param {number} value - Numeric value
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
    return new Intl.NumberFormat('pt-BR').format(num);
}

/**
 * Format date to Brazilian format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(dateObj);
}

/**
 * Get platform color class
 * @param {string} platform - Platform name
 * @returns {string} CSS class name
 */
function getPlatformColorClass(platform) {
    const colors = {
        'Shopee': 'platform-shopee',
        'AliExpress': 'platform-aliexpress',
        'Amazon': 'platform-amazon',
        'Magazine Luiza': 'platform-magazine-luiza',
        'TEMU': 'platform-temu'
    };
    return colors[platform] || 'bg-gray-500';
}

/**
 * Get platform background color
 * @param {string} platform - Platform name
 * @returns {string} CSS background color
 */
function getPlatformColor(platform) {
    const colors = {
        'Shopee': '#ee4d2d',
        'AliExpress': '#ff6a00',
        'Amazon': '#ff9900',
        'Magazine Luiza': '#0066cc',
        'TEMU': '#00c851'
    };
    return colors[platform] || '#6b7280';
}

/**
 * Generate unique ID
 * @param {string} input - Input string to generate ID from
 * @returns {string} Generated ID
 */
function generateId(input) {
    return btoa(input).slice(0, 12).toLowerCase();
}

/**
 * Sanitize HTML string
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

/**
 * Check if image URL is valid
 * @param {string} url - Image URL
 * @returns {Promise<boolean>} Promise resolving to true if valid
 */
function isValidImageUrl(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

/**
 * Get placeholder image data URL
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} Data URL for placeholder image
 */
function getPlaceholderImage(width = 300, height = 200) {
    return `data:image/svg+xml;base64,${btoa(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#ddd"/>
            <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#999" text-anchor="middle" dy=".3em">
                Imagem não disponível
            </text>
        </svg>
    `)}`;
}

/**
 * Show notification to user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 3000) {
    const colors = {
        success: 'notification-success',
        error: 'notification-error',
        info: 'notification-info'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification ${colors[type]}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <span>${sanitizeHtml(message)}</span>
            <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Initialize Lucide icons for the new notification
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Auto remove after duration
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

/**
 * Smooth scroll to element
 * @param {string} elementId - ID of element to scroll to
 * @param {number} offset - Offset from top in pixels
 */
function scrollToElement(elementId, offset = 0) {
    const element = document.getElementById(elementId);
    if (element) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if element is in viewport
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Lazy load images
 * @param {string} selector - CSS selector for images to lazy load
 */
function lazyLoadImages(selector = 'img[data-src]') {
    const images = document.querySelectorAll(selector);
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

/**
 * Get query parameter value
 * @param {string} param - Parameter name
 * @returns {string|null} Parameter value or null
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Set query parameter
 * @param {string} param - Parameter name
 * @param {string} value - Parameter value
 */
function setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

/**
 * Remove query parameter
 * @param {string} param - Parameter name
 */
function removeQueryParam(param) {
    const url = new URL(window.location);
    url.searchParams.delete(param);
    window.history.pushState({}, '', url);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Promise resolving to true if successful
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (err) {
            document.body.removeChild(textArea);
            return false;
        }
    }
}

/**
 * Track click event for analytics
 * @param {string} productId - Product ID
 * @param {string} platform - Platform name
 * @param {string} action - Action type
 */
function trackClick(productId, platform, action = 'click') {
    // Google Analytics tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: 'product',
            event_label: platform,
            value: productId
        });
    }
    
    // Console log for debugging
    console.log(`Product ${action}: ${productId} (${platform})`);
    
    // You can add other analytics services here
    // Example: Facebook Pixel, Hotjar, etc.
}

/**
 * Get device type
 * @returns {string} Device type (mobile, tablet, desktop)
 */
function getDeviceType() {
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean} True if user prefers reduced motion
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get time ago string
 * @param {Date|string} date - Date to compare
 * @returns {string} Time ago string
 */
function getTimeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    const intervals = {
        ano: 31536000,
        mês: 2592000,
        semana: 604800,
        dia: 86400,
        hora: 3600,
        minuto: 60
    };
    
    for (const [unit, seconds] of Object.entries(intervals)) {
        const interval = Math.floor(diffInSeconds / seconds);
        if (interval >= 1) {
            return `há ${interval} ${unit}${interval > 1 ? 's' : ''}`;
        }
    }
    
    return 'agora mesmo';
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Export functions for use in other modules
window.Utils = {
    debounce,
    formatCurrency,
    formatNumber,
    formatDate,
    getPlatformColorClass,
    getPlatformColor,
    generateId,
    sanitizeHtml,
    truncateText,
    isValidImageUrl,
    getPlaceholderImage,
    showNotification,
    scrollToElement,
    isInViewport,
    lazyLoadImages,
    getQueryParam,
    setQueryParam,
    removeQueryParam,
    copyToClipboard,
    trackClick,
    getDeviceType,
    prefersReducedMotion,
    getTimeAgo,
    isValidEmail,
    isValidUrl
};

