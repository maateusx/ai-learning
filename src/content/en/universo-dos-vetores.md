# The Vector Universe (Vector Databases)

Imagine a library where books aren't organized alphabetically, but by **closeness of meaning**. Books about Italian cuisine sit next to books about homemade pasta, even if their titles don't share a single word. That's the logic behind **Vector Databases** — and they are the infrastructure that makes [Vector Search](#busca-vetorial) possible at scale.

---

## 1. What is a Vector Database?

A **Vector Database** is a database specialized in storing, indexing, and searching **vectors** (lists of numbers that represent the meaning of texts, images, or audio). Unlike traditional databases that search by exact match (SQL `WHERE name = 'John'`), vector databases search by **mathematical similarity**.

### Basic flow:

1. Your documents go through [Chunking](#chunking) to be split into smaller pieces.
2. Each piece is transformed into a vector (embedding) by an AI model.
3. The vector is stored in the vector database along with its **metadata** (category, date, author, etc.).
4. At search time, the user's query is also converted into a vector, and the database finds the nearest neighbors.

---

## 2. Dimensions: What the Numbers Mean

Each vector is a list of decimal numbers — and the length of that list is its **dimensionality**. A typical embedding model might generate vectors with 768 or 1,536 dimensions.

### How to visualize it?

- **2 dimensions:** A point on an X/Y graph (like a map).
- **3 dimensions:** A point in 3D space (like the position of a drone).
- **768 dimensions:** Impossible to visualize, but the same logic applies — each dimension captures a different "characteristic" of the meaning.

| Embedding Model | Dimensions | Typical Use |
| :------------------ | :-------- | :--------- |
| `text-embedding-ada-002` (OpenAI) | 1,536 | General purpose |
| `all-MiniLM-L6-v2` (Sentence Transformers) | 384 | Lightweight and fast |
| `text-embedding-3-large` (OpenAI) | 3,072 | High precision |
| `voyage-large-2` (Voyage AI) | 1,536 | Long documents |

### More dimensions = better?

Not always. More dimensions capture more nuances but require more memory, more storage, and slower searches. The choice depends on the tradeoff between **accuracy** and **performance**.

---

## 3. ANN (Approximate Nearest Neighbor)

When a user performs a search, the database needs to compare the query vector against **millions** (or billions) of stored vectors. Computing the exact distance to each one would be impossible in real time.

**ANN (Approximate Nearest Neighbor)** solves this by using mathematical "shortcuts" that find the closest neighbors with ~99% accuracy, but in a fraction of the time.

### Main algorithms:

| Algorithm | How It Works | Pros | Cons |
| :-------- | :------------ | :--- | :------ |
| **HNSW** (Hierarchical Navigable Small World) | Creates a layered graph, like a subway map with express and local lines | Very fast, high accuracy | Consumes significant RAM |
| **IVF** (Inverted File Index) | Groups vectors into "neighborhoods" and only searches the nearest ones | Lower memory usage | Less accurate than HNSW |
| **PQ** (Product Quantization) | Compresses vectors to take up less space, like a ZIP for numbers | Very storage-efficient | Loses accuracy due to compression |
| **ScaNN** (Google) | Combines quantization with hardware-optimized search | Extremely high performance | More complex to configure |

In practice, most vector databases use **HNSW** as the default because it offers the best balance.

---

## 4. Popular Tools

| Tool | Type | Highlight |
| :--------- | :--- | :------- |
| **Pinecone** | SaaS (managed) | Zero configuration, auto-scaling |
| **Weaviate** | Open source | Native support for metadata filters and AI modules |
| **Milvus** | Open source | Extremely high performance for billions of vectors |
| **Qdrant** | Open source | Modern API, advanced filters, written in Rust |
| **pgvector** | PostgreSQL extension | Ideal if you already use PostgreSQL — adds vector search without switching databases |
| **ChromaDB** | Open source | Simple and lightweight, great for prototyping |

### When to use each type?

- **Already using PostgreSQL?** Start with `pgvector` — minimal operational complexity.
- **Need massive scale?** Milvus or Pinecone.
- **Prototyping?** ChromaDB or Qdrant.
- **Want hybrid filters?** Weaviate or Qdrant (they combine vector search with [metadata filters](#chunking)).

---

## 5. Advantages and Limitations

Enables real-time semantic search across millions of documents.

Naturally combines with [Hybrid Search](#busca-hibrida) when metadata filters are supported.

ANN algorithms deliver results in milliseconds even at large scale.

Mature ecosystem with both open-source and managed options.

Requires an embedding model to generate vectors — changing models requires full re-indexing.

HNSW consumes RAM proportional to the number of stored vectors.

Search quality depends directly on the quality of the embedding and the [Chunking](#chunking).

Unlike SQL, there is no standardized query language across different vector databases.

---

## Relationship to Other Topics

Vector databases are the **infrastructure** that powers [Vector Search](#busca-vetorial). Before storing vectors, documents need to go through [Chunking](#chunking) to be split into appropriate pieces. At search time, results from the vector database can be combined with keyword search in [Hybrid Search](#busca-hibrida) and refined by [Cross-Encoders](#cross-encoders) for maximum accuracy. The final quality can be measured with [metrics like Precision and NDCG](#metricas-qualidade).
