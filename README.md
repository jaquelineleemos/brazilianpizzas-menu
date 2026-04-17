# Brazilian Pizzas Menu

Projeto pronto para GitHub e Netlify.

## Estrutura
- `Menu_PT/` → imagens em português
- `Menu_EN/` → imagens em inglês
- `images.json` → ordem das páginas
- `script.js` → lógica do flipbook
- `index.html`, `style.css`, `manifest.json` → arquivos do site

## Convenção de nomes
As imagens usam o padrão:

- PT: `PT_000_capa.jpeg`, `PT_010_filosofia-da-massa.jpeg`, `PT_020_pizza-napoletana.jpeg`...
- EN: `EN_000_cover.jpeg`, `EN_010_dough-philosophy.jpeg`, `EN_020_pizza-napoletana.jpeg`...

Os números têm espaço entre si para facilitar inserções futuras sem renomear tudo.

## Como inserir novas páginas no futuro
Exemplos:

- depois da Burrata Margherita (`030`), use `035`
- depois da Linguiça / Kielbasa (`090`), use `095`

Exemplo PT:
- `PT_035_nome-da-nova-pizza.jpeg`
- `PT_095_nome-da-nova-pizza.jpeg`

Exemplo EN:
- `EN_035_name-of-new-pizza.jpeg`
- `EN_095_name-of-new-pizza.jpeg`

Depois de enviar a nova imagem, adicione o novo nome na posição correta dentro do `images.json`.

## Ordem atual
### PT
- PT_000_capa.jpeg
- PT_010_filosofia-da-massa.jpeg
- PT_020_pizza-napoletana.jpeg
- PT_030_burrata-margherita.jpeg
- PT_040_pizza-de-queijos.jpeg
- PT_050_pizza-de-queijo-bacon.jpeg
- PT_060_pepperoni.jpeg
- PT_070_frango-desfiado.jpeg
- PT_080_frango-cremoso-parmesao-gratinado.jpeg
- PT_090_linguica-calabresa-defumada.jpeg
- PT_100_toscana.jpeg
- PT_110_prosciutto.jpeg

### EN
- EN_000_cover.jpeg
- EN_010_dough-philosophy.jpeg
- EN_020_pizza-napoletana.jpeg
- EN_030_burrata-margherita.jpeg
- EN_040_cheese-pizza.jpeg
- EN_050_cheese-pizza-bacon.jpeg
- EN_060_pepperoni.jpeg
- EN_070_shredded-chicken.jpeg
- EN_080_creamy-chicken-parmesan-au-gratin.jpeg
- EN_090_smoked-kielbasa.jpeg
- EN_100_toscana.jpeg
- EN_110_prosciutto.jpeg