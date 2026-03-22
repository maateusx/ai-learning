# Métricas de Calidad en Sistemas de Búsqueda

Imagina que eres un profesor corrigiendo un examen. No basta con saber si el alumno acertó — necesitas saber: _"De las respuestas que dio, ¿cuántas están correctas?"_ y _"De todas las respuestas correctas posibles, ¿cuántas encontró?"_. Es exactamente así como medimos la calidad de un sistema de búsqueda: usando **Precision**, **Recall** y **NDCG**.

---

## 1. Precision: ¿Cuántos Resultados Son Relevantes?

La **Precision (Precisión)** responde a la pregunta: _"De los resultados que el sistema me trajo, ¿cuántos son realmente útiles?"_

### Fórmula:

```
Precision = Resultados Relevantes Retornados / Total de Resultados Retornados
```

### Ejemplo:

Buscas "política de reembolso" y el sistema devuelve 10 documentos. De esos 10, solo 6 hablan realmente sobre reembolso.

```
Precision = 6 / 10 = 0.60 (60%)
```

### Precision@K:

En la práctica, medimos la precisión en los **top K** resultados, porque el usuario rara vez mira más allá de los primeros. El **Precision@5** evalúa únicamente los 5 primeros resultados retornados.

| Posición | Documento | ¿Relevante? |
| :------- | :-------- | :----------- |
| 1 | Política de Reembolso v2 | ✅ |
| 2 | Manual del Empleado | ❌ |
| 3 | FAQ - Devoluciones | ✅ |
| 4 | Reglas de Reembolso Internacional | ✅ |
| 5 | Catálogo de Productos | ❌ |

```
Precision@5 = 3 / 5 = 0.60 (60%)
```

---

## 2. Recall: ¿Cuántos Relevantes Fueron Encontrados?

El **Recall (Exhaustividad)** responde a la pregunta opuesta: _"De todos los documentos relevantes que existen en la base, ¿cuántos logró encontrar el sistema?"_

### Fórmula:

```
Recall = Resultados Relevantes Retornados / Total de Relevantes en la Base
```

### Ejemplo:

En tu base existen 15 documentos sobre reembolso. El sistema devolvió 10 resultados, de los cuales 6 son relevantes.

```
Recall = 6 / 15 = 0.40 (40%)
```

El sistema encontró el 60% de los resultados correctos (precision), pero solo cubrió el 40% de todos los documentos relevantes (recall).

---

## 3. El Tradeoff Precision vs. Recall

Precision y Recall viven en tensión constante:

- **Aumentar resultados retornados** → Recall sube (encuentra más relevantes), pero Precision baja (más basura junto).
- **Disminuir resultados retornados** → Precision sube (menos basura), pero Recall baja (puede perder documentos importantes).

### ¿Cómo equilibrar?

| Escenario | Prioridad | Por qué |
| :-------- | :-------- | :------ |
| Atención al cliente | **Precision** | El usuario quiere la respuesta correcta, no 20 opciones |
| Investigación jurídica | **Recall** | No se puede perder ningún documento relevante |
| E-commerce | **Equilibrio** | Mostrar productos relevantes sin contaminar la página |
| [RAG](#rag-hibrida) empresarial | **Precision** | Enviar chunks irrelevantes al [LLM](#ia-e-modelos) desperdicia [tokens](#ia-e-modelos) y puede confundir la respuesta |

La [Búsqueda Híbrida](#busca-hibrida) combinada con [Cross-Encoders](#cross-encoders) es una de las estrategias más eficaces para mejorar ambas métricas simultáneamente: la búsqueda híbrida maximiza el recall y el reranker filtra para maximizar la precision.

---

## 4. NDCG: El Orden Importa

El **NDCG (Normalized Discounted Cumulative Gain)** va más allá de contar aciertos. Evalúa si los resultados **más relevantes están en las primeras posiciones**.

### Intuición:

Imagina dos sistemas que devuelven los mismos 5 documentos relevantes en 10 resultados:

- **Sistema A:** Los 5 relevantes están en las posiciones 1, 2, 3, 4 y 5.
- **Sistema B:** Los 5 relevantes están en las posiciones 2, 4, 6, 8 y 10.

Ambos tienen Precision@10 = 50% y Recall idéntico. Pero el **Sistema A** es claramente mejor — el NDCG captura esa diferencia.

### Cómo funciona (simplificado):

1. Cada resultado recibe una puntuación de relevancia (ej: 0, 1, 2 o 3).
2. Los resultados en posiciones más bajas reciben un **descuento logarítmico** — cuanto más lejos del tope, menos vale.
3. La puntuación se normaliza por el "resultado perfecto" (todos los relevantes en el tope).

```
DCG = Σ (relevancia_i / log₂(posición_i + 1))

NDCG = DCG / DCG_ideal
```

### Ejemplo numérico:

| Posición | Relevancia | Ganancia Descontada |
| :------- | :--------- | :------------------ |
| 1 | 3 (muy relevante) | 3 / log₂(2) = 3.00 |
| 2 | 0 (irrelevante) | 0 / log₂(3) = 0.00 |
| 3 | 2 (relevante) | 2 / log₂(4) = 1.00 |
| 4 | 3 (muy relevante) | 3 / log₂(5) = 1.29 |
| 5 | 1 (poco relevante) | 1 / log₂(6) = 0.39 |

```
DCG = 3.00 + 0.00 + 1.00 + 1.29 + 0.39 = 5.68
```

Si el ranking perfecto generaría DCG = 8.50:

```
NDCG = 5.68 / 8.50 = 0.668 (66.8%)
```

El resultado de 66.8% indica que el ranking es bueno, pero podría mejorar — el segundo resultado debería ser relevante. El [RRF](#reciprocal-rank-fusion) y los [Cross-Encoders](#cross-encoders) son técnicas que mejoran directamente el NDCG al reordenar resultados.

---

## 5. Resumen de las Métricas

| Métrica | Qué Mide | Cuándo Usar | Score Ideal |
| :------ | :------- | :---------- | :---------- |
| **Precision@K** | % de resultados relevantes en los top K | Evaluar la calidad de los primeros resultados | 1.0 (100%) |
| **Recall@K** | % de todos los relevantes que fueron encontrados | Evaluar cobertura de la búsqueda | 1.0 (100%) |
| **NDCG@K** | Calidad del ranking (el orden importa) | Evaluar si los mejores están en el tope | 1.0 (ranking perfecto) |

---

## 6. Ventajas y Limitaciones

✅ Precision y Recall son intuitivas y fáciles de calcular.

✅ NDCG captura la calidad del ranking, no solo presencia/ausencia.

✅ Precision@K es la métrica más práctica para sistemas de [RAG](#rag-hibrida) (solo importa lo que llega al LLM).

✅ Permiten comparar objetivamente diferentes estrategias de búsqueda.

⚠️ Exigen un conjunto de evaluación con relevancia marcada manualmente (golden set).

⚠️ Recall exige saber el total de documentos relevantes en la base — no siempre es viable.

⚠️ NDCG con pocos resultados puede ser inestable.

⚠️ Las métricas offline no siempre reflejan la satisfacción real del usuario.

---

## Relación con Otros Temas

Estas métricas se utilizan para evaluar y comparar todas las técnicas de búsqueda discutidas en este material: [Búsqueda Vectorial](#busca-vetorial), [Búsqueda por Palabras Clave](#busca-palavra-chave), [Búsqueda Híbrida](#busca-hibrida), [RRF](#reciprocal-rank-fusion) y [Cross-Encoders](#cross-encoders). Técnicas como [Query Expansion y HyDE](#tecnicas-avancadas-busca) típicamente mejoran el Recall, mientras que los [Rerankers](#cross-encoders) mejoran Precision y NDCG. En pipelines de [RAG](#rag-hibrida), el Precision@K es especialmente crítico, ya que cada chunk irrelevante consume [tokens](#ia-e-modelos) y puede degradar la respuesta.
