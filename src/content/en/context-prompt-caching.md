# Context & Prompt Caching

Every time you send a message to an LLM, the model needs to process **the entire context** from scratch — the system prompt, the examples, the RAG documents, the conversation history. If your system prompt has 4,000 tokens and you make 100 calls, the model processed 400,000 tokens of identical content. **Prompt Caching** solves this: the provider stores the processing result of repeated prefixes, eliminating recomputation and reducing cost and latency.

---

## 1. The problem — Massive redundancy

In a typical RAG pipeline, each LLM call includes:

```
┌─────────────────────────────────────────┐
│ System prompt (~2,000 tokens)       ← repeated 100%
│ Few-shot examples (~3,000 tokens)   ← repeated 100%
│ RAG documents (~5,000 tokens)       ← varies per query
│ User question (~50 tokens)          ← unique
└─────────────────────────────────────────┘
Total: ~10,050 tokens per call
```

Without caching, **5,000+ tokens are reprocessed identically** on every call. At Claude input costs ($3/M tokens for Sonnet), 1 million calls with 5K redundant tokens = **$15,000 thrown away**.

---

## 2. How does Prompt Caching work?

### The prefix concept

LLMs process tokens sequentially. Prompt Caching stores the model's **internal state** (KV cache) after processing a prefix of tokens, so that future calls with the same prefix skip straight to the new part.

```
Call 1:
[System prompt | Examples | RAG Docs | Question A]
 ──────── prefix (cached) ────────   ── new ──

Call 2:
[System prompt | Examples | RAG Docs | Question B]
 ──────── prefix (cache hit!) ─────   ── new ──
 ↑ Skips all this processing
```

### What is stored

It's not the text that is cached — it's the **KV cache**, the internal representation that the model builds when processing the tokens. This is significantly larger than the text itself (which is why the cache has limits and a TTL).

---

## 3. Implementation by provider

### Anthropic (Claude)

The Claude API supports explicit prompt caching with `cache_control`:

```json
{
  "model": "claude-sonnet-4-20250514",
  "system": [
    {
      "type": "text",
      "text": "You are a specialized technical assistant...",
      "cache_control": { "type": "ephemeral" }
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "<documents>...5000 tokens of context...</documents>",
          "cache_control": { "type": "ephemeral" }
        },
        {
          "type": "text",
          "text": "What is the refund policy?"
        }
      ]
    }
  ]
}
```

**Rules:**
- Minimum of **1,024 tokens** to activate cache (2,048 for Haiku)
- Cache has a **TTL of 5 minutes** (renewed on each hit)
- Up to **4 cache breakpoints** per request
- **Cache write:** 25% more expensive than normal input
- **Cache read:** 90% cheaper than normal input

### OpenAI (GPT)

OpenAI implements prompt caching **automatically** — no explicit markup needed:

- Long identical prefixes are cached automatically
- Cache hit: **50% discount** on input price
- Minimum of **1,024 tokens** prefix
- Works only with exact prefixes (byte-level match)

### Google (Gemini)

Gemini uses **Context Caching** with explicit control and configurable TTL:

- You create a "cached content" with a defined TTL (minutes to hours)
- Reference that cache in subsequent calls
- Charged for storage (per hour) + input discount

---

## 4. Optimization strategies

### Context ordering

The golden rule: **put stable content at the beginning, variable content at the end.**

```
✅ Good ordering (maximizes cache hit):
[System prompt] → [Few-shots] → [Base docs] → [Dynamic docs] → [Question]
 ─── stable ─────────────────────────────   ── varies ────────────────

❌ Bad ordering (invalidates cache):
[Question] → [System prompt] → [Few-shots] → [Docs]
 ── varies ─   ─── stable (but never cached because it's not a prefix) ───
```

### Layered caching

For RAG pipelines, structure the cache in levels:

```
Level 1 (cache hit ~100%): System prompt + few-shots
Level 2 (cache hit ~80%):  + domain base documentation
Level 3 (cache hit ~40%):  + RAG documents per session
Level 4 (no cache):        User question
```

### Multi-turn conversations

In chatbots, conversation history grows with each turn. Natural prefix caching ensures that previous turns are not reprocessed:

```
Turn 1: [System | User1 | Assistant1]
Turn 2: [System | User1 | Assistant1 | User2 | Assistant2]
         ────── cached prefix ──────
Turn 3: [System | User1 | Assistant1 | User2 | Assistant2 | User3]
         ──────────── cached prefix ──────────────────
```

---

## 5. Impact on cost and latency

### Cost

| Scenario | Without cache | With cache | Savings |
| :--- | :--- | :--- | :--- |
| 10K calls, 4K static tokens (Claude) | $120 | $16 | **87%** |
| 50K calls, 8K static tokens (Claude) | $1,200 | $168 | **86%** |
| Chatbot, 20 avg turns (GPT) | $500 | $275 | **45%** |

### Latency

The latency gain comes from the model not needing to compute the KV cache for the cached tokens:

| Cached prefix size | Latency reduction (TTFT) |
| :--- | :--- |
| 1K-5K tokens | ~100-300ms |
| 10K-50K tokens | ~500ms-2s |
| 100K+ tokens | ~2-5s |

For applications using huge contexts (long documents, entire codebases), the latency gain is just as important as the cost savings.

---

## 6. Concrete Example — Chatbot with Knowledge Base

```python
# Stable context (cacheable)
system_prompt = "You are the assistant for FinTech XYZ..."  # ~500 tokens
product_docs = load_product_documentation()                # ~8,000 tokens
faq_database = load_faq()                                  # ~3,000 tokens

# For each user question
def answer(user_question, retrieved_docs):
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        system=[{
            "type": "text",
            "text": system_prompt,
            "cache_control": {"type": "ephemeral"}
        }],
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"{product_docs}\n{faq_database}",
                    "cache_control": {"type": "ephemeral"}  # 11.5K tokens cached
                },
                {
                    "type": "text",
                    "text": f"Context: {retrieved_docs}\n\nQuestion: {user_question}"
                }
            ]
        }]
    )
    return response
```

On the first call, you pay the cache write (25% extra). On the next 99 calls (within 5 min), you pay 90% less on the 11.5K cached tokens. **Result: ~85% savings on input.**

---

## 7. Advantages and Limitations

**Significant savings:** 50-90% reduction in input cost for repetitive workloads.

**Latency reduction:** TTFT (time to first token) drastically lower for long contexts.

**Transparent:** Does not change response quality — the output is mathematically identical.

**Simple to implement:** In most cases, you just need to reorder the context and add cache markers.

**Short TTL:** Cache expires in minutes (Anthropic: 5 min). Workloads with sporadic traffic may not benefit.

**Exact prefix:** Any change in the prefix invalidates the cache. A single different token = complete cache miss.

**Write cost:** The first call is more expensive (cache write). For one-off calls, caching is counterproductive.

**Minimum size:** Prefixes shorter than 1,024 tokens are not cacheable.

---

## Conclusion

Prompt Caching is one of the optimizations with the best cost-benefit ratio in LLM applications. The rule is simple: **the more stable context you repeat across calls, the more you save**. For RAG pipelines, chatbots, and any application that uses long system prompts or fixed knowledge bases, caching transforms prohibitive costs into viable ones. The main discipline is keeping stable content as a prefix — which in practice means thinking about the order of your context as an architectural decision.
