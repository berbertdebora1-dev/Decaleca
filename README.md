# Decaleca — site oficial

Site estático (HTML, CSS e JavaScript puros, sem etapa de build), pronto para a Vercel.

## Publicar na Vercel
1. Em vercel.com, **Add New → Project** e importe este repositório.
2. Framework Preset: **Other**. Deixe Build Command e Output Directory vazios.
3. Deploy. O `vercel.json` ativa URLs limpas (`/produtos`, `/contato`, `/nossa-historia`).

## O que preencher antes de publicar
### 1. Links oficiais — `assets/config.js`
WhatsApp (`https://wa.me/55DDDNUMERO`), Mercado Livre, Instagram e convite do Clube da Decaleca.
Enquanto um link estiver vazio, os botões levam à página de Contato. Nenhum link foi inventado.

### 2. Catálogo — `assets/products.js`
Cadastre somente coleções e produtos reais (há um exemplo comentado no arquivo).
Vitrine da home, grade, filtros (Categoria, Coleção, Tamanho) e detalhe do produto são gerados
a partir desses dados. Filtros só aparecem para valores existentes; `available: false` esconde o produto.

### 3. Fotos — pasta `images/`
Cada espaço de foto mostra uma etiqueta dizendo qual imagem real vai ali. Basta salvar o arquivo
com o nome abaixo (JPG, ~1600px no lado maior, comprimido) e ele aparece automaticamente:

| Arquivo | Onde | O que mostrar |
|---|---|---|
| `home-hero.jpg` | Início, topo | Bebê usando meias Decaleca, bordado visível |
| `categoria-meias.jpg` | Início e Produtos | Meias bordadas |
| `categoria-quadros.jpg` | Início e Produtos | Quadros em quarto infantil |
| `home-ilustracao.jpg` | Início, diferencial | Ilustração original da Ludmita |
| `home-bordado-close.jpg` | Início, diferencial | Close do bordado |
| `home-composicao.jpg` | Início, diferencial | Composição de produtos |
| `home-lifestyle.jpg` | Início, memórias | Produtos reais em ambiente familiar |
| `clube-1.jpg`, `clube-2.jpg`, `clube-3.jpg` | Início, Clube | Colagem de produtos |
| `historia-hero.jpg` | Nossa História, topo | Produtos ao lado das ilustrações |
| `historia-ilustracao.jpg` | Nossa História | Ilustração original |
| `historia-produto-final.jpg` | Nossa História | Mesmo desenho no produto final |
| `debora.jpg` | Nossa História | Foto real da Débora |
| `presente.jpg` | Produtos, presentes | Produtos prontos para presentear |

## Estrutura
```
index.html            Início
nossa-historia.html   Nossa História
produtos.html         Produtos & Coleções (#meias, #quadros, #colecoes, #catalogo)
contato.html          Contato
404.html              Página não encontrada
assets/               config.js, products.js, main.js, styles.css, favicon.svg
images/               fotos reais dos produtos
vercel.json           configuração da Vercel
```

## Testar localmente
```bash
npx serve .
```
