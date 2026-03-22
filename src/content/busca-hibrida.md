# Busca Híbrida (Hybrid Search)

Já vimos que a **Busca por Palavras-chave (BM25)** é ótima para encontrar termos exatos, e que a **Busca Vetorial** é ótima para entender a intenção do usuário. Mas e se pudéssemos usar as duas ao mesmo tempo? Essa é a ideia da **Busca Híbrida**: combinar o melhor dos dois mundos para entregar resultados muito mais completos e relevantes.

## 1. Por que combinar?

Cada método de busca tem pontos cegos:

- **BM25 sozinho:** Se o usuário busca _"como evitar que meu app trave"_, o BM25 procura as palavras literais. Ele pode não encontrar um artigo chamado _"Tratamento de Exceções em Aplicações Mobile"_, que é exatamente o que o usuário precisa.
- **Busca Vetorial sozinha:** Se o usuário busca pelo código de erro `SIGKILL_9`, a busca vetorial pode tentar "entender o significado" e retornar artigos genéricos sobre sinais de processo, perdendo o documento que menciona o código exato.

A Busca Híbrida elimina esses pontos cegos executando **ambas as buscas em paralelo** e combinando seus resultados.

---

## 2. Como funciona na prática?

O fluxo de uma Busca Híbrida segue quatro etapas:

1.  **Receber a consulta:** O usuário digita sua pergunta ou termo de busca.
2.  **Executar em paralelo:**
    - O **BM25** varre o índice textual e retorna seus Top-N resultados com scores estatísticos.
    - A **Busca Vetorial** compara o embedding da consulta com os vetores do banco e retorna seus Top-N resultados com scores de similaridade.
3.  **Fundir os rankings:** Um algoritmo de fusão (como o **RRF — Reciprocal Rank Fusion**) combina as duas listas em um único ranking final. Ele não tenta somar notas de escalas diferentes; em vez disso, usa a **posição** de cada resultado em cada lista.
4.  **Entregar ao usuário:** A lista final, reordenada, é apresentada como resultado.

```
Consulta do Usuário
       │
       ├──────────────────┐
       ▼                  ▼
   [ BM25 ]        [ Vetorial ]
   Top-N results   Top-N results
       │                  │
       └────────┬─────────┘
                ▼
         [ Fusão (RRF) ]
                │
                ▼
        Lista Final Unificada
```

---

## 3. Por que não simplesmente somar os scores?

Esse é um erro comum. Os scores de cada método vivem em **escalas completamente diferentes**:

| Método   | Escala típica | O que significa                   |
| :------- | :------------ | :-------------------------------- |
| BM25     | 0 a ~50+      | Relevância estatística de termos  |
| Vetorial | 0.0 a 1.0     | Similaridade de cosseno no espaço |

Somar 42.5 (BM25) com 0.87 (vetorial) não faz sentido — o BM25 dominaria completamente o resultado. Por isso usamos técnicas baseadas em **ranking** (como RRF) em vez de scores absolutos.

---

## 4. Exemplo Concreto

Imagine uma base de documentação técnica. O usuário busca: _"timeout na conexão com o banco"_.

**Resultados do BM25 (termos exatos):**

| Posição | Documento                                       |
| :------ | :---------------------------------------------- |
| 1º      | "Configurando timeout de conexão no PostgreSQL" |
| 2º      | "Parâmetros de timeout do connection pool"      |
| 3º      | "Log de erros: connection timeout"              |

**Resultados da Busca Vetorial (semântica):**

| Posição | Documento                                       |
| :------ | :---------------------------------------------- |
| 1º      | "Troubleshooting de latência no banco de dados" |
| 2º      | "Configurando timeout de conexão no PostgreSQL" |
| 3º      | "Como lidar com conexões lentas em produção"    |

**Após fusão com RRF:**

| Posição | Documento                                       | Por que subiu?                   |
| :------ | :---------------------------------------------- | :------------------------------- |
| 1º      | "Configurando timeout de conexão no PostgreSQL" | 1º no BM25 + 2º no Vetorial      |
| 2º      | "Troubleshooting de latência no banco de dados" | 1º no Vetorial (semântica forte) |
| 3º      | "Parâmetros de timeout do connection pool"      | 2º no BM25 (termo exato)         |

O documento que apareceu bem em **ambas** as listas subiu para o topo — esse é o poder da abordagem híbrida.

---

## 5. Onde a Busca Híbrida é usada?

A Busca Híbrida se tornou o **padrão da indústria** para sistemas de [RAG (Retrieval-Augmented Generation)](#rag-hibrida):

- **Chatbots com base de conhecimento:** O chatbot precisa encontrar o trecho exato da documentação (BM25) e também entender perguntas formuladas de formas diferentes (vetorial).
- **E-commerce:** Buscar pelo SKU exato `NKE-AF1-42` (BM25) e também por _"tênis branco clássico"_ (vetorial).
- **Documentação técnica:** Encontrar o código de erro `ERR_CERT_AUTHORITY_INVALID` (BM25) e também _"meu site mostra que não é seguro"_ (vetorial).

### Ferramentas que suportam nativamente

Diversos bancos de dados e plataformas já oferecem Busca Híbrida como funcionalidade integrada:

- **Weaviate:** Parâmetro `alpha` controla o peso entre BM25 e vetorial.
- **Elasticsearch:** Combina queries `match` (BM25) com `knn` (vetorial) via `sub_searches`.
- **Pinecone:** Suporta sparse + dense vectors em um único índice.
- **Supabase:** Combina `tsvector` (full-text) com `pgvector` (embeddings) no PostgreSQL.

---

## 6. Vantagens e Limitações

**Cobertura completa:** Captura tanto termos exatos quanto intenção semântica.

**Robustez:** Se um método falha em encontrar algo, o outro compensa.

**Padrão da indústria:** Amplamente suportado por bancos vetoriais modernos.

**Melhoria mensurável:** Estudos mostram ganhos consistentes de relevância sobre qualquer método isolado.

**Maior complexidade:** Dois índices para manter (textual + vetorial), mais infra e custo.

**Latência:** Duas buscas em paralelo + fusão levam mais tempo que uma busca simples.

**Tuning:** A proporção ideal entre os métodos pode variar por domínio e exige experimentação.

---

## Conclusão

A Busca Híbrida é o reconhecimento prático de que nenhum método de busca é perfeito sozinho. Ao combinar a precisão literal do BM25 com a compreensão semântica da Busca Vetorial, criamos sistemas que entendem tanto _o que o usuário escreveu_ quanto _o que ele quis dizer_. Ela é a base sobre a qual técnicas mais avançadas — como **RRF** para fusão e **Cross-Encoders** para reranking — constroem resultados ainda melhores.
