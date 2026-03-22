# Search Quality Metrics

Imagine you're a teacher grading an exam. It's not enough to know whether the student got answers right — you need to know: _"Of the answers they gave, how many are correct?"_ and _"Of all the correct answers possible, how many did they find?"_. That's exactly how we measure search system quality: using **Precision**, **Recall**, and **NDCG**.

---

## 1. Precision: How Many Results Are Relevant?

**Precision** answers the question: _"Of the results the system returned, how many are actually useful?"_

### Formula:

```
Precision = Relevant Results Returned / Total Results Returned
```

### Example:

You search for "refund policy" and the system returns 10 documents. Of those 10, only 6 actually discuss refunds.

```
Precision = 6 / 10 = 0.60 (60%)
```

### Precision@K:

In practice, we measure precision on the **top K** results, because users rarely look beyond the first few. **Precision@5** evaluates only the first 5 returned results.

| Position | Document | Relevant? |
| :------ | :-------- | :--------- |
| 1 | Refund Policy v2 | Yes |
| 2 | Employee Handbook | No |
| 3 | FAQ - Returns | Yes |
| 4 | International Refund Rules | Yes |
| 5 | Product Catalog | No |

```
Precision@5 = 3 / 5 = 0.60 (60%)
```

---

## 2. Recall: How Many Relevant Results Were Found?

**Recall** answers the opposite question: _"Of all the relevant documents that exist in the database, how many did the system manage to find?"_

### Formula:

```
Recall = Relevant Results Returned / Total Relevant in Database
```

### Example:

Your database contains 15 documents about refunds. The system returned 10 results, of which 6 are relevant.

```
Recall = 6 / 15 = 0.40 (40%)
```

The system returned 60% correct results (precision), but only covered 40% of all relevant documents (recall).

---

## 3. The Precision vs. Recall Tradeoff

Precision and Recall are in constant tension:

- **Increase results returned** -> Recall goes up (finds more relevant ones), but Precision drops (more noise).
- **Decrease results returned** -> Precision goes up (less noise), but Recall drops (may miss important documents).

### How to balance them?

| Scenario | Priority | Why |
| :------ | :--------- | :------ |
| Customer support | **Precision** | The user wants the right answer, not 20 options |
| Legal research | **Recall** | You can't afford to miss any relevant document |
| E-commerce | **Balance** | Show relevant products without cluttering the page |
| Enterprise [RAG](#rag-hibrida) | **Precision** | Sending irrelevant chunks to the [LLM](#ia-e-modelos) wastes [tokens](#ia-e-modelos) and can confuse the response |

[Hybrid Search](#busca-hibrida) combined with [Cross-Encoders](#cross-encoders) is one of the most effective strategies for improving both metrics simultaneously: hybrid search maximizes recall and the reranker filters to maximize precision.

---

## 4. NDCG: Order Matters

**NDCG (Normalized Discounted Cumulative Gain)** goes beyond counting hits. It evaluates whether the **most relevant results are in the top positions**.

### Intuition:

Imagine two systems that return the same 5 relevant documents out of 10 results:

- **System A:** The 5 relevant ones are at positions 1, 2, 3, 4, and 5.
- **System B:** The 5 relevant ones are at positions 2, 4, 6, 8, and 10.

Both have Precision@10 = 50% and identical Recall. But **System A** is clearly better — NDCG captures this difference.

### How it works (simplified):

1. Each result receives a relevance score (e.g., 0, 1, 2, or 3).
2. Results in lower positions receive a **logarithmic discount** — the farther from the top, the less it counts.
3. The score is normalized against the "perfect result" (all relevant items at the top).

```
DCG = Sum of (relevance_i / log2(position_i + 1))

NDCG = DCG / ideal_DCG
```

### Numerical example:

| Position | Relevance | Discounted Gain |
| :------ | :--------- | :--------------- |
| 1 | 3 (highly relevant) | 3 / log2(2) = 3.00 |
| 2 | 0 (irrelevant) | 0 / log2(3) = 0.00 |
| 3 | 2 (relevant) | 2 / log2(4) = 1.00 |
| 4 | 3 (highly relevant) | 3 / log2(5) = 1.29 |
| 5 | 1 (slightly relevant) | 1 / log2(6) = 0.39 |

```
DCG = 3.00 + 0.00 + 1.00 + 1.29 + 0.39 = 5.68
```

If the perfect ranking would yield DCG = 8.50:

```
NDCG = 5.68 / 8.50 = 0.668 (66.8%)
```

The 66.8% result indicates the ranking is good but could improve — the second result should have been relevant. [RRF](#reciprocal-rank-fusion) and [Cross-Encoders](#cross-encoders) are techniques that directly improve NDCG by reordering results.

---

## 5. Metrics Summary

| Metric | What It Measures | When to Use | Ideal Score |
| :------ | :--------- | :---------- | :---------- |
| **Precision@K** | % of relevant results in the top K | Evaluate the quality of the first results | 1.0 (100%) |
| **Recall@K** | % of all relevant items that were found | Evaluate search coverage | 1.0 (100%) |
| **NDCG@K** | Ranking quality (order matters) | Evaluate whether the best results are at the top | 1.0 (perfect ranking) |

---

## 6. Advantages and Limitations

Precision and Recall are intuitive and easy to calculate.

NDCG captures ranking quality, not just presence/absence.

Precision@K is the most practical metric for [RAG](#rag-hibrida) systems (only what reaches the LLM matters).

They allow objective comparison of different search strategies.

They require an evaluation set with manually labeled relevance (golden set).

Recall requires knowing the total number of relevant documents in the database — not always feasible.

NDCG with few results can be unstable.

Offline metrics don't always reflect actual user satisfaction.

---

## Relationship to Other Topics

These metrics are used to evaluate and compare all the search techniques discussed in this material: [Vector Search](#busca-vetorial), [Keyword Search](#busca-palavra-chave), [Hybrid Search](#busca-hibrida), [RRF](#reciprocal-rank-fusion), and [Cross-Encoders](#cross-encoders). Techniques like [Query Expansion and HyDE](#tecnicas-avancadas-busca) typically improve Recall, while [Rerankers](#cross-encoders) improve Precision and NDCG. In [RAG](#rag-hibrida) pipelines, Precision@K is especially critical, as each irrelevant chunk consumes [tokens](#ia-e-modelos) and can degrade the response.
