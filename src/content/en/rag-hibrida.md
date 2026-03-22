# Hybrid RAG (Retrieval-Augmented Generation)

If you've ever used ChatGPT and it made up information with total conviction (the infamous ["hallucinations"](#ia-e-modelos)), you understand the problem with pure AIs. **RAG (Retrieval-Augmented Generation)** is the solution.

Think of the AI as a brilliant student taking an exam.

- **Standard AI:** Takes the exam relying solely on memory (which can fail).
- **AI with RAG:** Takes the exam with the textbook open in front of them for reference.

**Hybrid RAG** is when that student uses two different types of indexes to find the right page of the book as quickly as possible.

---

## 1. What makes up Hybrid RAG?

"Simple" RAG typically uses only Vector Search. **Hybrid RAG** combines the best of everything we've discussed:

1.  **Sparse Search (BM25):** To find exact terms, product names, or technical codes.
2.  **Dense Search (Vector):** To understand the intent and context behind the user's question.
3.  **Fusion (RRF):** To balance the results from these two searches.
4.  **Reranking:** To ensure the most relevant information is at the top before sending it to the AI.

---

## 2. The Pipeline

For those who aren't technical, the process seems like magic, but it follows these 4 logical steps:

### Step 1: The Query

The user asks a question: _"What is the refund policy for electronics purchased on sale?"_

### Step 2: Hybrid Retrieval

The system doesn't try to answer right away. It runs against the database and performs two simultaneous searches:

- **Keyword Search:** Looks for "refund," "electronics," and "sale."
- **Semantic Search:** Looks for documents that discuss returning money and purchase rules.

### Step 3: Quality Filter (RRF + Reranker)

The results are merged by **RRF** and then the **Reranker** (the specialist) examines the top 5 paragraphs found and determines which ones actually answer the question.

### Step 4: Response Generation

The system sends the AI (such as GPT-4 or Claude — see [AI and Models](#ia-e-modelos)) the following instruction: _"Here are the company's rules [Document Text]. Based only on this, answer the user: [Question]"_.

---

## 3. Why is Hybrid RAG superior?

| Criterion           | Pure AI (No RAG)            | Simple RAG (Vectors Only)            | Hybrid RAG                                       |
| :----------------- | :--------------------------- | :---------------------------------- | :------------------------------------------------ |
| **Reliability** | Low (hallucination-prone).       | Medium (can miss technical terms). | **Very high** (grounded in facts and exact terms). |
| **Updates**    | Requires retraining. | Just update the documents.      | **Just update the documents.**                |
| **Accuracy**       | N/A                          | Good for general concepts.          | **Excellent for complex cases.**               |
| **Cost**          | Very expensive (training).     | Low.                              | Moderate (but highly efficient).                   |

---

## 4. Business Advantages

- **No More Hallucinations:** The AI only answers based on what's in your documents. If it can't find the answer, it will say "I don't know."
- **Data Security:** You can control which documents the AI can access, ensuring private information doesn't leak.
- **Source Citations:** RAG allows the AI to say: _"According to paragraph 4 of the technical manual..."_, giving much more credibility.

---

## Conclusion

**Hybrid RAG** is the state-of-the-art architecture for any company that wants to use AI professionally. It transforms a generic language model into a deep specialist on **your** data, combining the intuition of vector search with the precision of keyword search. To make this work, your documents go through [Chunking](#chunking) before being indexed, and result quality can be measured with [metrics like Precision and NDCG](#metricas-qualidade).
