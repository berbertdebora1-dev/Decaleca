# Decaleca — site e loja online

Loja virtual da Decaleca hospedada na Vercel: vitrine, carrinho, checkout com Mercado Pago
(Pix, cartão e boleto), acompanhamento de pedidos e painel administrativo em `/admin`.

## Como funciona

| Parte | Onde |
|---|---|
| Páginas do site | `index.html`, `nossa-historia.html`, `produtos.html`, `contato.html` |
| Loja | `produto.html` (detalhe), `carrinho.html`, `checkout.html`, `pedido.html` (status do pedido) |
| Painel da Débora | `admin.html` → `https://seusite.com.br/admin` |
| API (funções da Vercel) | `api/` — catálogo, checkout, pedidos, webhook do Mercado Pago, painel, upload de fotos |
| Regras da loja | `lib/` — preços, frete, estoque, validação, Mercado Pago, armazenamento |

- **Pagamento:** o cliente paga no ambiente seguro do Mercado Pago (Checkout Pro). O site nunca recebe nem guarda dados de cartão.
- **Preços e estoque** são sempre recalculados no servidor; o navegador não consegue alterar valores.
- **Estoque** é descontado quando o pagamento é aprovado e devolvido se um pedido pago for cancelado.
- **Pedidos** chegam no painel com dados do cliente, endereço, itens e situação do pagamento.

## Colocar a loja no ar (uma única vez)

No painel da Vercel, abra o projeto e siga os passos:

1. **Banco de dados** — *Storage → Create Database → Upstash (Redis)* e conecte ao projeto.
   Isso cria as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN` automaticamente.
2. **Fotos** — *Storage → Create → Blob* e conecte ao projeto (cria `BLOB_READ_WRITE_TOKEN`).
3. **Variáveis de ambiente** — *Settings → Environment Variables*:

   | Nome | Valor |
   |---|---|
   | `ADMIN_PASSWORD` | uma senha forte para entrar no painel |
   | `MP_ACCESS_TOKEN` | Access Token de **produção** do Mercado Pago |
   | `SITE_URL` | endereço do site, ex.: `https://www.decaleca.com.br` |

   O Access Token fica em <https://www.mercadopago.com.br/developers/panel/app> → crie uma aplicação
   (pode usar a mesma conta do Mercado Livre) → *Credenciais de produção*.
   Para testar sem cobrar, use primeiro as *Credenciais de teste*.
4. **Webhook do Mercado Pago** — na mesma aplicação, em *Webhooks*, cadastre
   `https://SEU-SITE/api/mp-webhook` com o evento **Pagamentos**. (O site também informa esse endereço
   a cada pagamento; o cadastro é uma garantia extra.)
5. Faça um novo deploy (*Deployments → Redeploy*) para as variáveis valerem.
6. Acesse `/admin`, entre com a senha e:
   - em **Configurações**, defina o frete (fixo, grátis acima de um valor, retirada em mãos) e as parcelas;
   - em **Coleções**, crie as coleções;
   - em **Produtos**, cadastre cada produto com fotos, preço, tamanhos e estoque.

## Dia a dia no painel

- **Pedidos:** veja os pagos (prontos para enviar), copie o endereço, marque como *Em preparação → Enviado*
  com o código de rastreio, e chame o cliente no WhatsApp com um clique.
- **Produtos:** altere preço, estoque e fotos; desmarque *Mostrar na loja* para esconder um item.
- **Configurações:** desmarque *Loja aberta* para pausar as vendas (férias, por exemplo).

## Links oficiais — `assets/config.js`

WhatsApp (`https://wa.me/55DDDNUMERO`), Mercado Livre, Instagram e convite do Clube da Decaleca.
Enquanto um link estiver vazio, os botões levam à página de Contato.

## Fotos fixas do site — pasta `images/`

As fotos dos produtos são enviadas pelo painel. As fotos das seções do site ficam em `images/`;
cada espaço vazio mostra uma etiqueta dizendo qual imagem vai ali:

| Arquivo | Onde |
|---|---|
| `home-hero.webp` | Início, topo |
| `categoria-meias.jpg`, `categoria-quadros.jpg`, `categoria-almofadas.webp` | Cards de categoria (Início e Loja) |
| `home-ilustracao.jpg`, `home-bordado-close.jpg`, `home-composicao.jpg` | Início, diferencial |
| `home-lifestyle.jpg` | Início, memórias |
| `clube-1.jpg`, `clube-2.jpg`, `clube-3.jpg` | Início, Clube |
| `historia-hero.jpg`, `historia-ilustracao.jpg`, `historia-produto-final.jpg`, `debora.jpg` | Nossa História |
| `presente.jpg` | Loja, seção de presentes |

## Rodar no computador (opcional)

```bash
npm install
```

```bash
npm run dev
```

Abra <http://localhost:3000>. Localmente os dados ficam em `.data/db.json`, as fotos em `images/uploads/`
e a senha do painel é `admin` (ou o valor de `ADMIN_PASSWORD`).

## Próximos passos sugeridos

- Cálculo de frete por CEP (Melhor Envio ou Correios) no lugar do frete fixo.
- E-mail automático de confirmação de pedido (ex.: Resend).
- Páginas de política de trocas e privacidade, com textos definidos pela Decaleca.
