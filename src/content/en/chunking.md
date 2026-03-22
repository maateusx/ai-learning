# Chunking (Document Segmentation)

Imagine you need to study for an exam using a 500-page book, but you can only bring **one index card** into the exam room. You wouldn't copy the entire book — you'd select the most relevant excerpts and put them on the card. **Chunking** is exactly that process: breaking large documents into smaller pieces that fit within the [context window](#ia-e-modelos) of an [LLM](#ia-e-modelos).

---

## 1. What is Chunking and Why is it Necessary?

**Chunking (Fragmentation)** is the process of splitting long documents — PDFs, articles, technical manuals — into smaller pieces called **chunks**. Each chunk is then transformed into a vector and stored in a [vector database](#universo-dos-vetores).

### Why not just send the entire document?

1. **Context Window limit:** [LLMs](#ia-e-modelos) have a [token](#ia-e-modelos) limit on how much they can process at once.
2. **Search accuracy:** Smaller chunks have more concentrated meaning, producing more precise embeddings for [Vector Search](#busca-vetorial).
3. **Cost:** Sending fewer tokens to the model = lower cost per request.
4. **Response quality:** Delivering the exact excerpt is better than delivering entire pages with irrelevant information.

---

## 2. Chunking Strategies

| Strategy | How It Works | When to Use |
| :--------- | :------------ | :---------- |
| **Fixed size** | Cuts text every N characters or tokens | Text without clear structure (logs, transcripts) |
| **By sentences** | Groups N sentences per chunk | Narrative text, articles |
| **By paragraphs** | Each paragraph becomes a chunk | Well-structured documentation |
| **Recursive** | Tries to split by paragraph, then sentence, then character, in that order | General purpose (LangChain default) |
| **Semantic** | Uses embeddings to detect topic changes and splits at those points | Long texts with multiple topics |
| **By structure** | Respects document hierarchy (H1, H2, lists) | Markdown, HTML, technical documentation |

### Practical example with fixed size:

```python
text = "Artificial intelligence is transforming the world. Language models..."

# Chunk size = 50 characters, overlap = 10
chunk_1 = "Artificial intelligence is transforming the worl"
chunk_2 = "ng the world. Language models..."
#          ^^^^^^^^^ overlap (repetition)
```

---

## 3. Overlap: Why Repeat Content Between Chunks?

**Overlap** is the technique of repeating the end of one chunk at the beginning of the next. Without overlap, information that falls exactly at the "boundary" between two chunks can be cut in half and lost.

### Without overlap vs. with overlap:

```
Document: "Refunds must be requested within 30 days. After that period, there is no guarantee."

--- Without Overlap (chunk_size=50) ---
Chunk 1: "Refunds must be requested within 30 days. "
Chunk 2: "After that period, there is no guarantee."
-> Searching for "refund deadline" might not find the connection between chunks.

--- With 15-character Overlap ---
Chunk 1: "Refunds must be requested within 30 days. "
Chunk 2: "within 30 days. After that period, there is no guarantee."
-> The connection "30 days / period" is present in both chunks.
```

### How much overlap should you use?

- **Rule of thumb:** 10-20% of the chunk size.
- **500-token chunk:** 50-100 tokens of overlap.
- **Too much overlap:** Increases storage and can produce duplicate results.
- **Too little overlap:** Risk of losing context at boundaries.

---

## 4. Metadata Filtering: Filtering Before Searching

**Metadata Filtering** combines vector search with hard filters based on document attributes. Instead of searching across **all** chunks, you restrict the search to a relevant subset.

### Examples of useful metadata:

| Metadata | Example | Use |
| :------- | :------ | :-- |
| `category` | "Finance", "HR", "Legal" | Filter by department |
| `created_date` | "2024-01-15" | Search only recent docs |
| `author` | "Jane Smith" | Filter by owner |
| `document_type` | "contract", "manual", "minutes" | Segment by type |
| `language` | "pt-br", "en" | Filter by language |

### How does it work in practice?

```python
# Vector search + metadata filtering
results = vector_db.query(
    query_embedding=embedding("refund policy"),
    filter={
        "category": "Finance",
        "created_date": {"$gte": "2024-01-01"}
    },
    top_k=5
)
# Result: Only chunks from the "Finance" category
# created from 2024 onward, ranked by semantic relevance.
```

This is especially powerful in enterprise [RAG](#rag-hibrida) systems, where different departments have distinct documents and the user needs answers specific to their context.

---

## 5. Advantages and Limitations

Chunking allows documents of any size to be used in [RAG](#rag-hibrida) systems.

Overlap ensures that context is not lost at boundaries between chunks.

Metadata filtering drastically reduces the search space, improving both speed and relevance.

Strategies like semantic chunking produce chunks with more cohesive meaning.

Chunks that are too small lose context; chunks that are too large dilute the embedding's meaning.

Excessive overlap increases storage and can produce duplicate results.

The right chunking strategy depends on the document type — there is no one-size-fits-all.

Metadata must be extracted and kept consistent, which requires a well-built ingestion pipeline.

---

## Relationship to Other Topics

Chunking is the **first step** in the [RAG](#rag-hibrida) pipeline. After fragmenting documents, chunks are transformed into embeddings and stored in [vector databases](#universo-dos-vetores). Chunk size should take into account the [Context Window](#ia-e-modelos) of the model being used. Chunking quality directly impacts [Vector Search](#busca-vetorial) and can be evaluated with [quality metrics](#metricas-qualidade) like Precision and Recall.
