# Hyperbolic Embeddings

So far, all the embeddings we've seen live in **Euclidean space** — the "flat" space we learned about in school. But many real-world data have a natural **hierarchical** structure: taxonomies, category trees, "is-a-type-of" relationships. Euclidean space is terrible at representing hierarchies. **Hyperbolic space** solves this — it has exponentially growing space as we move away from the center, just like a tree that branches out.

---

## 1. The Euclidean Space Problem

Imagine you need to represent this taxonomy as embeddings:

```
                    Animal
                   /      \
            Mammal        Reptile
           /    |    \        \
        Dog    Cat  Whale    Snake
       / | \
   Poodle Labrador Husky
```

In Euclidean (flat) space, to maintain the correct distances between all nodes:
- `Poodle` should be close to `Labrador` (siblings)
- `Poodle` should be at a medium distance from `Cat` (cousins)
- `Poodle` should be far from `Snake` (distant relatives)

The problem is that **a tree with depth `d` has up to `2^d` leaves**, but Euclidean space in dimension `n` grows only polynomially. To represent a tree with thousands of leaves without distortion, you'd need **hundreds of dimensions**.

| Space | "Volume" Growth | Ideal for |
| :--- | :--- | :--- |
| Euclidean (ℝⁿ) | Polynomial (~rⁿ) | "Flat" data, symmetric clusters |
| Hyperbolic (ℍⁿ) | Exponential (~eʳ) | Hierarchies, trees, scale-free graphs |

---

## 2. What Is Hyperbolic Space?

Hyperbolic space is a geometry where the **available space grows exponentially** as we move away from the origin. Think of a disk where the edge has "infinitely more space" than the center.

### Poincaré Disk Model

The most commonly used model for hyperbolic embeddings is the **Poincaré Disk**: a disk of radius 1 where:

- The **center** represents the root node (general concepts)
- The **edge** represents the leaves (specific concepts)
- The **hyperbolic distance** grows very fast near the edge

```
         ┌─────────────────────┐
        │                       │
       │      ○ Animal           │
      │       │                   │
     │    ○ Mammal    ○ Reptile    │
     │   / |    \        \         │
    │ ○Dog ○Cat ○Whale    ○Snake    │
    │  /|\                          │
   │○P ○L ○H                        │
    │                               │
     │          (edge = ∞)         │
      └───────────────────────────┘
          Poincaré Disk
```

Small movements in Euclidean space near the edge correspond to **enormous distances** in hyperbolic space. This allows tree leaves to "fit" with correct distances between them, even in low dimensions.

### Hyperbolic Distance

In the Poincaré Disk, the distance between two points `u` and `v` is:

```
d(u, v) = arcosh(1 + 2 · ‖u - v‖² / ((1 - ‖u‖²)(1 - ‖v‖²)))
```

Notice that when `‖u‖` or `‖v‖` approach 1 (edge of the disk), the denominator goes to zero and the distance **explodes** — that's what creates the exponential space.

---

## 3. Why Does This Matter for RAG?

Many knowledge bases have an implicit hierarchical structure:

- **Technical documentation:** General concepts → specific topics → implementation details
- **E-commerce:** Category → subcategory → product → variant
- **Medicine:** System → organ → disease → treatment → medication
- **Organizations:** Company → department → team → member

With Euclidean embeddings, questions that depend on **hierarchical level** get confused:

**Question:** _"What is a mammal?"_ (general concept)
**vs.**
**Question:** _"What are the specific characteristics of a Poodle?"_ (specific concept)

With hyperbolic embeddings, the **radial position** (distance from center) naturally encodes the level of generality/specificity, and the system can use this for more precise retrieval.

---

## 4. Hyperbolic Embeddings in Practice

### Training

The embeddings are trained similarly to Euclidean ones, but with adaptations:

1. **Mapping to hyperbolic space:** Project vectors onto the Poincaré Disk.
2. **Adapted operations:** Gradients and optimization require **Riemannian SGD** (gradient descent adapted for hyperbolic geometry) instead of standard SGD.
3. **Loss function:** Uses hyperbolic distance instead of cosine similarity.

### Dimensional Comparison

The great practical advantage: hyperbolic embeddings need **far fewer dimensions** to represent hierarchies with fidelity.

| Metric | Euclidean | Hyperbolic |
| :--- | :--- | :--- |
| Dimensions to represent WordNet | 200 | **5-10** |
| Distortion (MAP) | High in low dim. | Low even in low dim. |
| Storage cost | High | Significantly lower |

---

## 5. Concrete Example — E-commerce

Product base with hierarchy:

```
Electronics
├── Smartphones
│   ├── iPhone 15 Pro
│   ├── Galaxy S24
│   └── Pixel 8
├── Laptops
│   ├── MacBook Pro M3
│   ├── ThinkPad X1
│   └── Dell XPS 15
└── Accessories
    ├── USB-C Charger
    ├── iPhone Case
    └── Bluetooth Mouse
```

**With Euclidean embedding:**
- _"phone accessory"_ might return `Bluetooth Mouse` (it's close in Euclidean space because they're all "accessories").

**With hyperbolic embedding:**
- `Smartphones` and `Accessories` are at the same hierarchical level
- `iPhone Case` is close to `iPhone 15 Pro` via the hierarchical relationship
- The system understands that _"phone accessory"_ should search at the intersection of `Accessories` and `Smartphones`, returning `iPhone Case` and `USB-C Charger`.

---

## 6. Advantages and Limitations

**Natural hierarchy representation:** Encodes tree structures with very high fidelity, something Euclidean embeddings cannot achieve.

**Dimensional efficiency:** Fewer dimensions for the same representation quality — savings in storage and computation.

**Built-in abstraction level:** The radial distance from the center encodes whether a concept is general or specific.

**Mathematical complexity:** Operations in hyperbolic space (gradients, averages, interpolations) are significantly more complex than in Euclidean space.

**Immature tooling:** Most vector databases (Pinecone, Weaviate, Qdrant) operate exclusively in Euclidean space. Integrating hyperbolic embeddings requires custom work.

**Not everything is hierarchical:** For data without a clear hierarchical structure, Euclidean embeddings work equally well or better.

**Harder training:** Riemannian SGD is more unstable and slower than standard SGD; it requires careful tuning.

---

## Conclusion

Hyperbolic Embeddings are a powerful tool for domains where hierarchy is fundamental — taxonomies, ontologies, knowledge graphs. They solve a real mathematical limitation of Euclidean space, offering more faithful representations in fewer dimensions. They are still an emerging technology in the RAG context, but as vector databases add native support, they should become the natural choice for any knowledge base with a tree structure.
