# Site de Promoções - Projeto de Afiliados

Este é um site estático para exibição de promoções e ofertas de programas de afiliados, desenvolvido para ser hospedado no GitHub Pages.

## 📋 Características

- **Site Estático**: HTML, CSS e JavaScript vanilla
- **Responsivo**: Otimizado para desktop, tablet e mobile
- **Performance**: Carregamento rápido e otimizado
- **SEO**: Otimizado para motores de busca
- **Acessibilidade**: Compatível com leitores de tela
- **Filtros Avançados**: Busca, categoria, plataforma e ordenação
- **Dados CSV**: Carregamento dinâmico de produtos via CSV

## 🚀 Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilos modernos com Flexbox e Grid
- **JavaScript ES6+**: Funcionalidades interativas
- **Tailwind CSS**: Framework CSS utilitário
- **Lucide Icons**: Ícones SVG modernos

## 📁 Estrutura do Projeto

```
cacadordeofertas/
├── index.html              # Página principal
├── css/
│   ├── styles.css          # Estilos customizados
│   └── components.css      # Componentes específicos
├── js/
│   ├── main.js            # Script principal
│   ├── csv-parser.js      # Parser de CSV
│   ├── product-renderer.js # Renderização de produtos
│   ├── filters.js         # Sistema de filtros
│   └── utils.js           # Funções utilitárias
├── data/
│   └── produtos_promocoes.csv # Dados dos produtos
├── assets/
│   └── images/            # Imagens e recursos
└── README.md              # Este arquivo
```

## 🛠️ Como Usar

### 1. Teste Local

Para testar o site localmente, você precisa de um servidor HTTP simples devido às restrições de CORS do navegador ao carregar arquivos CSV.

#### Opção A: Python (Recomendado)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Opção B: Node.js
```bash
# Instalar servidor global
npm install -g http-server

# Executar servidor
http-server -p 8000
```

#### Opção C: PHP
```bash
php -S localhost:8000
```

Após iniciar o servidor, acesse: `http://localhost:8000`

### 2. Atualização de Produtos

Para atualizar os produtos exibidos no site:

1. **Edite o arquivo CSV**: `data/produtos_promocoes.csv`
2. **Formato obrigatório**: Mantenha a estrutura das colunas
3. **Imagens**: Use URLs ou dados base64
4. **Validação**: Teste localmente antes de publicar

#### Estrutura do CSV:
- `id`: Identificador único
- `titulo`: Nome do produto
- `descricao`: Descrição detalhada
- `preco_original`: Preço sem desconto
- `preco_promocional`: Preço com desconto
- `desconto_percentual`: Percentual de desconto
- `link_afiliado`: URL do link de afiliado
- `imagens_base64`: Imagens em base64 (separadas por |)
- `categoria_principal`: Categoria do produto
- `nichos`: Nichos separados por vírgula
- `plataforma`: Nome da plataforma
- `avaliacao`: Avaliação (0-5)
- `vendas`: Número de vendas
- `data_inicio_promocao`: Data de início (ISO 8601)
- `data_fim_promocao`: Data de fim (ISO 8601)
- `data_publicacao`: Data de publicação (ISO 8601)
- `status`: Status do produto

### 3. Personalização

#### Cores e Estilos
- Edite `css/styles.css` para personalizar cores e estilos
- Modifique `css/components.css` para ajustar componentes específicos

#### Conteúdo
- Altere textos em `index.html`
- Adicione/remova seções conforme necessário
- Personalize meta tags para SEO

#### Funcionalidades
- Modifique `js/main.js` para ajustar comportamentos
- Customize filtros em `js/filters.js`
- Ajuste renderização em `js/product-renderer.js`

## 🌐 Deploy no GitHub Pages

### 1. Preparação do Repositório

1. **Crie um repositório** no GitHub
2. **Faça upload** de todos os arquivos do projeto
3. **Configure GitHub Pages**:
   - Vá em Settings > Pages
   - Selecione "Deploy from a branch"
   - Escolha "main" branch
   - Pasta: "/ (root)"

### 2. Configuração de Domínio (Opcional)

Para usar um domínio personalizado:

1. **Adicione arquivo CNAME** na raiz com seu domínio
2. **Configure DNS** do seu domínio para apontar para GitHub Pages
3. **Ative HTTPS** nas configurações do repositório

### 3. Automação de Deploy

Crie `.github/workflows/deploy.yml` para deploy automático:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install -g html-minifier-terser clean-css-cli terser
    
    - name: Optimize files
      run: |
        html-minifier-terser --input-dir . --output-dir dist --file-ext html
        cleancss -o dist/css/styles.min.css css/styles.css
        terser js/main.js -o dist/js/main.min.js
    
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## 📊 Analytics e Monitoramento

### Google Analytics

1. **Crie uma conta** no Google Analytics
2. **Adicione o código** no `<head>` do `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Métricas Importantes

- **Pageviews**: Visualizações de página
- **Click-through Rate**: Taxa de clique nos produtos
- **Bounce Rate**: Taxa de rejeição
- **Time on Page**: Tempo na página
- **Conversion Rate**: Taxa de conversão

## 🔧 Manutenção

### Atualizações Regulares

1. **Produtos**: Atualize o CSV diariamente
2. **Preços**: Verifique precisão dos preços
3. **Links**: Teste links de afiliado periodicamente
4. **Performance**: Monitore velocidade de carregamento

### Backup

- **Repositório Git**: Mantenha histórico de versões
- **CSV**: Faça backup regular dos dados
- **Configurações**: Documente personalizações

### Troubleshooting

#### Produtos não carregam
- Verifique formato do CSV
- Teste servidor local
- Verifique console do navegador

#### Site lento
- Otimize imagens
- Minimize CSS/JS
- Use CDN para recursos

#### Filtros não funcionam
- Verifique JavaScript no console
- Teste em diferentes navegadores
- Valide estrutura do CSV

## 📱 Compatibilidade

### Navegadores Suportados
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

### Dispositivos
- Desktop (1024px+)
- Tablet (640px - 1024px)
- Mobile (< 640px)

## 🤝 Contribuição

Para contribuir com o projeto:

1. **Fork** o repositório
2. **Crie uma branch** para sua feature
3. **Commit** suas mudanças
4. **Push** para a branch
5. **Abra um Pull Request**

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas ou problemas:

1. **Issues**: Abra uma issue no GitHub
2. **Documentação**: Consulte este README
3. **Comunidade**: Participe das discussões

---

**Desenvolvido com ❤️ para maximizar conversões em programas de afiliados**

