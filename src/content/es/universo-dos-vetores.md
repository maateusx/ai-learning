# Universo de los Vectores (Bases de Datos Vectoriales)

Imagina una biblioteca donde los libros no están organizados por orden alfabético, sino por **proximidad de significado**. Libros sobre cocina italiana quedan al lado de libros sobre pasta casera, aunque sus títulos no compartan ninguna palabra. Esa es la lógica detrás de las **Bases de Datos Vectoriales** — y son la infraestructura que hace posible la [Búsqueda Vectorial](#busca-vetorial) a escala.

---

## 1. ¿Qué es una Base de Datos Vectorial?

Una **Vector Database** es una base de datos especializada en almacenar, indexar y buscar **vectores** (listas de números que representan el significado de textos, imágenes o audios). A diferencia de las bases de datos tradicionales que buscan por correspondencia exacta (SQL `WHERE nombre = 'Juan'`), las vectoriales buscan por **similitud matemática**.

### Flujo básico:

1. Tus documentos pasan por [Chunking](#chunking) para ser divididos en fragmentos más pequeños.
2. Cada fragmento se transforma en un vector (embedding) mediante un modelo de IA.
3. El vector se almacena en la base vectorial junto con sus **metadatos** (categoría, fecha, autor, etc.).
4. En el momento de la búsqueda, la pregunta del usuario también se convierte en un vector, y la base encuentra los vecinos más cercanos.

---

## 2. Dimensiones: ¿Qué Significan los Números?

Cada vector es una lista de números decimales — y el tamaño de esa lista son las **dimensiones**. Un modelo de embedding común puede generar vectores con 768 o 1.536 dimensiones.

### ¿Cómo visualizarlo?

- **2 dimensiones:** Un punto en un gráfico X/Y (como un mapa).
- **3 dimensiones:** Un punto en el espacio 3D (como la posición de un dron).
- **768 dimensiones:** Imposible de visualizar, pero la misma lógica se aplica — cada dimensión captura una "característica" diferente del significado.

| Modelo de Embedding | Dimensiones | Uso Típico |
| :------------------ | :---------- | :--------- |
| `text-embedding-ada-002` (OpenAI) | 1.536 | Uso general |
| `all-MiniLM-L6-v2` (Sentence Transformers) | 384 | Ligero y rápido |
| `text-embedding-3-large` (OpenAI) | 3.072 | Alta precisión |
| `voyage-large-2` (Voyage AI) | 1.536 | Documentos largos |

### ¿Más dimensiones = mejor?

No siempre. Más dimensiones capturan más matices, pero exigen más memoria, más almacenamiento y búsquedas más lentas. La elección depende del equilibrio entre **precisión** y **rendimiento**.

---

## 3. ANN (Approximate Nearest Neighbor)

Cuando el usuario realiza una búsqueda, la base necesita comparar el vector de la pregunta con **millones** (o miles de millones) de vectores almacenados. Calcular la distancia exacta de cada uno sería imposible en tiempo real.

El **ANN (Vecino Más Cercano Aproximado)** resuelve esto usando "atajos" matemáticos que encuentran los vecinos más cercanos con ~99% de precisión, pero en una fracción del tiempo.

### Principales algoritmos:

| Algoritmo | Cómo Funciona | Pros | Contras |
| :-------- | :------------ | :--- | :------ |
| **HNSW** (Hierarchical Navigable Small World) | Crea un grafo en capas, como un mapa de metro con líneas expresas y locales | Muy rápido, alta precisión | Consume bastante memoria RAM |
| **IVF** (Inverted File Index) | Agrupa vectores en "barrios" y solo busca en los barrios más cercanos | Menor uso de memoria | Menos preciso que HNSW |
| **PQ** (Product Quantization) | Comprime los vectores para ocupar menos espacio, como un ZIP de números | Muy eficiente en almacenamiento | Pierde precisión en la compresión |
| **ScaNN** (Google) | Combina cuantización con búsqueda optimizada por hardware | Altísimo rendimiento | Más complejo de configurar |

En la práctica, la mayoría de las bases vectoriales usan **HNSW** como estándar por ofrecer el mejor equilibrio.

---

## 4. Herramientas Populares

| Herramienta | Tipo | Destacado |
| :---------- | :--- | :-------- |
| **Pinecone** | SaaS (gestionado) | Cero configuración, escalado automático |
| **Weaviate** | Open source | Soporte nativo para filtros por metadatos y módulos de IA |
| **Milvus** | Open source | Altísimo rendimiento para miles de millones de vectores |
| **Qdrant** | Open source | API moderna, filtros avanzados, escrito en Rust |
| **pgvector** | Extensión PostgreSQL | Ideal si ya usas PostgreSQL — agrega búsqueda vectorial sin cambiar de base |
| **ChromaDB** | Open source | Simple y ligero, excelente para prototipado |

### ¿Cuándo usar cada tipo?

- **¿Ya usas PostgreSQL?** Empieza con `pgvector` — menor complejidad operacional.
- **¿Necesitas escala masiva?** Milvus o Pinecone.
- **¿Prototipando?** ChromaDB o Qdrant.
- **¿Quieres filtros híbridos?** Weaviate o Qdrant (combinan búsqueda vectorial con [filtros por metadatos](#chunking)).

---

## 5. Ventajas y Limitaciones

✅ Permiten búsqueda semántica en tiempo real sobre millones de documentos.

✅ Se combinan naturalmente con [Búsqueda Híbrida](#busca-hibrida) cuando soportan filtros por metadatos.

✅ Los algoritmos ANN entregan resultados en milisegundos incluso con grandes volúmenes.

✅ Ecosistema maduro con opciones open source y gestionadas.

⚠️ Requieren un modelo de embedding para generar los vectores — cambiar de modelo requiere re-indexación total.

⚠️ HNSW consume memoria RAM proporcional al número de vectores almacenados.

⚠️ La calidad de la búsqueda depende directamente de la calidad del embedding y del [Chunking](#chunking).

⚠️ A diferencia de SQL, no hay un lenguaje de consulta estandarizado entre las diferentes bases.

---

## Relación con Otros Temas

Las bases vectoriales son la **infraestructura** que sustenta la [Búsqueda Vectorial](#busca-vetorial). Antes de almacenar los vectores, los documentos necesitan pasar por [Chunking](#chunking) para ser divididos en fragmentos adecuados. En el momento de la búsqueda, los resultados de la base vectorial pueden combinarse con búsqueda por palabras clave en la [Búsqueda Híbrida](#busca-hibrida) y refinarse mediante [Cross-Encoders](#cross-encoders) para máxima precisión. La calidad final puede medirse con [métricas como Precision y NDCG](#metricas-qualidade).
