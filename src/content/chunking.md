# Chunking (Segmentação de Documentos)

Imagine que você precisa estudar para uma prova usando um livro de 500 páginas, mas só pode levar **uma ficha de anotação** para a sala. Você não vai copiar o livro inteiro — vai selecionar os trechos mais relevantes e colocá-los na ficha. O **Chunking** é exatamente esse processo: quebrar documentos grandes em pedaços menores que cabem na [janela de contexto](#ia-e-modelos) de um [LLM](#ia-e-modelos).

---

## 1. O que é Chunking e Por que é Necessário?

**Chunking (Fragmentação)** é o processo de dividir documentos longos — PDFs, artigos, manuais técnicos — em pedaços menores chamados **chunks**. Cada chunk é então transformado em um vetor e armazenado em um [banco de dados vetorial](#universo-dos-vetores).

### Por que não enviar o documento inteiro?

1. **Limite da Context Window:** Os [LLMs](#ia-e-modelos) têm um limite de [tokens](#ia-e-modelos) que podem processar por vez.
2. **Precisão da busca:** Chunks menores têm significado mais concentrado, gerando embeddings mais precisos na [Busca Vetorial](#busca-vetorial).
3. **Custo:** Enviar menos tokens para o modelo = menor custo por requisição.
4. **Qualidade da resposta:** Entregar o trecho exato é melhor do que entregar páginas inteiras com informação irrelevante.

---

## 2. Estratégias de Chunking

| Estratégia | Como Funciona | Quando Usar |
| :--------- | :------------ | :---------- |
| **Tamanho fixo** | Corta o texto a cada N caracteres ou tokens | Textos sem estrutura clara (logs, transcrições) |
| **Por sentenças** | Agrupa N sentenças por chunk | Textos narrativos, artigos |
| **Por parágrafos** | Cada parágrafo vira um chunk | Documentação bem estruturada |
| **Recursivo** | Tenta dividir por parágrafo → sentença → caractere, nessa ordem | Uso geral (padrão do LangChain) |
| **Semântico** | Usa embeddings para detectar mudanças de assunto e corta nesses pontos | Textos longos com múltiplos tópicos |
| **Por estrutura** | Respeita a hierarquia do documento (H1, H2, listas) | Markdown, HTML, documentação técnica |

### Exemplo prático com tamanho fixo:

```python
texto = "A inteligência artificial está transformando o mundo. Modelos de linguagem..."

# Chunk size = 50 caracteres, overlap = 10
chunk_1 = "A inteligência artificial está transformando o mu"
chunk_2 = "mando o mundo. Modelos de linguagem..."
#          ^^^^^^^^^ overlap (repetição)
```

---

## 3. Overlap: Por que Sobrepor Pedaços?

O **Overlap (Sobreposição)** é a técnica de repetir o final de um chunk no início do próximo. Sem overlap, informações que caem exatamente na "fronteira" entre dois chunks podem ser cortadas ao meio e perdidas.

### Sem overlap vs. com overlap:

```
Documento: "O reembolso deve ser solicitado em até 30 dias. Após esse prazo, não há garantia."

--- Sem Overlap (chunk_size=50) ---
Chunk 1: "O reembolso deve ser solicitado em até 30 dias. "
Chunk 2: "Após esse prazo, não há garantia."
→ Buscar "prazo de reembolso" pode não encontrar a conexão entre os chunks.

--- Com Overlap de 15 caracteres ---
Chunk 1: "O reembolso deve ser solicitado em até 30 dias. "
Chunk 2: "em até 30 dias. Após esse prazo, não há garantia."
→ A conexão "30 dias / prazo" está presente nos dois chunks.
```

### Quanto de overlap usar?

- **Regra prática:** 10-20% do tamanho do chunk.
- **Chunk de 500 tokens:** Overlap de 50-100 tokens.
- **Muito overlap:** Aumenta o armazenamento e pode gerar resultados duplicados.
- **Pouco overlap:** Risco de perder contexto nas fronteiras.

---

## 4. Metadata Filtering: Filtrando Antes de Buscar

O **Metadata Filtering (Filtro por Metadados)** combina a busca vetorial com filtros rígidos baseados em atributos do documento. Em vez de buscar em **todos** os chunks, você restringe a busca a um subconjunto relevante.

### Exemplos de metadados úteis:

| Metadado | Exemplo | Uso |
| :------- | :------ | :-- |
| `categoria` | "Financeiro", "RH", "Jurídico" | Filtrar por departamento |
| `data_criacao` | "2024-01-15" | Buscar apenas docs recentes |
| `autor` | "Maria Silva" | Filtrar por responsável |
| `tipo_documento` | "contrato", "manual", "ata" | Segmentar por tipo |
| `idioma` | "pt-br", "en" | Filtrar por língua |

### Como funciona na prática?

```python
# Busca vetorial + filtro por metadados
resultados = vector_db.query(
    query_embedding=embedding("política de reembolso"),
    filter={
        "categoria": "Financeiro",
        "data_criacao": {"$gte": "2024-01-01"}
    },
    top_k=5
)
# Resultado: Apenas chunks da categoria "Financeiro"
# criados a partir de 2024, ordenados por relevância semântica.
```

Isso é especialmente poderoso em sistemas de [RAG](#rag-hibrida) empresariais, onde diferentes departamentos têm documentos distintos e o usuário precisa de respostas específicas ao seu contexto.

---

## 5. Vantagens e Limitações

✅ Chunking permite que documentos de qualquer tamanho sejam usados em sistemas de [RAG](#rag-hibrida).

✅ Overlap garante que o contexto não seja perdido nas fronteiras entre chunks.

✅ Metadata filtering reduz drasticamente o espaço de busca, melhorando velocidade e relevância.

✅ Estratégias como chunking semântico produzem chunks com significado mais coeso.

⚠️ Chunk muito pequeno perde contexto; chunk muito grande dilui o significado do embedding.

⚠️ Overlap excessivo aumenta armazenamento e pode gerar resultados duplicados.

⚠️ A escolha da estratégia de chunking depende do tipo de documento — não existe "tamanho único".

⚠️ Metadados precisam ser extraídos e mantidos consistentes, o que exige pipeline de ingestão bem construído.

---

## Relação com Outros Tópicos

O chunking é o **primeiro passo** do pipeline de [RAG](#rag-hibrida). Depois de fragmentar os documentos, os chunks são transformados em embeddings e armazenados em [bancos vetoriais](#universo-dos-vetores). O tamanho dos chunks deve considerar a [Context Window](#ia-e-modelos) do modelo utilizado. A qualidade do chunking impacta diretamente a [Busca Vetorial](#busca-vetorial) e pode ser avaliada com [métricas de qualidade](#metricas-qualidade) como Precision e Recall.
