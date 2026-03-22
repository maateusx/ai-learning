# Orchestrator-Worker Pattern

When a task is too complex for a single agent to solve at once, we need coordination. The **Orchestrator-Worker** pattern solves this with a clear division: a central **orchestrator** that plans and delegates, and multiple specialized **workers** that execute. It's the same principle as a tech lead who breaks a feature into tasks and distributes them to the team.

---

## 1. How Does It Work?

```
┌──────────────────────────────────────────────┐
│              ORCHESTRATOR                     │
│                                              │
│  1. Receives the task                        │
│  2. Analyzes and decomposes into subtasks    │
│  3. Delegates to appropriate workers         │
│  4. Collects and synthesizes results         │
│  5. Delivers final response                  │
└────────────┬──────────┬──────────┬───────────┘
             │          │          │
             ▼          ▼          ▼
        ┌────────┐ ┌────────┐ ┌────────┐
        │Worker A│ │Worker B│ │Worker C│
        │(Search)│ │ (Code) │ │(Analys.│
        └────────┘ └────────┘ └────────┘
```

### Orchestrator Responsibilities

| Responsibility | What it does |
| :--- | :--- |
| **Decomposition** | Breaks the original task into independent subtasks |
| **Routing** | Decides which worker is best for each subtask |
| **Parallelization** | Identifies which subtasks can run in parallel |
| **Synthesis** | Combines worker outputs into a coherent response |
| **Quality control** | Validates whether worker outputs meet the criteria |

### Worker Responsibilities

| Responsibility | What it does |
| :--- | :--- |
| **Specialization** | Executes a specific type of task with high quality |
| **Limited autonomy** | Operates within the scope defined by the orchestrator |
| **Standardized format** | Returns results in the format the orchestrator expects |

---

## 2. Comparison with Other Patterns

The Orchestrator-Worker is one among several agent coordination patterns:

| Pattern | Structure | When to use |
| :--- | :--- | :--- |
| **Sequential (Pipeline)** | A → B → C | Tasks with linear dependency |
| **Parallel (Fan-out)** | A → [B, C, D] → A | Independent subtasks |
| **Orchestrator-Worker** | Orchestrator decides dynamically | Complex tasks with variable subtasks |
| **Hierarchical** | Orchestrator → Sub-orchestrators → Workers | Very large systems with multiple domains |
| **Peer-to-peer** | A ↔ B ↔ C | Agents that negotiate with each other |

The key difference between Orchestrator-Worker and simple Fan-out is that the orchestrator **decides at runtime** how many workers to use, which ones to activate, and how to combine the results — it's not a fixed flow.

---

## 3. Practical Implementation

### Worker Definition

Each worker is defined with a clear scope:

```
Worker: "researcher"
  - Description: Searches for information in knowledge bases and the web
  - Tools: vector_search, web_search, doc_reader
  - Input: search query + context
  - Output: list of relevant facts with sources

Worker: "coder"
  - Description: Writes and analyzes code
  - Tools: editor, code_executor, linter
  - Input: task specification
  - Output: code + explanation

Worker: "analyst"
  - Description: Analyzes data and generates insights
  - Tools: SQL, calculator, chart_generator
  - Input: analytical question + data
  - Output: analysis with metrics and conclusions
```

### Orchestrator Flow (pseudocode)

```python
def orchestrate(task):
    # 1. Decompose
    subtasks = llm.decompose(task)
    # E.g.: [("research", "search for market data"),
    #        ("analyst", "calculate YoY growth"),
    #        ("coder", "generate chart with matplotlib")]

    # 2. Execute (parallel when possible)
    results = {}
    parallel_group = [s for s in subtasks if not s.depends_on]
    for subtask in parallel_group:
        worker = get_worker(subtask.type)
        results[subtask.id] = worker.execute(subtask)

    # Dependent subtasks run afterwards
    for subtask in subtasks if subtask.depends_on:
        context = results[subtask.depends_on]
        worker = get_worker(subtask.type)
        results[subtask.id] = worker.execute(subtask, context)

    # 3. Synthesize
    final = llm.synthesize(task, results)
    return final
```

---

## 4. Concrete Example — Due Diligence Report

**Task:** _"Analyze company XYZ for a potential acquisition"_

**Orchestrator decomposes:**

```
Main Task
├── [researcher] Search for XYZ's financial information
├── [researcher] Search for recent news about XYZ
├── [analyst] Analyze financial health (depends on data above)
├── [researcher] Search for market/competitor information
├── [analyst] Analyze competitive position (depends on data above)
└── [synthesizer] Generate final report (depends on everything above)
```

**Execution:**

1. **Parallel:** 3 researchers fetch financial data, news, and market info simultaneously.
2. **Sequential:** With the data in hand, the analysts process it.
3. **Synthesis:** The orchestrator combines everything into a structured report.

**Result:** A complete report that would take a human hours to compile, generated in minutes with multiple verified sources.

---

## 5. Communication Patterns

### Direct Return
The worker returns directly to the orchestrator:

```
Orchestrator ──task──► Worker
Orchestrator ◄──result── Worker
```

Simple and most common. The orchestrator has full control.

### Streaming
The worker sends partial results as it progresses:

```
Orchestrator ──task──► Worker
Orchestrator ◄──chunk1── Worker
Orchestrator ◄──chunk2── Worker
Orchestrator ◄──done── Worker
```

Useful for long tasks where the orchestrator can start processing before the worker finishes.

### Callback with Retry
The orchestrator evaluates the result and may request rework:

```
Orchestrator ──task──► Worker
Orchestrator ◄──result── Worker
Orchestrator ──"refine X"──► Worker  (if quality insufficient)
Orchestrator ◄──result_v2── Worker
```

---

## 6. Advantages and Limitations

**Scalability:** Adding a new type of worker doesn't change the orchestrator — just register the worker and its capabilities.

**Parallelism:** Independent subtasks run at the same time, reducing total latency.

**Specialization:** Each worker can have its own prompt, tools, and even LLM model optimized for its task type.

**Architectural clarity:** Clear separation of responsibilities makes debugging and monitoring easier.

**Single point of failure:** If the orchestrator fails or plans poorly, the entire system fails. The orchestrator's quality is the bottleneck.

**Coordination overhead:** Decomposition and synthesis consume additional tokens and latency.

**State complexity:** Managing dependencies between subtasks, timeouts, and fallbacks requires careful engineering.

**Cost:** Multiple agents = multiple LLM calls. A single task can generate 10-20 calls.

---

## Conclusion

The Orchestrator-Worker pattern is the backbone of modern multi-agent systems. It brings to the world of LLMs the same principle that has worked in software engineering for decades: divide and conquer, with centralized coordination. The key to a good implementation lies in the orchestrator's quality — its ability to decompose well, choose the right workers, and synthesize coherent results. Frameworks like LangGraph, CrewAI, and Autogen already implement variations of this pattern and make it easier to put it into production.
