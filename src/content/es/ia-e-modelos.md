# IA y Modelos de Lenguaje (LLMs)

Imagina un estudiante que leyó todo internet — libros, artículos, foros, código — y ahora puede escribir sobre cualquier tema con fluidez. Ese es el **LLM (Large Language Model)**. Es el cerebro detrás de herramientas como ChatGPT, Claude y Llama, y es el componente que genera las respuestas finales en sistemas de [RAG](#rag-hibrida).

---

## 1. ¿Qué es un LLM?

Un **Large Language Model** es una red neuronal entrenada con miles de millones de textos para predecir la siguiente palabra en una secuencia. Al hacer esto billones de veces, el modelo "aprende" gramática, hechos, razonamiento lógico e incluso matices culturales.

### ¿Cómo genera texto?

El proceso es sorprendentemente simple en esencia:

1. Envías un texto (el **prompt**).
2. El modelo calcula la probabilidad de cada palabra posible de ser la siguiente.
3. Elige una palabra y repite el proceso hasta completar la respuesta.

Es como el autocompletar del celular, pero con miles de millones de parámetros en lugar de cientos.

---

## 2. Tokens: La Unidad de Pensamiento de la IA

Los LLMs no leen letras ni palabras — leen **tokens**. Un token es un fragmento de texto que el modelo utiliza como unidad básica de procesamiento.

### Ejemplos de tokenización:

| Texto Original | Tokens (aproximado) |
| :------------- | :------------------ |
| "Inteligencia Artificial" | `["Int", "elig", "encia", " Art", "ificial"]` |
| "Hello World" | `["Hello", " World"]` |
| "ChatGPT es increíble" | `["Chat", "GPT", " es", " increíble"]` |

### Regla práctica:

- **En inglés:** 1 token ≈ ¾ de una palabra (1.000 tokens ≈ 750 palabras).
- **En español:** Los tokens tienden a ser más pequeños debido a los acentos y conjugaciones, así que 1.000 tokens ≈ 600-650 palabras.

Los tokens son la "moneda" de las IAs — pagas por token consumido, y el límite de procesamiento se mide en tokens.

---

## 3. Context Window: La Memoria de Corto Plazo

La **Context Window (Ventana de Contexto)** es el límite máximo de tokens que un modelo puede procesar de una sola vez. Piensa en ella como el escritorio de trabajo del estudiante: todo lo que necesita consultar tiene que caber en ese escritorio.

| Modelo | Context Window |
| :----- | :------------- |
| GPT-3.5 | 4.096 tokens (~3.000 palabras) |
| GPT-4 | 128.000 tokens (~96.000 palabras) |
| Claude 3.5 Sonnet | 200.000 tokens (~150.000 palabras) |
| Llama 3 | 8.192 tokens (~6.000 palabras) |

### ¿Por qué importa?

En la ventana de contexto deben caber **al mismo tiempo**:

1. Las instrucciones del sistema (system prompt).
2. Los documentos recuperados por la búsqueda (los "chunks" — ver [Chunking](#chunking)).
3. La pregunta del usuario.
4. La respuesta que la IA va a generar.

Si los documentos son demasiado grandes, no caben en la ventana. Por eso el [Chunking](#chunking) y la calidad de la [Búsqueda Vectorial](#busca-vetorial) son tan importantes — necesitamos entregar solo los fragmentos más relevantes.

---

## 4. Alucinaciones: Cuando la IA Inventa

**Alucinación (Hallucination)** es cuando el modelo genera información que parece verdadera, está escrita con total confianza, pero es completamente falsa.

### ¿Por qué ocurre?

El LLM es un modelo probabilístico — genera la secuencia de palabras más **probable**, no necesariamente la más **verdadera**. Si no tiene la información correcta, "rellena el vacío" con algo estadísticamente plausible.

### Ejemplos clásicos:

- Inventar citas de artículos académicos que no existen.
- Crear nombres de funciones de bibliotecas que nunca fueron implementadas.
- Afirmar fechas, números o hechos con total convicción — y estar equivocado.

### ¿Cómo reduce la RAG las alucinaciones?

La [RAG (Retrieval-Augmented Generation)](#rag-hibrida) es el arma principal contra las alucinaciones. En lugar de confiar en la "memoria" del modelo, el sistema:

1. **Busca** documentos reales en tu base de datos.
2. **Entrega** esos documentos como contexto en la ventana de contexto.
3. **Instruye** al modelo: _"Responde únicamente con base en los documentos proporcionados."_

Esto transforma la IA de un "estudiante confiando en la memoria" a un "estudiante con el libro abierto".

---

## 5. Principales Modelos

| Modelo | Desarrollador | Destacados | ¿Open Source? |
| :----- | :------------ | :--------- | :------------ |
| GPT-4 | OpenAI | Razonamiento avanzado, multimodal | No |
| Claude | Anthropic | Ventana de contexto enorme, seguridad | No |
| Llama 3 | Meta | Mejor modelo open source | Sí |
| Gemini | Google | Integración con el ecosistema Google | No |
| Mistral | Mistral AI | Ligero y eficiente | Sí |

---

## 6. Ventajas y Limitaciones

✅ Capacidad de comprender y generar texto en lenguaje natural con alta fluidez.

✅ Versatilidad — el mismo modelo puede resumir, traducir, programar y razonar.

✅ Combinado con [RAG](#rag-hibrida), puede convertirse en un especialista en tus datos.

⚠️ Las alucinaciones son inevitables sin mecanismos de grounding (como RAG).

⚠️ Costo proporcional al número de tokens procesados.

⚠️ La Context Window limita la cantidad de información procesada por vez.

⚠️ Sin acceso a información en tiempo real (a menos que se conecte a herramientas externas).

---

## Relación con Otros Temas

Los LLMs son el componente de **generación** en los pipelines de [RAG](#rag-hibrida). Pero sin una buena estrategia de recuperación — usando [Búsqueda Vectorial](#busca-vetorial), [Búsqueda Híbrida](#busca-hibrida) y [Reranking](#cross-encoders) — la IA no recibe los documentos correctos, y la calidad de la respuesta se desploma. Entender tokens y context window también es esencial para definir la estrategia de [Chunking](#chunking) de tus documentos.
