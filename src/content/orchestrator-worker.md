# Padrão Orchestrator-Worker

Quando uma tarefa é complexa demais para um único agente resolver de uma vez, precisamos de coordenação. O padrão **Orchestrator-Worker** resolve isso com uma divisão clara: um **orquestrador** central que planeja e delega, e múltiplos **workers** especializados que executam. É o mesmo princípio de um tech lead que quebra uma feature em tarefas e distribui para o time.

---

## 1. Como funciona?

```
┌──────────────────────────────────────────────┐
│              ORCHESTRATOR                     │
│                                              │
│  1. Recebe a tarefa                          │
│  2. Analisa e decompõe em subtarefas         │
│  3. Delega para workers apropriados          │
│  4. Coleta e sintetiza os resultados         │
│  5. Entrega resposta final                   │
└────────────┬──────────┬──────────┬───────────┘
             │          │          │
             ▼          ▼          ▼
        ┌────────┐ ┌────────┐ ┌────────┐
        │Worker A│ │Worker B│ │Worker C│
        │(Busca) │ │(Código)│ │(Análise│
        └────────┘ └────────┘ └────────┘
```

### Responsabilidades do Orchestrator

| Responsabilidade | O que faz |
| :--- | :--- |
| **Decomposição** | Quebra a tarefa original em subtarefas independentes |
| **Roteamento** | Decide qual worker é o melhor para cada subtarefa |
| **Paralelização** | Identifica quais subtarefas podem rodar em paralelo |
| **Síntese** | Combina as saídas dos workers em uma resposta coerente |
| **Controle de qualidade** | Valida se as saídas dos workers atendem aos critérios |

### Responsabilidades dos Workers

| Responsabilidade | O que faz |
| :--- | :--- |
| **Especialização** | Executa um tipo específico de tarefa com alta qualidade |
| **Autonomia limitada** | Opera dentro do escopo definido pelo orchestrator |
| **Formato padronizado** | Retorna resultados em formato que o orchestrator espera |

---

## 2. Comparação com outros padrões

O Orchestrator-Worker é um entre vários padrões de coordenação de agentes:

| Padrão | Estrutura | Quando usar |
| :--- | :--- | :--- |
| **Sequential (Pipeline)** | A → B → C | Tarefas com dependência linear |
| **Parallel (Fan-out)** | A → [B, C, D] → A | Subtarefas independentes |
| **Orchestrator-Worker** | Orquestrador decide dinamicamente | Tarefas complexas com subtarefas variáveis |
| **Hierarchical** | Orchestrator → Sub-orchestrators → Workers | Sistemas muito grandes com múltiplos domínios |
| **Peer-to-peer** | A ↔ B ↔ C | Agentes que negociam entre si |

A diferença-chave do Orchestrator-Worker para Fan-out simples é que o orchestrator **decide em runtime** quantos workers usar, quais acionar e como combinar os resultados — não é um fluxo fixo.

---

## 3. Implementação prática

### Definição dos Workers

Cada worker é definido com um escopo claro:

```
Worker: "researcher"
  - Descrição: Busca informações em bases de conhecimento e web
  - Ferramentas: busca_vetorial, busca_web, leitura_de_docs
  - Input: query de busca + contexto
  - Output: lista de fatos relevantes com fontes

Worker: "coder"
  - Descrição: Escreve e analisa código
  - Ferramentas: editor, executor_de_código, linter
  - Input: especificação da tarefa
  - Output: código + explicação

Worker: "analyst"
  - Descrição: Analisa dados e gera insights
  - Ferramentas: SQL, calculadora, gerador_de_gráficos
  - Input: pergunta analítica + dados
  - Output: análise com métricas e conclusões
```

### Fluxo do Orchestrator (pseudocódigo)

```python
def orchestrate(task):
    # 1. Decompor
    subtasks = llm.decompose(task)
    # Ex: [("research", "buscar dados de mercado"),
    #      ("analyst", "calcular crescimento YoY"),
    #      ("coder", "gerar gráfico com matplotlib")]

    # 2. Executar (paralelo quando possível)
    results = {}
    parallel_group = [s for s in subtasks if not s.depends_on]
    for subtask in parallel_group:
        worker = get_worker(subtask.type)
        results[subtask.id] = worker.execute(subtask)

    # Subtarefas dependentes rodam depois
    for subtask in subtasks if subtask.depends_on:
        context = results[subtask.depends_on]
        worker = get_worker(subtask.type)
        results[subtask.id] = worker.execute(subtask, context)

    # 3. Sintetizar
    final = llm.synthesize(task, results)
    return final
```

---

## 4. Exemplo Concreto — Relatório de Due Diligence

**Tarefa:** _"Analise a empresa XYZ para uma potencial aquisição"_

**Orchestrator decompõe:**

```
Tarefa Principal
├── [researcher] Buscar informações financeiras da XYZ
├── [researcher] Buscar notícias recentes sobre XYZ
├── [analyst] Analisar saúde financeira (depende dos dados acima)
├── [researcher] Buscar informações sobre o mercado/concorrentes
├── [analyst] Analisar posição competitiva (depende dos dados acima)
└── [synthesizer] Gerar relatório final (depende de tudo acima)
```

**Execução:**

1. **Paralelo:** 3 researchers buscam dados financeiros, notícias e mercado simultaneamente.
2. **Sequencial:** Com os dados em mãos, os analysts processam.
3. **Síntese:** O orchestrator combina tudo em um relatório estruturado.

**Resultado:** Um relatório completo que levaria horas para um humano compilar, gerado em minutos com múltiplas fontes verificadas.

---

## 5. Patterns de comunicação

### Direct Return
O worker retorna diretamente ao orchestrator:

```
Orchestrator ──task──► Worker
Orchestrator ◄──result── Worker
```

Simples e mais comum. O orchestrator tem controle total.

### Streaming
O worker envia resultados parciais conforme progride:

```
Orchestrator ──task──► Worker
Orchestrator ◄──chunk1── Worker
Orchestrator ◄──chunk2── Worker
Orchestrator ◄──done── Worker
```

Útil para tarefas longas onde o orchestrator pode começar a processar antes do worker terminar.

### Callback com retry
O orchestrator avalia o resultado e pode pedir retrabalho:

```
Orchestrator ──task──► Worker
Orchestrator ◄──result── Worker
Orchestrator ──"refine X"──► Worker  (se qualidade insuficiente)
Orchestrator ◄──result_v2── Worker
```

---

## 6. Vantagens e Limitações

**Escalabilidade:** Adicionar um novo tipo de worker não muda o orchestrator — basta registrar o worker e suas capacidades.

**Paralelismo:** Subtarefas independentes rodam ao mesmo tempo, reduzindo latência total.

**Especialização:** Cada worker pode ter seu próprio prompt, ferramentas e até modelo de LLM otimizado para seu tipo de tarefa.

**Clareza arquitetural:** Separação clara de responsabilidades facilita debug e monitoramento.

**Single point of failure:** Se o orchestrator falha ou planeja mal, todo o sistema falha. A qualidade do orchestrator é o gargalo.

**Overhead de coordenação:** A decomposição e síntese consomem tokens e latência adicionais.

**Complexidade de estado:** Gerenciar dependências entre subtarefas, timeouts e fallbacks exige engenharia cuidadosa.

**Custo:** Múltiplos agentes = múltiplas chamadas ao LLM. Uma tarefa pode gerar 10-20 chamadas.

---

## Conclusão

O padrão Orchestrator-Worker é a espinha dorsal de sistemas multi-agente modernos. Ele traz para o mundo de LLMs o mesmo princípio que funciona em engenharia de software há décadas: dividir para conquistar, com coordenação centralizada. A chave para uma boa implementação está na qualidade do orchestrator — sua capacidade de decompor bem, escolher os workers certos e sintetizar resultados coerentes. Frameworks como LangGraph, CrewAI e Autogen já implementam variações desse padrão e facilitam colocá-lo em produção.
