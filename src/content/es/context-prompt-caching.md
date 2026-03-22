# Context & Prompt Caching

Cada vez que envías un mensaje a un LLM, el modelo necesita procesar **todo el contexto** desde cero — el system prompt, los ejemplos, los documentos del RAG, el historial de conversación. Si tu system prompt tiene 4.000 tokens y haces 100 llamadas, el modelo procesó 400.000 tokens de contenido idéntico. **Prompt Caching** resuelve esto: el proveedor almacena el resultado del procesamiento de prefijos repetidos, eliminando la recomputación y reduciendo costo y latencia.

---

## 1. El problema — Redundancia masiva

En un pipeline de RAG típico, cada llamada al LLM incluye:

```
┌─────────────────────────────────────────┐
│ System prompt (~2.000 tokens)       ← repetido 100%
│ Few-shot examples (~3.000 tokens)   ← repetido 100%
│ Documentos del RAG (~5.000 tokens)  ← varía por query
│ Pregunta del usuario (~50 tokens)   ← única
└─────────────────────────────────────────┘
Total: ~10.050 tokens por llamada
```

Sin cache, **5.000+ tokens se reprocesan idénticamente** en cada llamada. A costos de input de Claude ($3/M tokens para Sonnet), 1 millón de llamadas con 5K tokens redundantes = **$15.000 desperdiciados**.

---

## 2. ¿Cómo funciona el Prompt Caching?

### El concepto de prefijo

Los LLMs procesan tokens secuencialmente. El Prompt Caching almacena el **estado interno del modelo** (KV cache) después de procesar un prefijo de tokens, para que llamadas futuras con el mismo prefijo salten directamente a la parte nueva.

```
Llamada 1:
[System prompt | Ejemplos | Docs RAG | Pregunta A]
 ──────── prefijo (cached) ────────   ── nuevo ──

Llamada 2:
[System prompt | Ejemplos | Docs RAG | Pregunta B]
 ──────── prefijo (cache hit!) ─────   ── nuevo ──
 ↑ Salta todo este procesamiento
```

### Qué se almacena

No es el texto lo que se cachea — es el **KV cache**, la representación interna que el modelo construye al procesar los tokens. Esto es significativamente más grande que el texto en sí (por eso el cache tiene límites y TTL).

---

## 3. Implementación por proveedor

### Anthropic (Claude)

La API de Claude soporta prompt caching explícito con `cache_control`:

```json
{
  "model": "claude-sonnet-4-20250514",
  "system": [
    {
      "type": "text",
      "text": "Eres un asistente técnico especializado...",
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
          "text": "¿Cuál es la política de reembolso?"
        }
      ]
    }
  ]
}
```

**Reglas:**
- Mínimo de **1.024 tokens** para activar el cache (2.048 para Haiku)
- El cache tiene **TTL de 5 minutos** (renovado en cada hit)
- Hasta **4 breakpoints** de cache por request
- **Cache write:** 25% más caro que input normal
- **Cache read:** 90% más barato que input normal

### OpenAI (GPT)

OpenAI implementa prompt caching **automáticamente** — sin necesidad de marcado explícito:

- Prefijos largos idénticos se cachean automáticamente
- Cache hit: **50% de descuento** en el precio de input
- Mínimo de **1.024 tokens** de prefijo
- Funciona solo con prefijos exactos (byte-level match)

### Google (Gemini)

Gemini usa **Context Caching** con control explícito y TTL configurable:

- Creas un "cached content" con TTL definido (minutos a horas)
- Referencías ese cache en llamadas subsiguientes
- Se cobra por almacenamiento (por hora) + descuento en el input

---

## 4. Estrategias de optimización

### Ordenación del contexto

La regla de oro: **coloca el contenido estable al inicio, el variable al final.**

```
✅ Buena ordenación (maximiza cache hit):
[System prompt] → [Few-shots] → [Docs base] → [Docs dinámicos] → [Pregunta]
 ─── estable ──────────────────────────────   ── varía ──────────────────

❌ Mala ordenación (invalida cache):
[Pregunta] → [System prompt] → [Few-shots] → [Docs]
 ── varía ─   ─── estable (pero nunca cacheado porque no es prefijo) ───
```

### Cache en capas

Para pipelines de RAG, estructura el cache en niveles:

```
Nivel 1 (cache hit ~100%): System prompt + few-shots
Nivel 2 (cache hit ~80%):  + documentación base del dominio
Nivel 3 (cache hit ~40%):  + documentos del RAG por sesión
Nivel 4 (sin cache):       Pregunta del usuario
```

### Conversaciones multi-turn

En chatbots, el historial de conversación crece en cada turno. El caching natural del prefijo garantiza que turnos anteriores no se reprocesan:

```
Turn 1: [System | User1 | Assistant1]
Turn 2: [System | User1 | Assistant1 | User2 | Assistant2]
         ────── prefijo cacheado ──────
Turn 3: [System | User1 | Assistant1 | User2 | Assistant2 | User3]
         ──────────── prefijo cacheado ────────────────────
```

---

## 5. Impacto en costo y latencia

### Costo

| Escenario | Sin cache | Con cache | Ahorro |
| :--- | :--- | :--- | :--- |
| 10K llamadas, 4K tokens estáticos (Claude) | $120 | $16 | **87%** |
| 50K llamadas, 8K tokens estáticos (Claude) | $1.200 | $168 | **86%** |
| Chatbot, 20 turns promedio (GPT) | $500 | $275 | **45%** |

### Latencia

La ganancia de latencia viene de que el modelo no necesita computar el KV cache para los tokens cacheados:

| Tamaño del prefijo cacheado | Reducción de latencia (TTFT) |
| :--- | :--- |
| 1K-5K tokens | ~100-300ms |
| 10K-50K tokens | ~500ms-2s |
| 100K+ tokens | ~2-5s |

Para aplicaciones que usan contextos enormes (documentos largos, codebases enteras), la ganancia de latencia es tan importante como el ahorro de costo.

---

## 6. Ejemplo Concreto — Chatbot con Base de Conocimiento

```python
# Contexto estable (cacheable)
system_prompt = "Eres el asistente de la FinTech XYZ..."  # ~500 tokens
product_docs = load_product_documentation()                # ~8.000 tokens
faq_database = load_faq()                                  # ~3.000 tokens

# Para cada pregunta del usuario
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
                    "text": f"Contexto: {retrieved_docs}\n\nPregunta: {user_question}"
                }
            ]
        }]
    )
    return response
```

En la primera llamada, se paga el cache write (25% extra). En las 99 llamadas siguientes (dentro de 5 min), se paga 90% menos en los 11.5K tokens cacheados. **Resultado: ~85% de ahorro en el input.**

---

## 7. Ventajas y Limitaciones

**Ahorro significativo:** 50-90% de reducción en el costo de input para workloads repetitivos.

**Reducción de latencia:** TTFT (time to first token) drásticamente menor para contextos largos.

**Transparente:** No cambia la calidad de la respuesta — el output es matemáticamente idéntico.

**Simple de implementar:** En la mayoría de los casos, basta con reordenar el contexto y agregar marcadores de cache.

**TTL corto:** El cache expira en minutos (Anthropic: 5 min). Workloads con tráfico esporádico pueden no beneficiarse.

**Prefijo exacto:** Cualquier alteración en el prefijo invalida el cache. Un solo token diferente = cache miss completo.

**Costo de write:** La primera llamada es más cara (cache write). Para llamadas únicas, el caching es contraproducente.

**Tamaño mínimo:** Prefijos menores a 1.024 tokens no son cacheables.

---

## Conclusión

Prompt Caching es una de las optimizaciones con mejor relación costo-beneficio en aplicaciones de LLM. La regla es simple: **cuanto más contexto estable repites entre llamadas, más ahorras**. Para pipelines de RAG, chatbots y cualquier aplicación que use system prompts largos o bases de conocimiento fijas, el caching transforma costos prohibitivos en viables. La principal disciplina es mantener el contenido estable como prefijo — lo que en la práctica significa pensar en el orden de tu contexto como una decisión de arquitectura.
