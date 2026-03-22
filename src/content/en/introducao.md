# Introduction: Where Does AI "Intelligence" Come From?

You've probably chatted with ChatGPT, asked Claude to review some code, or watched Copilot complete an entire function. Behind these experiences lies a set of techniques and architectures that turn text into math, math into understanding, and understanding into useful answers.

This guide was created to explain **how all of this works under the hood** — from the fundamentals to the most advanced techniques used in production — in a clear, practical way.

---

## Who is this guide for?

For developers, data engineers, and technical professionals who want to go beyond "prompt engineering" and understand the engineering behind modern AI systems. You don't need to be a Machine Learning expert — but some familiarity with basic programming concepts helps.

---

## What will you learn?

This guide is organized in layers. Each topic builds on the previous one, so reading order matters:

### Layer 1: Fundamentals

- **[AI and Language Models (LLMs)](#ia-e-modelos):** What text-generating models are, how tokens and context windows work, and why AI "hallucinates."
- **[The Vector Universe](#universo-dos-vetores):** How vector databases organize information by meaning, not by keywords.

### Layer 2: Search and Retrieval

- **[Keyword Search (BM25)](#busca-palavra-chave):** The classic text search method — fast, precise for exact terms, but limited in comprehension.
- **[Vector Search](#busca-vetorial):** How to turn text into vectors and find documents through semantic similarity.
- **[Hybrid Search](#busca-hibrida):** Combining BM25 and vector search to eliminate the blind spots of each approach.

### Layer 3: Refinement

- **[Chunking](#chunking):** How to break large documents into pieces that fit within the LLM's context window.
- **[Reciprocal Rank Fusion (RRF)](#reciprocal-rank-fusion):** The algorithm that merges rankings from different search methods into a single list.
- **[Cross-Encoders (Reranking)](#cross-encoders):** Models that reorder results with very high precision by analyzing query and document together.
- **[Quality Metrics](#metricas-qualidade):** How to measure whether your search system is actually working.

### Layer 4: RAG Architecture

- **[RAG (Retrieval-Augmented Generation)](#rag):** The architecture that connects search + LLM to generate answers based on your actual data.
- **[Hybrid RAG](#rag-hibrida):** RAG in production — combining multiple search strategies and reranking.
- **[Context and Prompt Caching](#context-prompt-caching):** Optimizations to reduce latency and cost on repeated calls.

### Layer 5: Advanced Techniques

- **[Advanced Search Techniques](#tecnicas-avancadas-busca):** Query expansion, hypothetical document embeddings (HyDE), and other strategies.
- **[Hyperbolic Embeddings](#hyperbolic-embeddings):** Vector representations in hyperbolic space for data with natural hierarchy.
- **[Graph RAG](#graph-rag):** Combining knowledge graphs with RAG for multi-hop reasoning.
- **[Tenancy and Security Trimming](#tenancy-security-trimming):** How to ensure each user only accesses their own data in a multi-tenant RAG system.

### Layer 6: Agents and Orchestration

- **[Bounded Autonomy](#bounded-autonomy):** Frameworks for giving controlled autonomy to AI agents.
- **[Orchestrator-Worker](#orchestrator-worker):** An architecture pattern where a central agent delegates tasks to specialized agents.
- **[Agentic Adaptive RAG](#agentic-adaptive-rag):** When the agent dynamically decides which search strategy to use.
- **[MCP and A2A Protocols](#protocolos-mcp-a2a):** Communication protocols between models, tools, and agents.

---

## The Big Picture

All of these concepts connect in a flow that, simplified, works like this:

```text
User Question
       |
       v
+-----------------------------+
|  Search (BM25 + Vector)     |  <- Hybrid Search
|  over chunked documents     |  <- Chunking
+-------------+---------------+
              |
              v
+-----------------------------+
|  Reranking (Cross-Encoder)  |  <- Refinement
|  + Fusion (RRF)             |
+-------------+---------------+
              |
              v
+-----------------------------+
|  LLM generates response     |  <- RAG
|  based on the documents     |
+-------------+---------------+
              |
              v
      Grounded Response
```

The ultimate goal is always the same: **give the LLM the right information, in the right format, at the right time** — so it answers with precision instead of making things up.

---

## How to use this guide

- **Sequential reading:** Follow the layer order if you're starting from scratch.
- **Quick reference:** Use the links above to jump straight to the topic you need.
- **Practice:** Each topic includes concrete examples and, when possible, real tools that implement the concept.

Ready to get started? The first step is to understand [the brain behind it all: LLMs](#ia-e-modelos).
