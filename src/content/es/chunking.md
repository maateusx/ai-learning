# Chunking (Segmentación de Documentos)

Imagina que necesitas estudiar para un examen usando un libro de 500 páginas, pero solo puedes llevar **una ficha de anotaciones** a la sala. No vas a copiar el libro entero — vas a seleccionar los fragmentos más relevantes y ponerlos en la ficha. El **Chunking** es exactamente ese proceso: dividir documentos grandes en fragmentos más pequeños que caben en la [ventana de contexto](#ia-e-modelos) de un [LLM](#ia-e-modelos).

---

## 1. ¿Qué es el Chunking y Por Qué es Necesario?

**Chunking (Fragmentación)** es el proceso de dividir documentos largos — PDFs, artículos, manuales técnicos — en fragmentos más pequeños llamados **chunks**. Cada chunk se transforma luego en un vector y se almacena en una [base de datos vectorial](#universo-dos-vetores).

### ¿Por qué no enviar el documento completo?

1. **Límite de la Context Window:** Los [LLMs](#ia-e-modelos) tienen un límite de [tokens](#ia-e-modelos) que pueden procesar por vez.
2. **Precisión de la búsqueda:** Chunks más pequeños tienen un significado más concentrado, generando embeddings más precisos en la [Búsqueda Vectorial](#busca-vetorial).
3. **Costo:** Enviar menos tokens al modelo = menor costo por solicitud.
4. **Calidad de la respuesta:** Entregar el fragmento exacto es mejor que entregar páginas enteras con información irrelevante.

---

## 2. Estrategias de Chunking

| Estrategia | Cómo Funciona | Cuándo Usar |
| :--------- | :------------ | :---------- |
| **Tamaño fijo** | Corta el texto cada N caracteres o tokens | Textos sin estructura clara (logs, transcripciones) |
| **Por oraciones** | Agrupa N oraciones por chunk | Textos narrativos, artículos |
| **Por párrafos** | Cada párrafo se convierte en un chunk | Documentación bien estructurada |
| **Recursivo** | Intenta dividir por párrafo → oración → carácter, en ese orden | Uso general (estándar de LangChain) |
| **Semántico** | Usa embeddings para detectar cambios de tema y corta en esos puntos | Textos largos con múltiples temas |
| **Por estructura** | Respeta la jerarquía del documento (H1, H2, listas) | Markdown, HTML, documentación técnica |

### Ejemplo práctico con tamaño fijo:

```python
texto = "La inteligencia artificial está transformando el mundo. Modelos de lenguaje..."

# Chunk size = 50 caracteres, overlap = 10
chunk_1 = "La inteligencia artificial está transformando el "
chunk_2 = "mando el mundo. Modelos de lenguaje..."
#          ^^^^^^^^^ overlap (repetición)
```

---

## 3. Overlap: ¿Por Qué Superponer Fragmentos?

El **Overlap (Superposición)** es la técnica de repetir el final de un chunk al inicio del siguiente. Sin overlap, la información que cae exactamente en la "frontera" entre dos chunks puede quedar cortada a la mitad y perderse.

### Sin overlap vs. con overlap:

```
Documento: "El reembolso debe solicitarse en un plazo de 30 días. Después de ese plazo, no hay garantía."

--- Sin Overlap (chunk_size=50) ---
Chunk 1: "El reembolso debe solicitarse en un plazo de 30 d"
Chunk 2: "ías. Después de ese plazo, no hay garantía."
→ Buscar "plazo de reembolso" puede no encontrar la conexión entre los chunks.

--- Con Overlap de 15 caracteres ---
Chunk 1: "El reembolso debe solicitarse en un plazo de 30 d"
Chunk 2: "zo de 30 días. Después de ese plazo, no hay garantía."
→ La conexión "30 días / plazo" está presente en ambos chunks.
```

### ¿Cuánto overlap usar?

- **Regla práctica:** 10-20% del tamaño del chunk.
- **Chunk de 500 tokens:** Overlap de 50-100 tokens.
- **Demasiado overlap:** Aumenta el almacenamiento y puede generar resultados duplicados.
- **Poco overlap:** Riesgo de perder contexto en las fronteras.

---

## 4. Metadata Filtering: Filtrar Antes de Buscar

El **Metadata Filtering (Filtro por Metadatos)** combina la búsqueda vectorial con filtros rígidos basados en atributos del documento. En lugar de buscar en **todos** los chunks, restringes la búsqueda a un subconjunto relevante.

### Ejemplos de metadatos útiles:

| Metadato | Ejemplo | Uso |
| :------- | :------ | :-- |
| `categoría` | "Financiero", "RRHH", "Jurídico" | Filtrar por departamento |
| `fecha_creacion` | "2024-01-15" | Buscar solo documentos recientes |
| `autor` | "María García" | Filtrar por responsable |
| `tipo_documento` | "contrato", "manual", "acta" | Segmentar por tipo |
| `idioma` | "es", "en" | Filtrar por lengua |

### ¿Cómo funciona en la práctica?

```python
# Búsqueda vectorial + filtro por metadatos
resultados = vector_db.query(
    query_embedding=embedding("política de reembolso"),
    filter={
        "categoría": "Financiero",
        "fecha_creacion": {"$gte": "2024-01-01"}
    },
    top_k=5
)
# Resultado: Solo chunks de la categoría "Financiero"
# creados a partir de 2024, ordenados por relevancia semántica.
```

Esto es especialmente poderoso en sistemas de [RAG](#rag-hibrida) empresariales, donde diferentes departamentos tienen documentos distintos y el usuario necesita respuestas específicas a su contexto.

---

## 5. Ventajas y Limitaciones

✅ El chunking permite que documentos de cualquier tamaño se utilicen en sistemas de [RAG](#rag-hibrida).

✅ El overlap garantiza que el contexto no se pierda en las fronteras entre chunks.

✅ El metadata filtering reduce drásticamente el espacio de búsqueda, mejorando velocidad y relevancia.

✅ Estrategias como el chunking semántico producen chunks con un significado más cohesivo.

⚠️ Un chunk demasiado pequeño pierde contexto; un chunk demasiado grande diluye el significado del embedding.

⚠️ Un overlap excesivo aumenta el almacenamiento y puede generar resultados duplicados.

⚠️ La elección de la estrategia de chunking depende del tipo de documento — no existe un "tamaño único".

⚠️ Los metadatos necesitan ser extraídos y mantenidos de forma consistente, lo que requiere un pipeline de ingesta bien construido.

---

## Relación con Otros Temas

El chunking es el **primer paso** del pipeline de [RAG](#rag-hibrida). Después de fragmentar los documentos, los chunks se transforman en embeddings y se almacenan en [bases vectoriales](#universo-dos-vetores). El tamaño de los chunks debe considerar la [Context Window](#ia-e-modelos) del modelo utilizado. La calidad del chunking impacta directamente en la [Búsqueda Vectorial](#busca-vetorial) y puede evaluarse con [métricas de calidad](#metricas-qualidade) como Precision y Recall.
