# Universo dos Vetores (Bancos de Dados Vetoriais)

Imagine uma biblioteca onde os livros não são organizados por ordem alfabética, mas por **proximidade de significado**. Livros sobre culinária italiana ficam ao lado de livros sobre massa caseira, mesmo que seus títulos não compartilhem nenhuma palavra. Essa é a lógica por trás dos **Bancos de Dados Vetoriais** — e eles são a infraestrutura que torna a [Busca Vetorial](#busca-vetorial) possível em escala.

---

## 1. O que é um Banco de Dados Vetorial?

Um **Vector Database** é um banco de dados especializado em armazenar, indexar e pesquisar **vetores** (listas de números que representam o significado de textos, imagens ou áudios). Diferente de bancos tradicionais que buscam por correspondência exata (SQL `WHERE nome = 'João'`), os vetoriais buscam por **similaridade matemática**.

### Fluxo básico:

1. Seus documentos passam por [Chunking](#chunking) para serem divididos em pedaços menores.
2. Cada pedaço é transformado em um vetor (embedding) por um modelo de IA.
3. O vetor é armazenado no banco vetorial junto com seus **metadados** (categoria, data, autor, etc.).
4. Na hora da busca, a pergunta do usuário também vira um vetor, e o banco encontra os vizinhos mais próximos.

---

## 2. Dimensões: O que Significam os Números

Cada vetor é uma lista de números decimais — e o tamanho dessa lista são as **dimensões**. Um modelo de embedding comum pode gerar vetores com 768 ou 1.536 dimensões.

### Como visualizar?

- **2 dimensões:** Um ponto em um gráfico X/Y (como um mapa).
- **3 dimensões:** Um ponto no espaço 3D (como a posição de um drone).
- **768 dimensões:** Impossível visualizar, mas a mesma lógica se aplica — cada dimensão captura uma "característica" diferente do significado.

| Modelo de Embedding | Dimensões | Uso Típico |
| :------------------ | :-------- | :--------- |
| `text-embedding-ada-002` (OpenAI) | 1.536 | Uso geral |
| `all-MiniLM-L6-v2` (Sentence Transformers) | 384 | Leve e rápido |
| `text-embedding-3-large` (OpenAI) | 3.072 | Alta precisão |
| `voyage-large-2` (Voyage AI) | 1.536 | Documentos longos |

### Mais dimensões = melhor?

Nem sempre. Mais dimensões capturam mais nuances, mas exigem mais memória, mais armazenamento e buscas mais lentas. A escolha depende do equilíbrio entre **precisão** e **performance**.

---

## 3. ANN (Approximate Nearest Neighbor)

Quando o usuário faz uma busca, o banco precisa comparar o vetor da pergunta com **milhões** (ou bilhões) de vetores armazenados. Calcular a distância exata de cada um seria impossível em tempo real.

O **ANN (Vizinho Mais Próximo Aproximado)** resolve isso usando "atalhos" matemáticos que encontram os vizinhos mais próximos com ~99% de precisão, mas em uma fração do tempo.

### Principais algoritmos:

| Algoritmo | Como Funciona | Prós | Contras |
| :-------- | :------------ | :--- | :------ |
| **HNSW** (Hierarchical Navigable Small World) | Cria um grafo em camadas, como um mapa de metrô com linhas expressas e locais | Muito rápido, alta precisão | Consome bastante memória RAM |
| **IVF** (Inverted File Index) | Agrupa vetores em "bairros" e só busca nos bairros mais próximos | Menor uso de memória | Menos preciso que HNSW |
| **PQ** (Product Quantization) | Comprime os vetores para ocupar menos espaço, como um ZIP de números | Muito eficiente em armazenamento | Perde precisão na compressão |
| **ScaNN** (Google) | Combina quantização com busca otimizada por hardware | Altíssima performance | Mais complexo de configurar |

Na prática, a maioria dos bancos vetoriais usa **HNSW** como padrão por oferecer o melhor equilíbrio.

---

## 4. Ferramentas Populares

| Ferramenta | Tipo | Destaque |
| :--------- | :--- | :------- |
| **Pinecone** | SaaS (gerenciado) | Zero configuração, escala automática |
| **Weaviate** | Open source | Suporte nativo a filtros por metadados e módulos de IA |
| **Milvus** | Open source | Altíssima performance para bilhões de vetores |
| **Qdrant** | Open source | API moderna, filtros avançados, escrito em Rust |
| **pgvector** | Extensão PostgreSQL | Ideal se você já usa PostgreSQL — adiciona busca vetorial sem trocar de banco |
| **ChromaDB** | Open source | Simples e leve, ótimo para prototipagem |

### Quando usar cada tipo?

- **Já usa PostgreSQL?** Comece com `pgvector` — menor complexidade operacional.
- **Precisa de escala massiva?** Milvus ou Pinecone.
- **Prototipando?** ChromaDB ou Qdrant.
- **Quer filtros híbridos?** Weaviate ou Qdrant (combinam busca vetorial com [filtros por metadados](#chunking)).

---

## 5. Vantagens e Limitações

✅ Permitem busca semântica em tempo real sobre milhões de documentos.

✅ Combinam naturalmente com [Busca Híbrida](#busca-hibrida) quando suportam filtros por metadados.

✅ Algoritmos ANN entregam resultados em milissegundos mesmo com grandes volumes.

✅ Ecossistema maduro com opções open source e gerenciadas.

⚠️ Exigem um modelo de embedding para gerar os vetores — mudança de modelo requer re-indexação total.

⚠️ HNSW consome memória RAM proporcional ao número de vetores armazenados.

⚠️ A qualidade da busca depende diretamente da qualidade do embedding e do [Chunking](#chunking).

⚠️ Diferente de SQL, não há uma linguagem de consulta padronizada entre os diferentes bancos.

---

## Relação com Outros Tópicos

Os bancos vetoriais são a **infraestrutura** que sustenta a [Busca Vetorial](#busca-vetorial). Antes de armazenar os vetores, os documentos precisam passar por [Chunking](#chunking) para serem divididos em pedaços adequados. Na hora da busca, os resultados do banco vetorial podem ser combinados com busca por palavras-chave na [Busca Híbrida](#busca-hibrida) e refinados por [Cross-Encoders](#cross-encoders) para máxima precisão. A qualidade final pode ser medida com [métricas como Precision e NDCG](#metricas-qualidade).
