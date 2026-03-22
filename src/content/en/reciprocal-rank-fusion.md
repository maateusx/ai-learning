# RRF (Reciprocal Rank Fusion)

In a modern search system, we often use more than one method to find what the user wants. But how do you decide whether the top result from the "AI Search" is better than the top result from the "Keyword Search"?

This is where **RRF** comes in — a simple yet brilliant algorithm for combining different rankings into a single, high-quality final list.

## 1. The Comparison Problem

Imagine you have two judges evaluating a competition:

- **Judge A (BM25):** Gives scores from 0 to 100 based on word frequency.
- **Judge B (Vector):** Gives scores from 0.0 to 1.0 based on mathematical similarity.

How do you add 85 keyword points to 0.92 vector similarity? **You don't.** The scales are too different. RRF ignores the "score" and looks only at the **position (rank)** each item holds in each judge's list.

---

## 2. How does RRF work?

The logic behind RRF is: **"The higher an item appears across multiple lists, the more relevant it probably is."**

It applies a penalty based on position. First place gets a lot of weight; 100th place gets almost none. If a document ranks well in _all_ lists, it rises to the top of the final list.

### The Mathematical Formula

The beauty of RRF lies in its simplicity. The score for a document $d$ is calculated as:

$$RRFscore(d) = \sum_{r \in R} \frac{1}{k + r(d)}$$

> **Where:**
>
> - $R$ is the set of result lists (e.g., one from vector search and one from BM25).
> - $r(d)$ is the position (rank) of the document in that specific list (1st, 2nd, 3rd...).
> - $k$ is a constant (typically **60**) that prevents the top results from having disproportionately higher weight than the rest, ensuring stability.

---

## 3. A Practical Example

Imagine we search for "How to change a tire":

- **In BM25 Search:** The document "Tire" came in **1st place**.
- **In Vector Search:** The same document "Tire" came in **3rd place**.

**The calculation (using $k=60$):**

1.  From BM25 Search: $\frac{1}{60 + 1} = 0.01639$
2.  From Vector Search: $\frac{1}{60 + 3} = 0.01587$
3.  **Final RRF Score:** $0.01639 + 0.01587 = \mathbf{0.03226}$

Now, a document that appeared in 1st place in only one list but was absent from the other would have a lower score (just $0.01639$), ranking below the document that pleased both "judges."

---

## 4. Why use RRF?

There are three main reasons that make RRF the gold standard for **Hybrid Search**:

1.  **No normalization needed:** You don't need to convert scores from different models into a common scale. Ranking is the only thing that matters.
2.  **Robustness:** It prevents any single model from "taking control" of the result. If vector search returns something completely irrelevant but with a high score, RRF helps filter it out if keyword search disagrees.
3.  **Technical simplicity:** It's extremely easy to implement in any database or backend (Node.js, Python, Go, etc.).

---

## 5. When does RRF come into play?

RRF is the final component of what we call **Hybrid Search**. The complete flow is:

1.  The user types their question.
2.  The system runs **BM25** (Keywords).
3.  The system runs **Vector Search** (Context/AI).
4.  **RRF** takes the Top 100 from each and produces the **Definitive List**.

---

## Conclusion

RRF proves that sometimes the best solution for complex AI problems is a simple mathematical ranking formula. It ensures the user gets the best of both worlds: the technical precision of keywords and the deep understanding of context.
