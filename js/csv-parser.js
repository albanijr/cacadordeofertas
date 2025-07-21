// CSV Parser for loading and processing product data

class CSVParser {
    /**
     * Load products from CSV file
     * @returns {Promise<Array>} Array of product objects
     */
    static async loadProducts() {
        try {
            const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRAJCC7mpCFoAgZxCXojqj49uKqEMz1kNXTJmzTpUcgJp81mOwU7MlonIUWgaFzohGdW2Af4h6OQ1YL/pub?gid=0&single=true&output=csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            return this.parseCSV(csvText);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            // Return sample data for demonstration
            return this.getSampleData();
        }
    }
    
    /**
     * Parse CSV text into array of objects
     * @param {string} csvText - Raw CSV text
     * @returns {Array} Array of product objects
     */
    static parseCSV(csvText) {
        const lines = csvText.split('\n');
        if (lines.length < 2) {
            console.warn('CSV file appears to be empty or invalid');
            return this.getSampleData();
        }
        
        const headers = this.parseCSVLine(lines[0]);
        const products = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = this.parseCSVLine(line);
            if (values.length !== headers.length) {
                console.warn(`Line ${i + 1} has ${values.length} values but expected ${headers.length}`);
                continue;
            }
            
            const product = {};
            headers.forEach((header, index) => {
                product[header] = values[index];
            });
            
            // Process and validate product data
            const processedProduct = this.processProductData(product);
            if (processedProduct) {
                products.push(processedProduct);
            }
        }
        
        console.log(`Loaded ${products.length} products from CSV`);
        return products;
    }
    
    /**
     * Parse a single CSV line handling quoted values
     * @param {string} line - CSV line to parse
     * @returns {Array} Array of values
     */
    static parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                // Field separator
                values.push(current.trim());
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }
        
        // Add the last field
        values.push(current.trim());
        
        return values;
    }
    
    /**
     * Process and validate product data
     * @param {Object} rawProduct - Raw product data from CSV
     * @returns {Object|null} Processed product or null if invalid
     */
    static processProductData(rawProduct) {
        try {
            // Required fields validation
            if (!rawProduct.id || !rawProduct.titulo || !rawProduct.link_afiliado) {
                console.warn('Product missing required fields:', rawProduct);
                return null;
            }
            
            const product = {
                id: rawProduct.id,
                titulo: rawProduct.titulo || '',
                descricao: rawProduct.descricao || '',
                preco_original: this.parseFloat(rawProduct.preco_original),
                preco_promocional: this.parseFloat(rawProduct.preco_promocional),
                desconto_percentual: this.parseInt(rawProduct.desconto_percentual),
                link_afiliado: rawProduct.link_afiliado || '',
                imagens_base64: this.parseImageArray(rawProduct.imagens_base64),
                categoria_principal: rawProduct.categoria_principal || 'Outros',
                nichos: this.parseStringArray(rawProduct.nichos),
                plataforma: rawProduct.plataforma || 'Desconhecida',
                avaliacao: this.parseFloat(rawProduct.avaliacao),
                vendas: this.parseInt(rawProduct.vendas),
                data_inicio_promocao: this.parseDate(rawProduct.data_inicio_promocao),
                data_fim_promocao: this.parseDate(rawProduct.data_fim_promocao),
                data_publicacao: this.parseDate(rawProduct.data_publicacao),
                status: rawProduct.status || 'published'
            };
            
            // Calculate discount if not provided
            if (!product.desconto_percentual && product.preco_original > 0) {
                product.desconto_percentual = Math.round(
                    ((product.preco_original - product.preco_promocional) / product.preco_original) * 100
                );
            }
            
            // Validate essential data
            if (product.preco_promocional <= 0) {
                console.warn('Product has invalid price:', product);
                return null;
            }
            
            return product;
        } catch (error) {
            console.error('Error processing product data:', error, rawProduct);
            return null;
        }
    }
    
    /**
     * Parse float value with fallback
     * @param {string} value - String value to parse
     * @returns {number} Parsed float or 0
     */
    static parseFloat(value) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    /**
     * Parse integer value with fallback
     * @param {string} value - String value to parse
     * @returns {number} Parsed integer or 0
     */
    static parseInt(value) {
        const parsed = parseInt(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    /**
     * Parse date string
     * @param {string} dateString - Date string to parse
     * @returns {Date|null} Parsed date or null
     */
    static parseDate(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    }
    
    /**
     * Parse comma-separated string into array
     * @param {string} str - String to parse
     * @returns {Array} Array of strings
     */
    static parseStringArray(str) {
        if (!str) return [];
        return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    
    /**
     * Parse pipe-separated base64 images
     * @param {string} str - String containing base64 images
     * @returns {Array} Array of base64 image strings
     */
    static parseImageArray(str) {
        if (!str) return [];
        return str.split('|').map(img => img.trim()).filter(img => img.length > 0);
    }
    
    /**
     * Get sample data for demonstration
     * @returns {Array} Array of sample products
     */
    static getSampleData() {
        return [
            {
                id: 'sample1',
                titulo: 'Fone de Ouvido Bluetooth 5.0 com Cancelamento de Ruído',
                descricao: 'Fone de ouvido sem fio com bateria de 20 horas, resistente à água IPX7 e microfone embutido para chamadas.',
                preco_original: 199.90,
                preco_promocional: 99.90,
                desconto_percentual: 50,
                link_afiliado: 'https://shopee.com.br/produto/exemplo1',
                imagens_base64: [Utils.getPlaceholderImage(300, 300)],
                categoria_principal: 'Eletrônicos',
                nichos: ['ofertas relampago', 'novidades'],
                plataforma: 'Shopee',
                avaliacao: 4.8,
                vendas: 1500,
                data_inicio_promocao: new Date('2025-01-20T22:00:00Z'),
                data_fim_promocao: new Date('2025-01-21T06:00:00Z'),
                data_publicacao: new Date('2025-01-21T10:00:00Z'),
                status: 'published'
            },
            {
                id: 'sample2',
                titulo: 'Smartwatch Fitness com Monitor Cardíaco',
                descricao: 'Relógio inteligente com monitoramento de saúde 24/7, GPS integrado e resistência à água.',
                preco_original: 299.90,
                preco_promocional: 149.90,
                desconto_percentual: 50,
                link_afiliado: 'https://amazon.com.br/produto/exemplo2',
                imagens_base64: [Utils.getPlaceholderImage(300, 300)],
                categoria_principal: 'Eletrônicos',
                nichos: ['mais vendidos'],
                plataforma: 'Amazon',
                avaliacao: 4.5,
                vendas: 800,
                data_inicio_promocao: new Date('2025-01-20T22:00:00Z'),
                data_fim_promocao: new Date('2025-01-22T06:00:00Z'),
                data_publicacao: new Date('2025-01-21T10:00:00Z'),
                status: 'published'
            },
            {
                id: 'sample3',
                titulo: 'Carregador Portátil 20000mAh Fast Charge',
                descricao: 'Power bank de alta capacidade com carregamento rápido e múltiplas portas USB.',
                preco_original: 89.90,
                preco_promocional: 44.90,
                desconto_percentual: 50,
                link_afiliado: 'https://aliexpress.com/produto/exemplo3',
                imagens_base64: [Utils.getPlaceholderImage(300, 300)],
                categoria_principal: 'Eletrônicos',
                nichos: ['ofertas relampago'],
                plataforma: 'AliExpress',
                avaliacao: 4.3,
                vendas: 2200,
                data_inicio_promocao: new Date('2025-01-20T22:00:00Z'),
                data_fim_promocao: new Date('2025-01-21T06:00:00Z'),
                data_publicacao: new Date('2025-01-21T10:00:00Z'),
                status: 'published'
            },
            {
                id: 'sample4',
                titulo: 'Camiseta Básica 100% Algodão',
                descricao: 'Camiseta confortável e versátil, disponível em várias cores e tamanhos.',
                preco_original: 39.90,
                preco_promocional: 19.90,
                desconto_percentual: 50,
                link_afiliado: 'https://magazineluiza.com.br/produto/exemplo4',
                imagens_base64: [Utils.getPlaceholderImage(300, 300)],
                categoria_principal: 'Moda',
                nichos: ['novidades'],
                plataforma: 'Magazine Luiza',
                avaliacao: 4.2,
                vendas: 500,
                data_inicio_promocao: new Date('2025-01-20T22:00:00Z'),
                data_fim_promocao: new Date('2025-01-23T06:00:00Z'),
                data_publicacao: new Date('2025-01-21T10:00:00Z'),
                status: 'published'
            },
            {
                id: 'sample5',
                titulo: 'Luminária LED Inteligente RGB',
                descricao: 'Luminária com controle por aplicativo, milhões de cores e sincronização com música.',
                preco_original: 129.90,
                preco_promocional: 64.90,
                desconto_percentual: 50,
                link_afiliado: 'https://temu.com/produto/exemplo5',
                imagens_base64: [Utils.getPlaceholderImage(300, 300)],
                categoria_principal: 'Casa e Decoração',
                nichos: ['mais vendidos', 'novidades'],
                plataforma: 'TEMU',
                avaliacao: 4.6,
                vendas: 1200,
                data_inicio_promocao: new Date('2025-01-20T22:00:00Z'),
                data_fim_promocao: new Date('2025-01-24T06:00:00Z'),
                data_publicacao: new Date('2025-01-21T10:00:00Z'),
                status: 'published'
            },
            {
                id: 'sample6',
                titulo: 'Mouse Gamer RGB 12000 DPI',
                descricao: 'Mouse para jogos com sensor óptico de alta precisão, 7 botões programáveis e iluminação RGB.',
                preco_original: 159.90,
                preco_promocional: 79.90,
                desconto_percentual: 50,
                link_afiliado: 'https://shopee.com.br/produto/exemplo6',
                imagens_base64: [Utils.getPlaceholderImage(300, 300)],
                categoria_principal: 'Eletrônicos',
                nichos: ['ofertas relampago', 'mais vendidos'],
                plataforma: 'Shopee',
                avaliacao: 4.7,
                vendas: 950,
                data_inicio_promocao: new Date('2025-01-20T22:00:00Z'),
                data_fim_promocao: new Date('2025-01-21T06:00:00Z'),
                data_publicacao: new Date('2025-01-21T10:00:00Z'),
                status: 'published'
            }
        ];
    }
    
    /**
     * Validate CSV structure
     * @param {string} csvText - CSV text to validate
     * @returns {Object} Validation result
     */
    static validateCSV(csvText) {
        const lines = csvText.split('\n');
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            lineCount: lines.length,
            productCount: 0
        };
        
        if (lines.length < 2) {
            result.isValid = false;
            result.errors.push('CSV file must have at least a header and one data row');
            return result;
        }
        
        const headers = this.parseCSVLine(lines[0]);
        const requiredHeaders = ['id', 'titulo', 'link_afiliado', 'preco_promocional'];
        
        // Check required headers
        for (const required of requiredHeaders) {
            if (!headers.includes(required)) {
                result.isValid = false;
                result.errors.push(`Missing required header: ${required}`);
            }
        }
        
        // Validate data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = this.parseCSVLine(line);
            if (values.length !== headers.length) {
                result.warnings.push(`Line ${i + 1}: Expected ${headers.length} columns, got ${values.length}`);
            } else {
                result.productCount++;
            }
        }
        
        return result;
    }
}

// Export for use in other modules
window.CSVParser = CSVParser;

