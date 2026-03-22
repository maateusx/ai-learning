# GraphRAG (Knowledge Graphs)

Traditional RAG retrieves **text chunks** and passes them to the LLM. This works well for direct questions, but fails when the answer depends on **connections between entities** scattered across multiple documents. **GraphRAG** solves this by building a **Knowledge Graph** from the documents and using the graph structure for retrieval — capturing relationships that vector search simply cannot see.

---

## 1. The problem that GraphRAG solves

Consider this document base from a company:

- **Doc A:** _"Maria Silva is the tech lead of the payments team."_
- **Doc B:** _"The payments team is responsible for the Stripe integration."_
- **Doc C:** _"The Stripe integration has latency above the SLA."_

**Question:** _"Who is responsible for the Stripe latency issue?"_

| Approach | Result |
| :--- | :--- |
| Vector RAG | Retrieves Doc C (most semantically similar). Does not find Maria. |
| GraphRAG | Follows the path: Stripe → payments team → Maria Silva. Answers correctly. |

The graph connects the dots between documents that similarity search treats as independent.

---

## 2. How does GraphRAG work?

The pipeline has two phases: **graph construction** (indexing) and **graph-based retrieval** (querying).

### Phase 1 — Knowledge Graph Construction

```
Raw Documents
       │
       ▼
[ Entity and Relationship Extraction (LLM) ]
       │
       ▼
  ┌─────────────────────────────────┐
  │        Knowledge Graph          │
  │                                 │
  │  (Maria)──[tech lead]──►(Payments)
  │                            │    │
  │                       [responsible]
  │                            │    │
  │                            ▼    │
  │                        (Stripe) │
  │                            │    │
  │                       [has issue]
  │                            │    │
  │                            ▼    │
  │                      (Latency) │
  └─────────────────────────────────┘
```

**Construction steps:**

1. **Entity extraction:** The LLM identifies people, teams, technologies, concepts — the **nodes** of the graph.
2. **Relationship extraction:** The LLM identifies how entities connect — the **edges** of the graph (e.g., "is leader of", "depends on", "caused").
3. **Entity resolution:** Unifying references to the same entity (_"Maria"_, _"Maria Silva"_, _"the tech lead"_ → same node).
4. **Community Detection:** Grouping densely connected nodes into **communities** that represent themes or domains.
5. **Community Summaries:** Generating summaries of each community for high-level searches.

### Phase 2 — Graph-based Retrieval

```
User Query
       │
       ▼
[ Extract entities from query ]
       │
       ▼
[ Locate entities in graph ]
       │
       ▼
[ Expand neighborhood (1-2 hops) ]
       │
       ▼
[ Collect relevant subgraph ]
       │
       ▼
[ Convert subgraph to textual context ]
       │
       ▼
[ LLM generates answer ]
```

The retrieval finds the entities mentioned in the question, expands to neighboring nodes (1-2 hops in the graph), and assembles a context that preserves the **explicit relationships** between concepts.

---

## 3. Local vs Global Search

The original Microsoft paper on GraphRAG introduces two search modes:

### Local Search

- Starts from specific entities mentioned in the query
- Expands the neighborhood in the graph
- Ideal for: _"What projects does Maria lead?"_

### Global Search

- Uses **community summaries** instead of individual nodes
- Aggregates information from multiple communities
- Ideal for: _"What are the main technical challenges at the company?"_

```
                    ┌─────────────┐
                    │   Query     │
                    └──────┬──────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
         [ Local Search ]      [ Global Search ]
                │                     │
                ▼                     ▼
       Entities + Neighbors   Community Summaries
                │                     │
                ▼                     ▼
        Specific answer       Thematic answer
```

---

## 4. Practical Knowledge Graph Construction

### Extraction prompt (simplified)

The LLM receives each text chunk with a prompt like:

```
Given the text below, extract all entities and relationships.

Output format:
Entities: (name, type, description)
Relationships: (source_entity, relationship_type, target_entity, description)

Text: "Maria Silva is the tech lead of the payments team.
The team migrated to Stripe in January 2024."
```

**Expected output:**

```
Entities:
- (Maria Silva, Person, "Tech lead of the payments team")
- (Payments Team, Team, "Team responsible for payments")
- (Stripe, Technology, "Payments platform")

Relationships:
- (Maria Silva, IS_LEADER_OF, Payments Team, "Tech lead")
- (Payments Team, USES, Stripe, "Migration in Jan/2024")
```

### Storage

The graph is typically stored in:

| Database | Type | When to use |
| :--- | :--- | :--- |
| Neo4j | Native graph database | Large graphs, complex queries with Cypher |
| NetworkX | Python library | Prototyping, small in-memory graphs |
| Amazon Neptune | Managed graph DB | Production on AWS |
| FalkorDB | Redis-based graph | Low latency, Redis integration |

---

## 5. Concrete Example

Knowledge base of a hospital:

**Constructed graph:**
```
(Dr. Santos)──[treats]──►(Cardiology)
                              │
                         [treats]
                              │
                              ▼
                     (Heart Failure)
                              │
                        [medication]
                              │
                              ▼
                        (Enalapril)──[interacts with]──►(Ibuprofen)
```

**Question:** _"Is there a risk in prescribing ibuprofen to Dr. Santos' patients?"_

**Graph retrieval:**
1. Locates `Dr. Santos`
2. Expands: Dr. Santos → Cardiology → Heart Failure → Enalapril
3. Finds relationship: Enalapril **interacts with** Ibuprofen
4. Context for the LLM includes the entire chain of relationships

**Answer:** _"Yes. Dr. Santos treats cardiology patients, and his patients with heart failure frequently use Enalapril, which has a known drug interaction with Ibuprofen."_

A vector search would hardly connect "Dr. Santos" to "Ibuprofen" — they are semantically distant concepts.

---

## 6. Hybrid GraphRAG

In practice, the best implementations combine GraphRAG with vector search:

```
Query
   │
   ├──► [ Vector Search ] ──► Relevant chunks
   │
   └──► [ Graph Search ] ──► Subgraph with relationships
                │
                ▼
     [ Merge contexts ]
                │
                ▼
         [ LLM generates answer ]
```

Vector search brings rich textual context, while the graph brings structured relationships. Together, they cover both semantic depth and entity connectivity.

---

## 7. Advantages and Limitations

**Explicit relationships:** Captures connections between entities that vector search misses completely.

**Multi-hop reasoning:** Answers questions that require following chains of relationships (A → B → C → D).

**Global understanding:** Community summaries enable questions about broad themes, not just specific facts.

**Explainability:** The path in the graph shows exactly how the answer was derived.

**Indexing cost:** Extracting entities and relationships with an LLM is expensive — each chunk requires a call.

**Extraction quality:** Errors in entity extraction propagate throughout the entire graph. Entity resolution is especially difficult.

**Maintenance:** Updated documents require re-extraction and graph updates.

**Complexity:** Requires expertise in graph databases, entity modeling, and traversal query tuning.

---

## Conclusion

GraphRAG transforms unstructured documents into a structured knowledge network, where **relationships between concepts** are first-class citizens. It is especially powerful for domains where the answer depends on connecting scattered information — healthcare, compliance, complex organizations, technical knowledge bases. The cost of building and maintaining the graph is significant, but the quality gain for multi-hop and reasoning questions is something no other RAG technique can match.
