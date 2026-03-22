# Keyword Search (Sparse Retrieval / BM25)

If vector search (which we covered earlier) is like a librarian who understands the "feeling" behind your request, **Keyword Search** is like the index at the back of a technical book. It's straightforward, based on exact occurrences, and extremely efficient at finding specific terms.

## 1. What is Sparse Retrieval?

The term "Sparse" comes from mathematics. Imagine a table where the columns are **every word that exists** in a language and the rows are your documents.

For a document that says _"The cat climbed on the roof"_, almost all columns in the table will be empty (zero), except the columns for "cat", "climbed", and "roof". Since the vast majority of cells are zero, we call this a **Sparse Matrix**.

---

## 2. The BM25 Algorithm: The King of Search

**BM25** (_Best Matching 25_) is the evolution of the classic TF-IDF. It's the algorithm that decides which document is most relevant for a query. It doesn't try to "understand" the text — instead, it calculates the statistical importance of words.

### How does it calculate the ranking?

BM25 looks at three main factors:

1.  **Term Frequency (TF):** If a word appears many times in a document, it's probably important. _However_, BM25 is smart: it knows that a document with 100 mentions of the word "computer" isn't necessarily 100 times better than one with 10 mentions. It applies a "saturation" function.
2.  **Inverse Document Frequency (IDF):** Common words like "the", "and", "of" carry little weight. Rare words like "photosynthesis" or "cryptography" are worth much more for ranking.
3.  **Document Length:** If a 500-page book mentions "AI" 5 times, and a tweet mentions "AI" 5 times, the tweet is probably much more focused on the topic. BM25 normalizes the score based on text length.

The simplified scoring formula for a document $D$ and a query $Q$ is:

$$score(D, Q) = \sum_{q \in Q} IDF(q) \cdot \frac{f(q, D) \cdot (k_1 + 1)}{f(q, D) + k_1 \cdot (1 - b + b \cdot \frac{|D|}{avgdl})}$$

> **Where:**
>
> - $f(q, D)$ is the frequency of the word in the document.
> - $|D|$ is the length of the current document.
> - $avgdl$ is the average length of all documents.
> - $k_1$ and $b$ are tuning constants (industry defaults).

---

## 3. Why is it still essential?

With the rise of Vector Search (AI), many thought BM25 would die. Quite the opposite! It shines where AI struggles:

- **Technical Terms and IDs:** If you search for an error code like `ERR_CONNECTION_REFUSED` or a product SKU `XYZ-123`, vector search might get confused trying to interpret the "meaning," while BM25 finds the exact term instantly.
- **Speed and Cost:** It's orders of magnitude cheaper and faster to process than heavy language models.
- **Transparency:** You can explain exactly why a result appeared (e.g., "This document contains the word X three times").

---

## 4. Quick Comparison

| Sparse Search (BM25)                | Dense Search (Vector)         |
| :---------------------------------- | :----------------------------- |
| Finds **exact words**.       | Finds **meanings**.     |
| Great for proper nouns and acronyms. | Great for natural language questions. |
| Low memory/CPU consumption.       | Requires GPUs and vector databases. |
| "What is written?"               | "What does the user mean?"  |

---

## 5. The Best of Both Worlds: Hybrid Search

Today, the most modern search systems (like those used in large e-commerce platforms and technical documentation) use **Hybrid Search**.

They run **BM25** to ensure that exact terms aren't missed and **Vector Search** to capture intent. Then, they combine the results using a technique called **RRF (Reciprocal Rank Fusion)** to deliver the best possible ranking to the user.

---

## Conclusion

Sparse Search with BM25 is the solid foundation upon which the web was built. Even in the era of generative AI, understanding how terms are statistically distributed across your data is the first step toward building any efficient information retrieval system.
