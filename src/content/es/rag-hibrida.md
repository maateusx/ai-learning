# RAG Híbrida (Retrieval-Augmented Generation)

Si ya usaste ChatGPT y te inventó una información con total convicción (las famosas ["alucinaciones"](#ia-e-modelos)), entiendes el problema de las IAs puras. La **RAG (Generación Aumentada por Recuperación)** es la solución para eso.

Imagina que la IA es un estudiante genio haciendo un examen.

- **IA Común:** Hace el examen confiando solo en la memoria (que puede fallar).
- **IA con RAG:** Hace el examen con el libro abierto delante para consultar las respuestas.

La **RAG Híbrida** es cuando ese estudiante usa dos tipos de índices diferentes para encontrar la página correcta del libro lo más rápido posible.

---

## 1. ¿Qué compone la RAG Híbrida?

La RAG "simple" generalmente usa solo Búsqueda Vectorial. La **RAG Híbrida** combina lo mejor de todos los mundos que discutimos anteriormente:

1.  **Búsqueda Dispersa (BM25):** Para encontrar términos exactos, nombres de productos o códigos técnicos.
2.  **Búsqueda Densa (Vectorial):** Para entender la intención y el contexto de la pregunta del usuario.
3.  **Fusión (RRF):** Para equilibrar los resultados de ambas búsquedas.
4.  **Reranking:** Para garantizar que la información más relevante esté en primer lugar antes de enviarla a la IA.

---

## 2. El Flujo de Trabajo (Pipeline)

Para quien no es técnico, el proceso parece magia, pero sigue estos 4 pasos lógicos:

### Paso 1: La Pregunta (Query)

El usuario hace una pregunta: _"¿Cuál es la política de reembolso para productos electrónicos comprados en promoción?"_

### Paso 2: La Recuperación Híbrida (Retrieval)

El sistema no intenta responder de inmediato. Recorre la base de datos y hace dos búsquedas simultáneas:

- **Búsqueda por Palabras:** Busca "reembolso", "electrónicos" y "promoción".
- **Búsqueda por Significado:** Busca documentos que hablen sobre devolución de dinero y reglas de compra.

### Paso 3: Filtro de Calidad (RRF + Reranker)

Los resultados se mezclan mediante **RRF** y luego el **Reranker** (el especialista) analiza los 5 mejores párrafos encontrados y decide cuál de ellos realmente responde a la pregunta.

### Paso 4: Generación de la Respuesta (Generation)

El sistema envía a la IA (como GPT-4 o Claude — ver [IA y Modelos](#ia-e-modelos)) el siguiente comando: _"Aquí están las reglas de la empresa [Texto del Documento]. Basándote únicamente en esto, responde al usuario: [Pregunta]"_.

---

## 3. ¿Por qué la RAG Híbrida es superior?

| Criterio           | IA Pura (Sin RAG)              | RAG Simple (Solo Vectores)           | RAG Híbrida                                         |
| :----------------- | :----------------------------- | :----------------------------------- | :-------------------------------------------------- |
| **Confiabilidad**  | Baja (Alucina mucho).          | Media (Puede fallar con términos técnicos). | **Altísima** (Basada en hechos y términos exactos). |
| **Actualización**  | Necesita nuevo entrenamiento.  | Basta actualizar los documentos.     | **Basta actualizar los documentos.**                |
| **Precisión**      | N/A                            | Buena para conceptos generales.      | **Excelente para casos complejos.**                 |
| **Costo**          | Carísimo (Entrenamiento).      | Bajo.                                | Moderado (Pero muy eficiente).                      |

---

## 4. Ventajas para el Negocio

- **Fin de las Alucinaciones:** La IA solo responde lo que está en tus documentos. Si no encuentra la respuesta, dirá "No lo sé".
- **Seguridad de Datos:** Puedes controlar qué documentos puede leer la IA, garantizando que la información privada no se filtre.
- **Citación de Fuentes:** La RAG permite que la IA diga: _"Según el párrafo 4 del manual técnico..."_, dando mucha más credibilidad.

---

## Conclusión

La **RAG Híbrida** es la arquitectura de estado del arte para cualquier empresa que quiera usar IA de forma profesional. Transforma un modelo de lenguaje genérico en un especialista profundo en **tus** datos, combinando la intuición de la búsqueda vectorial con la precisión de la búsqueda por palabras clave. Para ello, tus documentos pasan por [Chunking](#chunking) antes de ser indexados, y la calidad de los resultados puede medirse con [métricas como Precision y NDCG](#metricas-qualidade).
