/*
 * CATÁLOGO DECALECA
 * ------------------------------------------------------------
 * Cadastre aqui SOMENTE produtos e coleções reais e confirmados.
 * O site monta automaticamente vitrines, filtros e detalhes a partir
 * destes dados. Filtros só aparecem para valores que existem no catálogo.
 * Produtos com available: false não aparecem como compráveis.
 *
 * Imagens: coloque os arquivos em /images e informe o caminho,
 * ex.: "/images/meia-raposa-1.jpg". A primeira imagem é a capa;
 * as demais aparecem na visualização detalhada (inclua um close do bordado).
 *
 * ---------- EXEMPLO (copie, remova as barras e preencha) ----------
 *
 * collections: [
 *   {
 *     id: "nome-da-colecao",
 *     name: "Nome da Coleção",
 *     description: "Uma frase curta sobre o universo desta coleção.",
 *     image: "/images/colecao-nome.jpg"
 *   }
 * ],
 *
 * products: [
 *   {
 *     id: "meia-exemplo",
 *     name: "Nome do produto",
 *     category: "meias",            // "meias" ou "quadros"
 *     collection: "nome-da-colecao", // id de uma coleção acima
 *     price: "R$ 00,00",            // deixe "" se não houver preço confirmado
 *     sizes: ["0-3 meses"],         // ou [] quando não se aplica
 *     description: "Descrição curta e confirmada.",
 *     care: "",                     // cuidados (opcional)
 *     images: ["/images/meia-exemplo-1.jpg", "/images/meia-exemplo-bordado.jpg"],
 *     mercadoLivre: "",             // link do anúncio (opcional)
 *     available: true,
 *     featured: true                // aparece na vitrine da página inicial
 *   }
 * ]
 */
window.DECALECA_CATALOG = {
  collections: [],
  products: []
};
