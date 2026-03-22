# Busca por Palavras-chave (Sparse Retrieval / BM25)

Se a busca vetorial (que vimos anteriormente) é como um bibliotecário que entende o "sentimento" do seu pedido, a **Busca por Palavras-chave** é como o índice remissivo no final de um livro técnico. Ela é direta, baseada em ocorrências exatas e extremamente eficiente para encontrar termos específicos.

## 1. O que é a Busca Esparsa?

O termo "Esparsa" vem da matemática. Imagine uma tabela onde as colunas são **todas as palavras existentes** em um idioma e as linhas são os seus documentos.

Para um documento que diz _"O gato subiu no telhado"_, quase todas as colunas da tabela estarão vazias (zero), exceto as colunas "gato", "subiu" e "telhado". Como a grande maioria das células é zero, chamamos isso de uma **Matriz Esparsa**.

---

## 2. O Algoritmo BM25: O Rei da Busca

O **BM25** (_Best Matching 25_) é a evolução do antigo TF-IDF. Ele é o algoritmo que decide qual documento é mais relevante para uma pesquisa. Ele não tenta "entender" o texto, mas sim calcular a importância estatística das palavras.

### Como ele calcula o ranking?

O BM25 olha para três fatores principais:

1.  **Frequência do Termo (TF):** Se a palavra aparece muitas vezes no documento, ele deve ser importante. _Porém_, o BM25 é inteligente: ele sabe que um documento com 100 menções à palavra "computador" não é necessariamente 100 vezes melhor que um com 10 menções. Ele aplica uma "saturação".
2.  **Frequência Inversa no Documento (IDF):** Palavras comuns como "o", "e", "de" valem pouco. Palavras raras como "fotossíntese" ou "criptografia" valem muito para o ranking.
3.  **Tamanho do Documento:** Se um livro de 500 páginas menciona "IA" 5 vezes, e um tuíte menciona "IA" 5 vezes, o tuíte é provavelmente muito mais focado no assunto. O BM25 normaliza o score com base no comprimento do texto.

A fórmula simplificada do score para um documento $D$ e uma consulta $Q$ é:

$$score(D, Q) = \sum_{q \in Q} IDF(q) \cdot \frac{f(q, D) \cdot (k_1 + 1)}{f(q, D) + k_1 \cdot (1 - b + b \cdot \frac{|D|}{avgdl})}$$

> **Onde:**
>
> - $f(q, D)$ é a frequência da palavra no documento.
> - $|D|$ é o tamanho do documento atual.
> - $avgdl$ é a média de tamanho de todos os documentos.
> - $k_1$ e $b$ são constantes de ajuste (padrão da indústria).

---

## 3. Por que ela ainda é essencial?

Com o surgimento da Busca Vetorial (IA), muitos acharam que o BM25 morreria. Pelo contrário! Ele brilha onde a IA falha:

- **Termos Técnicos e IDs:** Se você buscar por um código de erro como `ERR_CONNECTION_REFUSED` ou um SKU de produto `XYZ-123`, a busca vetorial pode se confundir com o "significado", enquanto o BM25 encontra o termo exato instantaneamente.
- **Velocidade e Custo:** É ordens de grandeza mais barato e rápido de processar do que modelos de linguagem pesados.
- **Transparência:** Você consegue explicar exatamente por que um resultado apareceu (ex: "Este documento contém a palavra X três vezes").

---

## 4. Comparativo Rápido

| Busca Esparsa (BM25)                | Busca Densa (Vetorial)         |
| :---------------------------------- | :----------------------------- |
| Encontra **palavras exatas**.       | Encontra **significados**.     |
| Ótima para nomes próprios e siglas. | Ótima para perguntas naturais. |
| Baixo consumo de memória/CPU.       | Exige GPUs e bancos vetoriais. |
| "O que está escrito?"               | "O que o usuário quer dizer?"  |

---

## 5. O Melhor dos Dois Mundos: Busca Híbrida

Hoje, os sistemas de busca mais modernos (como os usados em grandes e-commerces e documentações técnicas) utilizam a **Busca Híbrida**.

Eles rodam o **BM25** para garantir que termos exatos não sejam perdidos e a **Busca Vetorial** para capturar a intenção. Depois, combinam os resultados usando uma técnica chamada **RRF (Reciprocal Rank Fusion)** para entregar o melhor ranking possível ao usuário.

---

## Conclusão

A Busca Esparsa com BM25 é a base sólida sobre a qual a web foi construída. Mesmo na era da IA generativa, entender como os termos se distribuem estatisticamente em seus dados é o primeiro passo para criar qualquer sistema de recuperação de informação eficiente.
