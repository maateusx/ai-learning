# Búsqueda Híbrida (Hybrid Search)

Ya vimos que la **Búsqueda por Palabras Clave (BM25)** es excelente para encontrar términos exactos, y que la **Búsqueda Vectorial** es excelente para entender la intención del usuario. Pero ¿y si pudiéramos usar las dos al mismo tiempo? Esa es la idea de la **Búsqueda Híbrida**: combinar lo mejor de ambos mundos para entregar resultados mucho más completos y relevantes.

## 1. ¿Por qué combinar?

Cada método de búsqueda tiene puntos ciegos:

- **BM25 solo:** Si el usuario busca _"cómo evitar que mi app se cuelgue"_, BM25 busca las palabras literales. Puede que no encuentre un artículo llamado _"Manejo de Excepciones en Aplicaciones Móviles"_, que es exactamente lo que el usuario necesita.
- **Búsqueda Vectorial sola:** Si el usuario busca el código de error `SIGKILL_9`, la búsqueda vectorial puede intentar "entender el significado" y devolver artículos genéricos sobre señales de proceso, perdiendo el documento que menciona el código exacto.

La Búsqueda Híbrida elimina estos puntos ciegos ejecutando **ambas búsquedas en paralelo** y combinando sus resultados.

---

## 2. ¿Cómo funciona en la práctica?

El flujo de una Búsqueda Híbrida sigue cuatro etapas:

1.  **Recibir la consulta:** El usuario escribe su pregunta o término de búsqueda.
2.  **Ejecutar en paralelo:**
    - **BM25** recorre el índice textual y devuelve sus Top-N resultados con puntuaciones estadísticas.
    - La **Búsqueda Vectorial** compara el embedding de la consulta con los vectores de la base y devuelve sus Top-N resultados con puntuaciones de similitud.
3.  **Fusionar los rankings:** Un algoritmo de fusión (como el **RRF — Reciprocal Rank Fusion**) combina las dos listas en un único ranking final. No intenta sumar notas de escalas diferentes; en su lugar, usa la **posición** de cada resultado en cada lista.
4.  **Entregar al usuario:** La lista final, reordenada, se presenta como resultado.

```
Consulta del Usuario
       │
       ├──────────────────┐
       ▼                  ▼
   [ BM25 ]        [ Vectorial ]
   Top-N results   Top-N results
       │                  │
       └────────┬─────────┘
                ▼
         [ Fusión (RRF) ]
                │
                ▼
        Lista Final Unificada
```

---

## 3. ¿Por qué no simplemente sumar las puntuaciones?

Este es un error común. Las puntuaciones de cada método viven en **escalas completamente diferentes**:

| Método   | Escala típica | Qué significa                       |
| :------- | :------------ | :---------------------------------- |
| BM25     | 0 a ~50+      | Relevancia estadística de términos  |
| Vectorial | 0.0 a 1.0    | Similitud del coseno en el espacio  |

Sumar 42.5 (BM25) con 0.87 (vectorial) no tiene sentido — BM25 dominaría completamente el resultado. Por eso usamos técnicas basadas en **ranking** (como RRF) en vez de puntuaciones absolutas.

---

## 4. Ejemplo Concreto

Imagina una base de documentación técnica. El usuario busca: _"timeout en la conexión con la base de datos"_.

**Resultados de BM25 (términos exactos):**

| Posición | Documento                                       |
| :------- | :----------------------------------------------- |
| 1.°      | "Configurando timeout de conexión en PostgreSQL" |
| 2.°      | "Parámetros de timeout del connection pool"      |
| 3.°      | "Log de errores: connection timeout"             |

**Resultados de la Búsqueda Vectorial (semántica):**

| Posición | Documento                                         |
| :------- | :------------------------------------------------ |
| 1.°      | "Troubleshooting de latencia en la base de datos" |
| 2.°      | "Configurando timeout de conexión en PostgreSQL"  |
| 3.°      | "Cómo manejar conexiones lentas en producción"    |

**Después de la fusión con RRF:**

| Posición | Documento                                        | ¿Por qué subió?                    |
| :------- | :----------------------------------------------- | :--------------------------------- |
| 1.°      | "Configurando timeout de conexión en PostgreSQL" | 1.° en BM25 + 2.° en Vectorial    |
| 2.°      | "Troubleshooting de latencia en la base de datos"| 1.° en Vectorial (semántica fuerte)|
| 3.°      | "Parámetros de timeout del connection pool"      | 2.° en BM25 (término exacto)      |

El documento que apareció bien en **ambas** listas subió al primer lugar — ese es el poder del enfoque híbrido.

---

## 5. ¿Dónde se usa la Búsqueda Híbrida?

La Búsqueda Híbrida se ha convertido en el **estándar de la industria** para sistemas de [RAG (Retrieval-Augmented Generation)](#rag-hibrida):

- **Chatbots con base de conocimiento:** El chatbot necesita encontrar el fragmento exacto de la documentación (BM25) y también entender preguntas formuladas de formas diferentes (vectorial).
- **E-commerce:** Buscar por el SKU exacto `NKE-AF1-42` (BM25) y también por _"zapatillas blancas clásicas"_ (vectorial).
- **Documentación técnica:** Encontrar el código de error `ERR_CERT_AUTHORITY_INVALID` (BM25) y también _"mi sitio muestra que no es seguro"_ (vectorial).

### Herramientas con soporte nativo

Diversas bases de datos y plataformas ya ofrecen Búsqueda Híbrida como funcionalidad integrada:

- **Weaviate:** El parámetro `alpha` controla el peso entre BM25 y vectorial.
- **Elasticsearch:** Combina queries `match` (BM25) con `knn` (vectorial) vía `sub_searches`.
- **Pinecone:** Soporta sparse + dense vectors en un único índice.
- **Supabase:** Combina `tsvector` (full-text) con `pgvector` (embeddings) en PostgreSQL.

---

## 6. Ventajas y Limitaciones

**Cobertura completa:** Captura tanto términos exactos como intención semántica.

**Robustez:** Si un método falla en encontrar algo, el otro compensa.

**Estándar de la industria:** Ampliamente soportado por bases vectoriales modernas.

**Mejora medible:** Los estudios muestran ganancias consistentes de relevancia sobre cualquier método aislado.

**Mayor complejidad:** Dos índices que mantener (textual + vectorial), más infraestructura y costo.

**Latencia:** Dos búsquedas en paralelo + fusión toman más tiempo que una búsqueda simple.

**Tuning:** La proporción ideal entre los métodos puede variar por dominio y requiere experimentación.

---

## Conclusión

La Búsqueda Híbrida es el reconocimiento práctico de que ningún método de búsqueda es perfecto por sí solo. Al combinar la precisión literal de BM25 con la comprensión semántica de la Búsqueda Vectorial, creamos sistemas que entienden tanto _lo que el usuario escribió_ como _lo que quiso decir_. Es la base sobre la cual técnicas más avanzadas — como **RRF** para fusión y **Cross-Encoders** para reranking — construyen resultados aún mejores.
