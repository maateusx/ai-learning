# GraphRAG (Knowledge Graphs)

El RAG tradicional recupera **chunks de texto** y los pasa al LLM. Esto funciona bien para preguntas directas, pero falla cuando la respuesta depende de **conexiones entre entidades** esparcidas por varios documentos. El **GraphRAG** resuelve esto construyendo un **Knowledge Graph** (grafo de conocimiento) a partir de los documentos y usando la estructura del grafo para retrieval — capturando relaciones que la búsqueda vectorial simplemente no detecta.

---

## 1. El problema que GraphRAG resuelve

Considera esta base de documentos de una empresa:

- **Doc A:** _"María Silva es la tech lead del equipo de pagos."_
- **Doc B:** _"El equipo de pagos es responsable de la integración con Stripe."_
- **Doc C:** _"La integración con Stripe tiene latencia por encima del SLA."_

**Pregunta:** _"¿Quién es responsable del problema de latencia en Stripe?"_

| Enfoque | Resultado |
| :--- | :--- |
| RAG vectorial | Recupera Doc C (más similar semánticamente). No encuentra a María. |
| GraphRAG | Sigue el camino: Stripe → equipo de pagos → María Silva. Responde correctamente. |

El grafo conecta los puntos entre documentos que la búsqueda por similitud trata como independientes.

---

## 2. ¿Cómo funciona GraphRAG?

El pipeline tiene dos fases: **construcción del grafo** (indexación) y **retrieval basado en grafo** (consulta).

### Fase 1 — Construcción del Knowledge Graph

```
Documentos Brutos
       │
       ▼
[ Extracción de Entidades y Relaciones (LLM) ]
       │
       ▼
  ┌─────────────────────────────────┐
  │        Knowledge Graph          │
  │                                 │
  │  (María)──[tech lead]──►(Pagos) │
  │                            │    │
  │                       [responsable]
  │                            │    │
  │                            ▼    │
  │                        (Stripe) │
  │                            │    │
  │                       [tiene issue]
  │                            │    │
  │                            ▼    │
  │                      (Latencia) │
  └─────────────────────────────────┘
```

**Etapas de la construcción:**

1. **Extracción de entidades:** El LLM identifica personas, equipos, tecnologías, conceptos — los **nodos** del grafo.
2. **Extracción de relaciones:** El LLM identifica cómo las entidades se conectan — las **aristas** del grafo (ej: "es líder de", "depende de", "causó").
3. **Resolución de entidades:** Unificar referencias a la misma entidad (_"María"_, _"María Silva"_, _"la tech lead"_ → mismo nodo).
4. **Community Detection:** Agrupar nodos densamente conectados en **comunidades** que representan temas o dominios.
5. **Community Summaries:** Generar resúmenes de cada comunidad para búsquedas de alto nivel.

### Fase 2 — Retrieval basado en grafo

```
Consulta del Usuario
       │
       ▼
[ Extraer entidades de la consulta ]
       │
       ▼
[ Localizar entidades en el grafo ]
       │
       ▼
[ Expandir vecindario (1-2 hops) ]
       │
       ▼
[ Recolectar subgrafo relevante ]
       │
       ▼
[ Convertir subgrafo en contexto textual ]
       │
       ▼
[ LLM genera respuesta ]
```

El retrieval encuentra las entidades mencionadas en la pregunta, expande a los nodos vecinos (1-2 saltos en el grafo) y construye un contexto que preserva las **relaciones explícitas** entre los conceptos.

---

## 3. Local vs Global Search

El paper original de Microsoft sobre GraphRAG introduce dos modos de búsqueda:

### Local Search

- Parte de entidades específicas mencionadas en la query
- Expande el vecindario en el grafo
- Ideal para: _"¿Qué proyectos lidera María?"_

### Global Search

- Usa los **community summaries** en lugar de nodos individuales
- Agrega información de múltiples comunidades
- Ideal para: _"¿Cuáles son los principales desafíos técnicos de la empresa?"_

```
                    ┌─────────────┐
                    │   Consulta  │
                    └──────┬──────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
         [ Local Search ]      [ Global Search ]
                │                     │
                ▼                     ▼
       Entidades + Vecinos   Community Summaries
                │                     │
                ▼                     ▼
        Respuesta específica    Respuesta temática
```

---

## 4. Construcción práctica del Knowledge Graph

### Prompt de extracción (simplificado)

El LLM recibe cada chunk de texto con un prompt como:

```
Dado el texto a continuación, extrae todas las entidades y relaciones.

Formato de salida:
Entidades: (nombre, tipo, descripción)
Relaciones: (entidad_origen, tipo_relación, entidad_destino, descripción)

Texto: "María Silva es la tech lead del equipo de pagos.
El equipo migró a Stripe en enero de 2024."
```

**Salida esperada:**

```
Entidades:
- (María Silva, Persona, "Tech lead del equipo de pagos")
- (Equipo de Pagos, Equipo, "Equipo responsable de pagos")
- (Stripe, Tecnología, "Plataforma de pagos")

Relaciones:
- (María Silva, ES_LÍDER_DE, Equipo de Pagos, "Tech lead")
- (Equipo de Pagos, UTILIZA, Stripe, "Migración en Ene/2024")
```

### Almacenamiento

El grafo se almacena típicamente en:

| Base de datos | Tipo | Cuándo usar |
| :--- | :--- | :--- |
| Neo4j | Base de grafos nativa | Grafos grandes, queries complejas con Cypher |
| NetworkX | Biblioteca Python | Prototipado, grafos pequeños en memoria |
| Amazon Neptune | Managed graph DB | Producción en AWS |
| FalkorDB | Redis-based graph | Baja latencia, integración con Redis |

---

## 5. Ejemplo Concreto

Base de conocimiento de un hospital:

**Grafo construido:**
```
(Dr. Santos)──[atiende]──►(Cardiología)
                              │
                         [trata]
                              │
                              ▼
                     (Insuficiencia Cardíaca)
                              │
                        [medicamento]
                              │
                              ▼
                        (Enalapril)──[interactúa con]──►(Ibuprofeno)
```

**Pregunta:** _"¿Hay riesgo en prescribir ibuprofeno a pacientes del Dr. Santos?"_

**Retrieval en el grafo:**
1. Localiza `Dr. Santos`
2. Expande: Dr. Santos → Cardiología → Insuficiencia Cardíaca → Enalapril
3. Encuentra relación: Enalapril **interactúa con** Ibuprofeno
4. El contexto para el LLM incluye toda la cadena de relaciones

**Respuesta:** _"Sí. El Dr. Santos atiende cardiología y sus pacientes con insuficiencia cardíaca frecuentemente usan Enalapril, que tiene interacción medicamentosa conocida con Ibuprofeno."_

Una búsqueda vectorial difícilmente conectaría "Dr. Santos" con "Ibuprofeno" — son conceptos distantes semánticamente.

---

## 6. GraphRAG Híbrido

En la práctica, las mejores implementaciones combinan GraphRAG con búsqueda vectorial:

```
Consulta
   │
   ├──► [ Búsqueda Vectorial ] ──► Chunks relevantes
   │
   └──► [ Búsqueda en el Grafo ] ──► Subgrafo con relaciones
                │
                ▼
     [ Merge de los contextos ]
                │
                ▼
         [ LLM genera respuesta ]
```

La búsqueda vectorial trae contexto textual rico, mientras que el grafo trae relaciones estructuradas. Juntos, cubren tanto la profundidad semántica como la conectividad entre entidades.

---

## 7. Ventajas y Limitaciones

**Relaciones explícitas:** Captura conexiones entre entidades que la búsqueda vectorial pierde completamente.

**Razonamiento multi-hop:** Responde preguntas que requieren seguir cadenas de relaciones (A → B → C → D).

**Global understanding:** Los community summaries permiten preguntas sobre temas amplios, no solo hechos puntuales.

**Explicabilidad:** El camino en el grafo muestra exactamente cómo se derivó la respuesta.

**Costo de indexación:** Extraer entidades y relaciones con LLM es costoso — cada chunk requiere una llamada.

**Calidad de la extracción:** Errores en la extracción de entidades se propagan por todo el grafo. La resolución de entidades es especialmente difícil.

**Mantenimiento:** Documentos actualizados requieren re-extracción y actualización del grafo.

**Complejidad:** Requiere experiencia en bases de datos de grafos, modelado de entidades y tuning de queries de traversal.

---

## Conclusión

GraphRAG transforma documentos no estructurados en una red de conocimiento estructurado, donde las **relaciones entre conceptos** son ciudadanos de primera clase. Es especialmente poderoso para dominios donde la respuesta depende de conectar información dispersa — salud, compliance, organizaciones complejas, bases de conocimiento técnico. El costo de construcción y mantenimiento del grafo es significativo, pero la ganancia en calidad para preguntas multi-hop y de razonamiento es algo que ninguna otra técnica de RAG puede igualar.
