# Cross-Encoders (Rerankers)

Imagina que estás contratando a un desarrollador.

1.  **Fase 1 (Búsqueda Híbrida):** Recibes 1.000 currículums y usas filtros automáticos (palabras clave y áreas de interés) para seleccionar los 10 mejores.
2.  **Fase 2 (Reranker):** Te sientas con cada uno de esos 10 candidatos para una entrevista técnica profunda de una hora.

No podrías entrevistar a los 1.000 candidatos (tomaría meses), pero puedes analizar en profundidad a los 10 finalistas. El **Cross-Encoder** hace exactamente eso con los datos.

## 1. Bi-Encoders vs. Cross-Encoders

Para entender el Reranker, necesitamos comprender la diferencia técnica entre las dos formas de usar [modelos de lenguaje](#ia-e-modelos) (como BERT o GPT) en la búsqueda:

### Bi-Encoders (Búsqueda Vectorial Común)

El sistema transforma la pregunta en un vector y los documentos en otros vectores de forma **independiente**. Nunca "se conocen" hasta el momento del cálculo de similitud.

- **Ventaja:** Es extremadamente rápido (milisegundos para millones de documentos).
- **Limitación:** Como el modelo no mira la pregunta y el documento al mismo tiempo, pierde matices sutiles de contexto.

### Cross-Encoders (El Reranker)

Aquí, el sistema coloca la **Pregunta** y el **Documento** juntos dentro del mismo modelo de IA al mismo tiempo. El modelo analiza la interacción palabra por palabra entre ambos.

- **Ventaja:** Precisión quirúrgica. Entiende contradicciones, negaciones y relaciones complejas que los vectores pueden dejar pasar.
- **Limitación:** Es pesado y lento. Procesar 1 millón de documentos de esta manera sería inviable computacionalmente.

---

## 2. El Flujo de Trabajo (The Pipeline)

Un sistema de búsqueda de alto rendimiento no usa un solo método. Trabaja en capas. El Reranker entra en la última etapa:

1.  **Retrieval (Recuperación):** BM25 y la Búsqueda Vectorial recorren millones de documentos y traen, digamos, los 50 más prometedores.
2.  **Reranking (Reclasificación):** El Cross-Encoder recibe esos 50 documentos y la pregunta del usuario. Analiza los 50 pares y asigna una nota de 0 a 1 a cada uno, basada en la relevancia real.
3.  **Resultado Final:** Los documentos se reordenan según esta nueva nota, garantizando que el resultado más preciso "suba" a la primera posición.

---

## 3. ¿Por qué es mucho más inteligente?

La "magia" ocurre gracias al mecanismo de **Atención (Attention)**.

En una búsqueda vectorial común, el modelo decide qué es importante en el documento sin saber cuál será la pregunta. En el Cross-Encoder, el modelo puede enfocarse en partes específicas del documento que responden directamente a esa pregunta específica.

> **Ejemplo:**
>
> - **Pregunta:** "¿Puedo tomar el medicamento X estando embarazada?"
> - **Documento A:** "El medicamento X es excelente para el dolor de cabeza."
> - **Documento B:** "El medicamento X **no** está recomendado para embarazadas."
>
> Un sistema de vectores podría considerar el Documento A más parecido por el tema "medicamento". El Reranker va a notar el "**no**" y la relación con "embarazadas" y colocará el Documento B en el primer lugar de inmediato.

---

## 4. Comparativo de Rendimiento

| Característica          | Búsqueda Vectorial / BM25   | Cross-Encoder (Reranker)              |
| :---------------------- | :--------------------------- | :------------------------------------ |
| **Escala de Datos**     | Millones/Miles de millones.  | Solo el Top 50 o 100.                |
| **Costo Computacional** | Bajo (tras la indexación).   | Alto (procesamiento en tiempo real).  |
| **Precisión**           | Buena (80-85%).              | Excelente (95%+).                     |
| **Velocidad**           | Instantánea.                 | Cientos de milisegundos.              |

---

## Conclusión

El Reranker es la capa de "sentido común" de la inteligencia artificial aplicada a la búsqueda. Permite mantener la velocidad de los sistemas de búsqueda tradicionales, pero entregar una experiencia de usuario donde los resultados parecen haber sido seleccionados manualmente por un especialista humano.
