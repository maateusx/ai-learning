# Hybrid Search

We've already seen that **Keyword Search (BM25)** excels at finding exact terms, and that **Vector Search** excels at understanding user intent. But what if we could use both at the same time? That's the idea behind **Hybrid Search**: combining the best of both worlds to deliver far more complete and relevant results.

## 1. Why Combine?

Each search method has blind spots:

- **BM25 alone:** If the user searches for _"how to stop my app from crashing"_, BM25 looks for the literal words. It might not find an article titled _"Exception Handling in Mobile Applications"_, which is exactly what the user needs.
- **Vector Search alone:** If the user searches for the error code `SIGKILL_9`, vector search might try to "understand the meaning" and return generic articles about process signals, missing the document that mentions the exact code.

Hybrid Search eliminates these blind spots by running **both searches in parallel** and combining their results.

---

## 2. How does it work in practice?

The Hybrid Search flow follows four steps:

1.  **Receive the query:** The user types their question or search term.
2.  **Execute in parallel:**
    - **BM25** scans the text index and returns its Top-N results with statistical scores.
    - **Vector Search** compares the query embedding against the database vectors and returns its Top-N results with similarity scores.
3.  **Merge the rankings:** A fusion algorithm (like **RRF — Reciprocal Rank Fusion**) combines the two lists into a single final ranking. It doesn't try to add scores from different scales; instead, it uses the **position** of each result in each list.
4.  **Deliver to the user:** The final, reranked list is presented as the result.

```
User Query
       |
       +------------------+
       v                  v
   [ BM25 ]        [ Vector ]
   Top-N results   Top-N results
       |                  |
       +--------+---------+
                v
         [ Fusion (RRF) ]
                |
                v
        Unified Final List
```

---

## 3. Why not just add the scores together?

This is a common mistake. The scores from each method live on **completely different scales**:

| Method   | Typical Scale | What It Means                   |
| :------- | :------------ | :-------------------------------- |
| BM25     | 0 to ~50+      | Statistical term relevance  |
| Vector | 0.0 to 1.0     | Cosine similarity in vector space |

Adding 42.5 (BM25) to 0.87 (vector) makes no sense — BM25 would completely dominate the result. That's why we use **ranking-based** techniques (like RRF) instead of absolute scores.

---

## 4. A Concrete Example

Imagine a technical documentation knowledge base. The user searches: _"database connection timeout"_.

**BM25 Results (exact terms):**

| Position | Document                                       |
| :------ | :---------------------------------------------- |
| 1st      | "Configuring Connection Timeout in PostgreSQL" |
| 2nd      | "Connection Pool Timeout Parameters"      |
| 3rd      | "Error Logs: connection timeout"              |

**Vector Search Results (semantic):**

| Position | Document                                       |
| :------ | :---------------------------------------------- |
| 1st      | "Troubleshooting Database Latency Issues" |
| 2nd      | "Configuring Connection Timeout in PostgreSQL" |
| 3rd      | "How to Handle Slow Connections in Production"    |

**After RRF fusion:**

| Position | Document                                       | Why It Ranked Higher?                   |
| :------ | :---------------------------------------------- | :------------------------------- |
| 1st      | "Configuring Connection Timeout in PostgreSQL" | 1st in BM25 + 2nd in Vector      |
| 2nd      | "Troubleshooting Database Latency Issues" | 1st in Vector (strong semantic match) |
| 3rd      | "Connection Pool Timeout Parameters"      | 2nd in BM25 (exact term match)         |

The document that ranked well in **both** lists rose to the top — that's the power of the hybrid approach.

---

## 5. Where is Hybrid Search used?

Hybrid Search has become the **industry standard** for [RAG (Retrieval-Augmented Generation)](#rag-hibrida) systems:

- **Knowledge-base chatbots:** The chatbot needs to find the exact documentation excerpt (BM25) and also understand questions phrased in different ways (vector).
- **E-commerce:** Search by exact SKU `NKE-AF1-42` (BM25) and also by _"classic white sneakers"_ (vector).
- **Technical documentation:** Find the error code `ERR_CERT_AUTHORITY_INVALID` (BM25) and also _"my website says it's not secure"_ (vector).

### Tools with native support

Several databases and platforms already offer Hybrid Search as a built-in feature:

- **Weaviate:** The `alpha` parameter controls the weight between BM25 and vector.
- **Elasticsearch:** Combines `match` queries (BM25) with `knn` (vector) via `sub_searches`.
- **Pinecone:** Supports sparse + dense vectors in a single index.
- **Supabase:** Combines `tsvector` (full-text) with `pgvector` (embeddings) in PostgreSQL.

---

## 6. Advantages and Limitations

**Complete coverage:** Captures both exact terms and semantic intent.

**Robustness:** If one method fails to find something, the other compensates.

**Industry standard:** Widely supported by modern vector databases.

**Measurable improvement:** Studies show consistent relevance gains over any single method.

**Greater complexity:** Two indexes to maintain (text + vector), more infrastructure and cost.

**Latency:** Two parallel searches + fusion take more time than a single search.

**Tuning:** The ideal proportion between methods can vary by domain and requires experimentation.

---

## Conclusion

Hybrid Search is the practical recognition that no single search method is perfect on its own. By combining the literal precision of BM25 with the semantic understanding of Vector Search, we create systems that understand both _what the user typed_ and _what they meant_. It is the foundation upon which more advanced techniques — like **RRF** for fusion and **Cross-Encoders** for reranking — build even better results.
