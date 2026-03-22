# Context & Prompt Caching

Toda vez que você envia uma mensagem para um LLM, o modelo precisa processar **todo o contexto** do zero — o system prompt, os exemplos, os documentos do RAG, o histórico de conversa. Se o seu system prompt tem 4.000 tokens e você faz 100 chamadas, o modelo processou 400.000 tokens de conteúdo idêntico. **Prompt Caching** resolve isso: o provedor armazena o resultado do processamento de prefixos repetidos, eliminando recomputação e reduzindo custo e latência.

---

## 1. O problema — Redundância massiva

Em um pipeline de RAG típico, cada chamada ao LLM inclui:

```
┌─────────────────────────────────────────┐
│ System prompt (~2.000 tokens)       ← repetido 100%
│ Few-shot examples (~3.000 tokens)   ← repetido 100%
│ Documentos do RAG (~5.000 tokens)   ← varia por query
│ Pergunta do usuário (~50 tokens)    ← única
└─────────────────────────────────────────┘
Total: ~10.050 tokens por chamada
```

Sem cache, **5.000+ tokens são reprocessados identicamente** em toda chamada. A custos de input do Claude ($3/M tokens para Sonnet), 1 milhão de chamadas com 5K tokens redundantes = **$15.000 jogados fora**.

---

## 2. Como funciona o Prompt Caching?

### O conceito de prefixo

Os LLMs processam tokens sequencialmente. O Prompt Caching armazena o **estado interno do modelo** (KV cache) após processar um prefixo de tokens, para que chamadas futuras com o mesmo prefixo pulem direto para a parte nova.

```
Chamada 1:
[System prompt | Exemplos | Docs RAG | Pergunta A]
 ──────── prefixo (cached) ────────   ── novo ──

Chamada 2:
[System prompt | Exemplos | Docs RAG | Pergunta B]
 ──────── prefixo (cache hit!) ─────   ── novo ──
 ↑ Pula todo este processamento
```

### O que é armazenado

Não é o texto que é cacheado — é o **KV cache**, a representação interna que o modelo constrói ao processar os tokens. Isso é significativamente maior que o texto em si (por isso o cache tem limites e TTL).

---

## 3. Implementação por provedor

### Anthropic (Claude)

A API do Claude suporta prompt caching explícito com `cache_control`:

```json
{
  "model": "claude-sonnet-4-20250514",
  "system": [
    {
      "type": "text",
      "text": "Você é um assistente técnico especializado...",
      "cache_control": { "type": "ephemeral" }
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "<documents>...5000 tokens de contexto...</documents>",
          "cache_control": { "type": "ephemeral" }
        },
        {
          "type": "text",
          "text": "Qual é a política de reembolso?"
        }
      ]
    }
  ]
}
```

**Regras:**
- Mínimo de **1.024 tokens** para ativar cache (2.048 para Haiku)
- Cache tem **TTL de 5 minutos** (renovado a cada hit)
- Até **4 breakpoints** de cache por request
- **Cache write:** 25% mais caro que input normal
- **Cache read:** 90% mais barato que input normal

### OpenAI (GPT)

A OpenAI implementa prompt caching **automaticamente** — sem necessidade de marcação explícita:

- Prefixos longos idênticos são cacheados automaticamente
- Cache hit: **50% de desconto** no preço de input
- Mínimo de **1.024 tokens** de prefixo
- Funciona apenas com prefixos exatos (byte-level match)

### Google (Gemini)

O Gemini usa **Context Caching** com controle explícito e TTL configurável:

- Você cria um "cached content" com TTL definido (minutos a horas)
- Referencia esse cache em chamadas subsequentes
- Cobrado por armazenamento (por hora) + desconto no input

---

## 4. Estratégias de otimização

### Ordenação do contexto

A regra de ouro: **coloque o conteúdo estável no início, o variável no final.**

```
✅ Boa ordenação (maximiza cache hit):
[System prompt] → [Few-shots] → [Docs base] → [Docs dinâmicos] → [Pergunta]
 ─── estável ──────────────────────────────   ── varia ──────────────────

❌ Má ordenação (invalida cache):
[Pergunta] → [System prompt] → [Few-shots] → [Docs]
 ── varia ─   ─── estável (mas nunca cacheado porque não é prefixo) ───
```

### Cache em camadas

Para pipelines de RAG, estruture o cache em níveis:

```
Nível 1 (cache hit ~100%): System prompt + few-shots
Nível 2 (cache hit ~80%):  + documentação base do domínio
Nível 3 (cache hit ~40%):  + documentos do RAG por sessão
Nível 4 (sem cache):       Pergunta do usuário
```

### Conversas multi-turn

Em chatbots, o histórico de conversa cresce a cada turno. O caching natural do prefixo garante que turnos anteriores não são reprocessados:

```
Turn 1: [System | User1 | Assistant1]
Turn 2: [System | User1 | Assistant1 | User2 | Assistant2]
         ────── prefixo cacheado ──────
Turn 3: [System | User1 | Assistant1 | User2 | Assistant2 | User3]
         ──────────── prefixo cacheado ────────────────────
```

---

## 5. Impacto em custo e latência

### Custo

| Cenário | Sem cache | Com cache | Economia |
| :--- | :--- | :--- | :--- |
| 10K chamadas, 4K tokens estáticos (Claude) | $120 | $16 | **87%** |
| 50K chamadas, 8K tokens estáticos (Claude) | $1.200 | $168 | **86%** |
| Chatbot, 20 turns médios (GPT) | $500 | $275 | **45%** |

### Latência

O ganho de latência vem do modelo não precisar computar o KV cache para os tokens cacheados:

| Tamanho do prefixo cacheado | Redução de latência (TTFT) |
| :--- | :--- |
| 1K-5K tokens | ~100-300ms |
| 10K-50K tokens | ~500ms-2s |
| 100K+ tokens | ~2-5s |

Para aplicações que usam contextos enormes (documentos longos, codebases inteiras), o ganho de latência é tão importante quanto a economia de custo.

---

## 6. Exemplo Concreto — Chatbot com Base de Conhecimento

```python
# Contexto estável (cacheável)
system_prompt = "Você é o assistente da FinTech XYZ..."  # ~500 tokens
product_docs = load_product_documentation()                # ~8.000 tokens
faq_database = load_faq()                                  # ~3.000 tokens

# Para cada pergunta do usuário
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
                    "cache_control": {"type": "ephemeral"}  # 11.5K tokens cacheados
                },
                {
                    "type": "text",
                    "text": f"Contexto: {retrieved_docs}\n\nPergunta: {user_question}"
                }
            ]
        }]
    )
    return response
```

Na primeira chamada, paga o cache write (25% extra). Nas 99 chamadas seguintes (dentro de 5 min), paga 90% menos nos 11.5K tokens cacheados. **Resultado: ~85% de economia no input.**

---

## 7. Vantagens e Limitações

**Economia significativa:** 50-90% de redução no custo de input para workloads repetitivos.

**Redução de latência:** TTFT (time to first token) drasticamente menor para contextos longos.

**Transparente:** Não muda a qualidade da resposta — o output é matematicamente idêntico.

**Simples de implementar:** Na maioria dos casos, basta reordenar o contexto e adicionar marcadores de cache.

**TTL curto:** Cache expira em minutos (Anthropic: 5 min). Workloads com tráfego esporádico podem não se beneficiar.

**Prefixo exato:** Qualquer alteração no prefixo invalida o cache. Um único token diferente = cache miss completo.

**Custo de write:** A primeira chamada é mais cara (cache write). Para chamadas únicas, caching é contraproducente.

**Tamanho mínimo:** Prefixos menores que 1.024 tokens não são cacheáveis.

---

## Conclusão

Prompt Caching é uma das otimizações com melhor relação custo-benefício em aplicações de LLM. A regra é simples: **quanto mais contexto estável você repete entre chamadas, mais você economiza**. Para pipelines de RAG, chatbots, e qualquer aplicação que use system prompts longos ou bases de conhecimento fixas, o caching transforma custos proibitivos em viáveis. A principal disciplina é manter o conteúdo estável como prefixo — o que na prática significa pensar na ordem do seu contexto como uma decisão de arquitetura.
