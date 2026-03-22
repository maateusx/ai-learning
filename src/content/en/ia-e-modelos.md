# AI and Large Language Models (LLMs)

Imagine a student who has read the entire internet — books, articles, forums, code — and can now write fluently about any subject. That's what an **LLM (Large Language Model)** is. It's the brain behind tools like ChatGPT, Claude, and Llama, and it's the component that generates the final answers in [RAG](#rag-hibrida) systems.

---

## 1. What is an LLM?

A **Large Language Model** is a neural network trained on billions of texts to predict the next word in a sequence. By doing this trillions of times, the model "learns" grammar, facts, logical reasoning, and even cultural nuances.

### How does it generate text?

The process is surprisingly simple at its core:

1. You send a text (the **prompt**).
2. The model calculates the probability of each possible word being the next one.
3. It picks a word and repeats the process until the response is complete.

It's like your phone's autocomplete, but with billions of parameters instead of hundreds.

---

## 2. Tokens: The AI's Unit of Thought

LLMs don't read letters or words — they read **tokens**. A token is a fragment of text that the model uses as its basic unit of processing.

### Tokenization examples:

| Original Text | Tokens (approximate) |
| :------------- | :------------------ |
| "Artificial Intelligence" | `["Art", "ificial", " Intelligence"]` |
| "Hello World" | `["Hello", " World"]` |
| "ChatGPT is amazing" | `["Chat", "GPT", " is", " amazing"]` |

### Rule of thumb:

- **In English:** 1 token is roughly 3/4 of a word (1,000 tokens ~ 750 words).
- **In Portuguese:** Tokens tend to be shorter due to accents and conjugations, so 1,000 tokens ~ 600-650 words.

Tokens are the "currency" of AI — you pay per token consumed, and the processing limit is measured in tokens.

---

## 3. Context Window: Short-Term Memory

The **Context Window** is the maximum number of tokens a model can process at once. Think of it as the student's desk: everything they need to reference has to fit on that desk.

| Model | Context Window |
| :----- | :------------- |
| GPT-3.5 | 4,096 tokens (~3,000 words) |
| GPT-4 | 128,000 tokens (~96,000 words) |
| Claude 3.5 Sonnet | 200,000 tokens (~150,000 words) |
| Llama 3 | 8,192 tokens (~6,000 words) |

### Why does this matter?

The context window needs to fit **all of the following at once**:

1. The system instructions (system prompt).
2. The documents retrieved by search (the "chunks" — see [Chunking](#chunking)).
3. The user's question.
4. The response the AI will generate.

If the documents are too large, they won't fit in the window. That's why [Chunking](#chunking) and the quality of [Vector Search](#busca-vetorial) are so important — we need to deliver only the most relevant pieces.

---

## 4. Hallucinations: When the AI Makes Things Up

A **Hallucination** is when the model generates information that sounds true, is written with complete confidence, but is entirely false.

### Why does this happen?

An LLM is a probabilistic model — it generates the most **likely** sequence of words, not necessarily the most **truthful** one. When it lacks the correct information, it "fills in the gap" with something statistically plausible.

### Classic examples:

- Inventing citations from academic papers that don't exist.
- Making up function names for libraries that were never implemented.
- Stating dates, numbers, or facts with total conviction — and being wrong.

### How does RAG reduce hallucinations?

[RAG (Retrieval-Augmented Generation)](#rag-hibrida) is the primary weapon against hallucinations. Instead of relying on the model's "memory," the system:

1. **Searches** for real documents in your database.
2. **Provides** those documents as context within the context window.
3. **Instructs** the model: _"Answer only based on the provided documents."_

This transforms the AI from a "student relying on memory" into a "student with the textbook open."

---

## 5. Major Models

| Model | Developer | Highlights | Open Source? |
| :----- | :------------ | :-------- | :----------- |
| GPT-4 | OpenAI | Advanced reasoning, multimodal | No |
| Claude | Anthropic | Massive context window, safety-focused | No |
| Llama 3 | Meta | Best open-source model | Yes |
| Gemini | Google | Integration with Google ecosystem | No |
| Mistral | Mistral AI | Lightweight and efficient | Yes |

---

## 6. Advantages and Limitations

Capable of understanding and generating natural language text with high fluency.

Versatile — the same model can summarize, translate, code, and reason.

Combined with [RAG](#rag-hibrida), it can become an expert on your data.

Hallucinations are unavoidable without grounding mechanisms (like RAG).

Cost scales with the number of tokens processed.

Context Window limits the amount of information processed at once.

No access to real-time information (unless connected to external tools).

---

## Relationship to Other Topics

LLMs are the **generation** component in [RAG](#rag-hibrida) pipelines. But without a solid retrieval strategy — using [Vector Search](#busca-vetorial), [Hybrid Search](#busca-hibrida), and [Reranking](#cross-encoders) — the AI doesn't receive the right documents, and response quality plummets. Understanding tokens and context windows is also essential for defining your [Chunking](#chunking) strategy.
