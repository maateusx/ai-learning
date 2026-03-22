# Advanced Search Techniques

When you ask a question to a [RAG](#rag-hibrida) system, the quality of the answer depends directly on the quality of the retrieved documents. But what if your question is short, vague, or ambiguous? Techniques like **Query Expansion** and **HyDE** reformulate the question before searching, ensuring the system finds the best results even when the user doesn't know exactly how to ask.

---

## 1. Query Expansion: Broadening the Search

**Query Expansion** is the technique of rewriting or enriching the user's question before sending it to the search engine. The goal is to cover more variations of the same concept.

### How does it work?

1. The user types a short question: _"flat tire"_.
2. The system uses an [LLM](#ia-e-modelos) to expand it: _"tire change, wheel maintenance, automotive rubber, spare tire, tire pressure"_.
3. The search is performed with the expanded query, increasing the chances of finding relevant documents.

### Types of expansion:

| Type | Description | Example |
| :--- | :-------- | :------ |
| **Synonyms** | Adds words with the same meaning | "car" -> "car, automobile, vehicle" |
| **Related terms** | Adds adjacent concepts | "diabetes" -> "diabetes, blood sugar, insulin, glycated hemoglobin" |
| **Multi-query** | Generates N different versions of the same question | "How does RAG work?" -> 3 distinct reformulations |
| **Step-back** | Generalizes the question to search for broader concepts | "What is the speed of the F-22?" -> "What are the specifications of military aircraft?" |

### Practical example with Multi-query:

```python
# Original question
query = "How to reduce costs with AI?"

# LLM generates 3 variations
expanded_queries = [
    "How to reduce costs with AI?",
    "Strategies for lowering expenses in artificial intelligence projects",
    "Budget optimization for machine learning model deployment"
]

# Vector search is performed for EACH variation
# Results are combined and deduplicated
```

This multi-query approach is especially effective with [Hybrid Search](#busca-hibrida), as each variation can capture different documents in both the semantic and keyword searches.

---

## 2. HyDE (Hypothetical Document Embeddings)

**HyDE** is an ingenious technique that flips the search logic on its head. Instead of searching directly with the question, the system first **generates a hypothetical answer** and then searches for documents similar to that answer.

### Why does this work?

The problem: the vector of a **short question** is usually far from the vector of an **answer paragraph**, even if they're about the same topic. Questions and answers have very different linguistic structures.

The HyDE solution:

1. The user asks: _"What is the vacation policy?"_
2. The [LLM](#ia-e-modelos) generates a hypothetical answer (it can be inaccurate — that doesn't matter):
   > _"The company offers 30 days of vacation per year, which can be split into up to 3 periods..."_
3. This hypothetical answer is transformed into a vector (embedding).
4. [Vector Search](#busca-vetorial) uses this vector to find real, similar documents.

### Why does a fake answer work?

Because the embedding of the hypothetical answer will be in the same vector "neighborhood" as the real documents on the topic. [ANN](#universo-dos-vetores) finds the nearest neighbors to that vector — and those neighbors are the real documents.

```python
# Step 1: Generate hypothetical document
hypothetical_answer = llm.generate(
    f"Provide a detailed answer: {user_question}"
)

# Step 2: Generate embedding from the answer (not the question!)
hyde_embedding = embedding_model.encode(hypothetical_answer)

# Step 3: Search for real documents similar to the hypothetical answer
results = vector_db.query(
    query_embedding=hyde_embedding,
    top_k=5
)
```

---

## 3. Comparison

| Criterion | Simple Search | Query Expansion | HyDE |
| :------- | :------------ | :-------------- | :--- |
| **Complexity** | Low | Medium | High |
| **Cost** | 1 embedding call | 1 LLM call + N searches | 1 LLM call + 1 search |
| **Short questions** | Weak | Good | Excellent |
| **Specific questions** | Good | Good | Can introduce noise |
| **Latency** | Low | Medium (N searches) | Medium (generation + search) |

---

## 4. When to Use Each Technique?

- **Query Expansion (Multi-query):** When users ask generic questions and you want to maximize recall (finding as many relevant documents as possible). Works very well with [Hybrid Search](#busca-hibrida) and [RRF](#reciprocal-rank-fusion).

- **HyDE:** When questions are very short (1-3 words) and simple search doesn't return good results. Ideal for FAQ and customer support scenarios.

- **Both combined:** In high-performance [RAG](#rag-hibrida) pipelines, you can use query expansion to generate variations and HyDE for one of them, then combine all results.

---

## 5. Advantages and Limitations

Query Expansion significantly increases recall without changing the search infrastructure.

HyDE drastically improves quality for short and ambiguous questions.

Both techniques are compatible with any [vector database](#universo-dos-vetores).

Multi-query naturally benefits from [result fusion (RRF)](#reciprocal-rank-fusion).

Both add latency (extra calls to the [LLM](#ia-e-modelos)).

HyDE can introduce noise if the hypothetical answer is too different from reality.

Query Expansion with too many variations multiplies search costs.

They require an LLM available at query time, increasing system dependencies.

---

## Relationship to Other Topics

These techniques sit between the user's question and the search engine in the [RAG](#rag-hibrida) pipeline. They improve the input to [Vector Search](#busca-vetorial) and [Hybrid Search](#busca-hibrida), resulting in more relevant documents before [Reranking](#cross-encoders) even takes place. The effectiveness of these techniques can be measured by comparing [Precision and Recall](#metricas-qualidade) before and after their application.
