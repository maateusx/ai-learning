# Patrón Orchestrator-Worker

Cuando una tarea es demasiado compleja para que un único agente la resuelva de una vez, necesitamos coordinación. El patrón **Orchestrator-Worker** resuelve esto con una división clara: un **orquestador** central que planifica y delega, y múltiples **workers** especializados que ejecutan. Es el mismo principio de un tech lead que divide una feature en tareas y las distribuye al equipo.

---

## 1. ¿Cómo funciona?

```
┌──────────────────────────────────────────────┐
│              ORCHESTRATOR                     │
│                                              │
│  1. Recibe la tarea                          │
│  2. Analiza y descompone en subtareas        │
│  3. Delega a workers apropiados              │
│  4. Recopila y sintetiza los resultados      │
│  5. Entrega respuesta final                  │
└────────────┬──────────┬──────────┬───────────┘
             │          │          │
             ▼          ▼          ▼
        ┌────────┐ ┌────────┐ ┌────────┐
        │Worker A│ │Worker B│ │Worker C│
        │(Búsq.) │ │(Código)│ │(Anális)│
        └────────┘ └────────┘ └────────┘
```

### Responsabilidades del Orchestrator

| Responsabilidad | Qué hace |
| :--- | :--- |
| **Descomposición** | Divide la tarea original en subtareas independientes |
| **Enrutamiento** | Decide cuál worker es el mejor para cada subtarea |
| **Paralelización** | Identifica cuáles subtareas pueden ejecutarse en paralelo |
| **Síntesis** | Combina las salidas de los workers en una respuesta coherente |
| **Control de calidad** | Valida si las salidas de los workers cumplen los criterios |

### Responsabilidades de los Workers

| Responsabilidad | Qué hace |
| :--- | :--- |
| **Especialización** | Ejecuta un tipo específico de tarea con alta calidad |
| **Autonomía limitada** | Opera dentro del alcance definido por el orchestrator |
| **Formato estandarizado** | Retorna resultados en el formato que el orchestrator espera |

---

## 2. Comparación con otros patrones

El Orchestrator-Worker es uno entre varios patrones de coordinación de agentes:

| Patrón | Estructura | Cuándo usar |
| :--- | :--- | :--- |
| **Sequential (Pipeline)** | A → B → C | Tareas con dependencia lineal |
| **Parallel (Fan-out)** | A → [B, C, D] → A | Subtareas independientes |
| **Orchestrator-Worker** | Orquestador decide dinámicamente | Tareas complejas con subtareas variables |
| **Hierarchical** | Orchestrator → Sub-orchestrators → Workers | Sistemas muy grandes con múltiples dominios |
| **Peer-to-peer** | A ↔ B ↔ C | Agentes que negocian entre sí |

La diferencia clave del Orchestrator-Worker respecto al Fan-out simple es que el orchestrator **decide en runtime** cuántos workers usar, cuáles activar y cómo combinar los resultados — no es un flujo fijo.

---

## 3. Implementación práctica

### Definición de los Workers

Cada worker se define con un alcance claro:

```
Worker: "researcher"
  - Descripción: Busca información en bases de conocimiento y web
  - Herramientas: busca_vectorial, busca_web, lectura_de_docs
  - Input: query de búsqueda + contexto
  - Output: lista de hechos relevantes con fuentes

Worker: "coder"
  - Descripción: Escribe y analiza código
  - Herramientas: editor, ejecutor_de_código, linter
  - Input: especificación de la tarea
  - Output: código + explicación

Worker: "analyst"
  - Descripción: Analiza datos y genera insights
  - Herramientas: SQL, calculadora, generador_de_gráficos
  - Input: pregunta analítica + datos
  - Output: análisis con métricas y conclusiones
```

### Flujo del Orchestrator (pseudocódigo)

```python
def orchestrate(task):
    # 1. Descomponer
    subtasks = llm.decompose(task)
    # Ej: [("research", "buscar datos de mercado"),
    #      ("analyst", "calcular crecimiento YoY"),
    #      ("coder", "generar gráfico con matplotlib")]

    # 2. Ejecutar (paralelo cuando sea posible)
    results = {}
    parallel_group = [s for s in subtasks if not s.depends_on]
    for subtask in parallel_group:
        worker = get_worker(subtask.type)
        results[subtask.id] = worker.execute(subtask)

    # Subtareas dependientes se ejecutan después
    for subtask in subtasks if subtask.depends_on:
        context = results[subtask.depends_on]
        worker = get_worker(subtask.type)
        results[subtask.id] = worker.execute(subtask, context)

    # 3. Sintetizar
    final = llm.synthesize(task, results)
    return final
```

---

## 4. Ejemplo Concreto — Informe de Due Diligence

**Tarea:** _"Analiza la empresa XYZ para una potencial adquisición"_

**El Orchestrator descompone:**

```
Tarea Principal
├── [researcher] Buscar información financiera de XYZ
├── [researcher] Buscar noticias recientes sobre XYZ
├── [analyst] Analizar salud financiera (depende de los datos anteriores)
├── [researcher] Buscar información sobre el mercado/competidores
├── [analyst] Analizar posición competitiva (depende de los datos anteriores)
└── [synthesizer] Generar informe final (depende de todo lo anterior)
```

**Ejecución:**

1. **Paralelo:** 3 researchers buscan datos financieros, noticias y mercado simultáneamente.
2. **Secuencial:** Con los datos en mano, los analysts procesan.
3. **Síntesis:** El orchestrator combina todo en un informe estructurado.

**Resultado:** Un informe completo que llevaría horas para un humano compilar, generado en minutos con múltiples fuentes verificadas.

---

## 5. Patrones de comunicación

### Direct Return
El worker retorna directamente al orchestrator:

```
Orchestrator ──task──► Worker
Orchestrator ◄──result── Worker
```

Simple y más común. El orchestrator tiene control total.

### Streaming
El worker envía resultados parciales conforme avanza:

```
Orchestrator ──task──► Worker
Orchestrator ◄──chunk1── Worker
Orchestrator ◄──chunk2── Worker
Orchestrator ◄──done── Worker
```

Útil para tareas largas donde el orchestrator puede comenzar a procesar antes de que el worker termine.

### Callback con retry
El orchestrator evalúa el resultado y puede pedir retrabajo:

```
Orchestrator ──task──► Worker
Orchestrator ◄──result── Worker
Orchestrator ──"refinar X"──► Worker  (si la calidad es insuficiente)
Orchestrator ◄──result_v2── Worker
```

---

## 6. Ventajas y Limitaciones

**Escalabilidad:** Agregar un nuevo tipo de worker no cambia el orchestrator — basta con registrar el worker y sus capacidades.

**Paralelismo:** Las subtareas independientes se ejecutan al mismo tiempo, reduciendo la latencia total.

**Especialización:** Cada worker puede tener su propio prompt, herramientas e incluso modelo de LLM optimizado para su tipo de tarea.

**Claridad arquitectónica:** La separación clara de responsabilidades facilita el debug y monitoreo.

**Punto único de falla:** Si el orchestrator falla o planifica mal, todo el sistema falla. La calidad del orchestrator es el cuello de botella.

**Overhead de coordinación:** La descomposición y síntesis consumen tokens y latencia adicionales.

**Complejidad de estado:** Gestionar dependencias entre subtareas, timeouts y fallbacks exige ingeniería cuidadosa.

**Costo:** Múltiples agentes = múltiples llamadas al LLM. Una tarea puede generar 10-20 llamadas.

---

## Conclusión

El patrón Orchestrator-Worker es la columna vertebral de los sistemas multi-agente modernos. Trae al mundo de los LLMs el mismo principio que funciona en ingeniería de software desde hace décadas: dividir para conquistar, con coordinación centralizada. La clave para una buena implementación está en la calidad del orchestrator — su capacidad de descomponer bien, elegir los workers correctos y sintetizar resultados coherentes. Frameworks como LangGraph, CrewAI y Autogen ya implementan variaciones de este patrón y facilitan ponerlo en producción.
