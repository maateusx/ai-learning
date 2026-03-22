# Técnicas Avanzadas de Búsqueda

Cuando le haces una pregunta a un sistema de [RAG](#rag-hibrida), la calidad de la respuesta depende directamente de la calidad de los documentos recuperados. Pero ¿y si tu pregunta es corta, vaga o ambigua? Técnicas como **Query Expansion** y **HyDE** reformulan la pregunta antes de buscar, garantizando que el sistema encuentre los mejores resultados incluso cuando el usuario no sabe exactamente cómo preguntar.

---

## 1. Query Expansion: Ampliando la Consulta

La **Query Expansion (Expansión de Consulta)** es la técnica de reescribir o enriquecer la pregunta del usuario antes de enviarla al motor de búsqueda. El objetivo es cubrir más variaciones del mismo concepto.

### ¿Cómo funciona?

1. El usuario escribe una pregunta corta: _"neumático pinchado"_.
2. El sistema usa un [LLM](#ia-e-modelos) para expandir: _"cambio de neumático, mantenimiento de ruedas, goma automotriz, rueda de repuesto, calibración"_.
3. La búsqueda se realiza con la consulta expandida, aumentando las posibilidades de encontrar documentos relevantes.

### Tipos de expansión:

| Tipo | Descripción | Ejemplo |
| :--- | :---------- | :------ |
| **Sinónimos** | Agrega palabras con el mismo significado | "coche" → "coche, automóvil, vehículo" |
| **Términos relacionados** | Agrega conceptos adyacentes | "diabetes" → "diabetes, glucemia, insulina, hemoglobina glicosilada" |
| **Multi-query** | Genera N versiones diferentes de la misma pregunta | "¿Cómo funciona RAG?" → 3 reformulaciones distintas |
| **Step-back** | Generaliza la pregunta para buscar conceptos más amplios | "¿Cuál es la velocidad del F-22?" → "¿Cuáles son las especificaciones de aeronaves militares?" |

### Ejemplo práctico con Multi-query:

```python
# Pregunta original
query = "¿Cómo reducir costos con IA?"

# El LLM genera 3 variaciones
queries_expandidas = [
    "¿Cómo reducir costos con IA?",
    "Estrategias para disminuir gastos en proyectos de inteligencia artificial",
    "Optimización de presupuesto para implementación de modelos de machine learning"
]

# La búsqueda vectorial se hace para CADA variación
# Los resultados se combinan y deduplican
```

Este enfoque multi-query es especialmente eficaz con [Búsqueda Híbrida](#busca-hibrida), ya que cada variación puede capturar documentos diferentes tanto en la búsqueda semántica como en la búsqueda por palabras clave.

---

## 2. HyDE (Hypothetical Document Embeddings)

**HyDE** es una técnica ingeniosa que invierte la lógica de la búsqueda. En lugar de buscar directamente por la pregunta, el sistema primero **genera una respuesta hipotética** y luego busca documentos parecidos a esa respuesta.

### ¿Por qué funciona?

El problema: el vector de una **pregunta corta** generalmente queda distante del vector de un **párrafo de respuesta**, aunque hablen sobre el mismo tema. Preguntas y respuestas tienen estructuras lingüísticas muy diferentes.

La solución de HyDE:

1. El usuario pregunta: _"¿Cuál es la política de vacaciones?"_
2. El [LLM](#ia-e-modelos) genera una respuesta hipotética (puede ser imprecisa, no importa):
   > _"La empresa ofrece 30 días de vacaciones por año, que pueden dividirse en hasta 3 períodos..."_
3. Esa respuesta hipotética se transforma en un vector (embedding).
4. La [Búsqueda Vectorial](#busca-vetorial) usa ese vector para encontrar documentos reales similares.

### ¿Por qué funciona la respuesta falsa?

Porque el embedding de la respuesta hipotética estará en el mismo "barrio" vectorial de los documentos reales sobre el tema. El [ANN](#universo-dos-vetores) encuentra los vecinos más cercanos de ese vector — y esos vecinos son los documentos verdaderos.

```python
# Paso 1: Generar documento hipotético
respuesta_hipotetica = llm.generate(
    f"Responde de forma detallada: {pregunta_usuario}"
)

# Paso 2: Generar embedding de la respuesta (¡no de la pregunta!)
embedding_hyde = modelo_embedding.encode(respuesta_hipotetica)

# Paso 3: Buscar documentos reales similares a la respuesta hipotética
resultados = vector_db.query(
    query_embedding=embedding_hyde,
    top_k=5
)
```

---

## 3. Comparativo

| Criterio | Búsqueda Simple | Query Expansion | HyDE |
| :------- | :-------------- | :-------------- | :--- |
| **Complejidad** | Baja | Media | Alta |
| **Costo** | 1 llamada al embedding | 1 llamada al LLM + N búsquedas | 1 llamada al LLM + 1 búsqueda |
| **Preguntas cortas** | Débil | Bueno | Excelente |
| **Preguntas específicas** | Bueno | Bueno | Puede generar ruido |
| **Latencia** | Baja | Media (N búsquedas) | Media (generación + búsqueda) |

---

## 4. ¿Cuándo Usar Cada Técnica?

- **Query Expansion (Multi-query):** Cuando los usuarios hacen preguntas genéricas y quieres maximizar el recall (encontrar el máximo de documentos relevantes). Funciona muy bien con [Búsqueda Híbrida](#busca-hibrida) y [RRF](#reciprocal-rank-fusion).

- **HyDE:** Cuando las preguntas son muy cortas (1-3 palabras) y la búsqueda simple no devuelve buenos resultados. Ideal para escenarios de FAQ y atención al cliente.

- **Ambas combinadas:** En pipelines de [RAG](#rag-hibrida) de alto rendimiento, es posible usar query expansion para generar variaciones y HyDE para una de ellas, y luego combinar todos los resultados.

---

## 5. Ventajas y Limitaciones

✅ Query Expansion aumenta significativamente el recall sin alterar la infraestructura de búsqueda.

✅ HyDE mejora drásticamente la calidad para preguntas cortas y ambiguas.

✅ Ambas técnicas son compatibles con cualquier [base vectorial](#universo-dos-vetores).

✅ Multi-query se beneficia naturalmente de la [fusión de resultados (RRF)](#reciprocal-rank-fusion).

⚠️ Ambas agregan latencia (llamadas extras al [LLM](#ia-e-modelos)).

⚠️ HyDE puede generar ruido si la respuesta hipotética es muy diferente de la realidad.

⚠️ Query Expansion con muchas variaciones multiplica el costo de búsqueda.

⚠️ Requieren un LLM disponible en el momento de la búsqueda, aumentando las dependencias del sistema.

---

## Relación con Otros Temas

Estas técnicas se posicionan entre la pregunta del usuario y el motor de búsqueda en el pipeline de [RAG](#rag-hibrida). Mejoran la entrada de la [Búsqueda Vectorial](#busca-vetorial) y de la [Búsqueda Híbrida](#busca-hibrida), resultando en documentos más relevantes incluso antes del [Reranking](#cross-encoders). La eficacia de estas técnicas puede medirse comparando [Precision y Recall](#metricas-qualidade) antes y después de su aplicación.
