# Protocolos MCP e A2A

À medida que agentes de IA se tornam mais capazes, surge um problema prático: **como eles se conectam com o mundo externo?** O **MCP (Model Context Protocol)** resolve a comunicação entre um agente e suas **ferramentas/dados**. O **A2A (Agent-to-Agent)** resolve a comunicação entre **agentes diferentes**. Juntos, eles formam a camada de interoperabilidade do ecossistema de agentes.

---

## 1. MCP — Model Context Protocol

### O problema

Cada provedor de ferramentas (Slack, GitHub, banco de dados, etc.) tem sua própria API, formato de autenticação e schema de dados. Sem um padrão, integrar um agente com 10 ferramentas exige 10 integrações custom. É o problema dos "M×N connectors" — M agentes × N ferramentas = M×N integrações.

### A solução

O MCP define um **protocolo padronizado** para conectar agentes a fontes de dados e ferramentas. Pense nele como o "USB-C dos agentes" — um único padrão que funciona com qualquer ferramenta.

```
┌──────────┐     MCP      ┌──────────────┐
│  Agente  │◄────────────►│  MCP Server  │
│  (Host)  │  (protocolo  │   (GitHub)   │
└──────────┘  padronizado)└──────────────┘
     │
     │         MCP      ┌──────────────┐
     └───────────────────►│  MCP Server  │
                         │   (Slack)    │
                         └──────────────┘
```

### Arquitetura

| Componente | Papel | Exemplo |
| :--- | :--- | :--- |
| **Host** | Aplicação que hospeda o agente | Claude Desktop, IDE, app custom |
| **Client** | Mantém conexão 1:1 com um server | Criado pelo host para cada server |
| **Server** | Expõe ferramentas e dados via MCP | MCP server do GitHub, do Postgres, etc. |

### O que um MCP Server expõe

Um server pode oferecer três tipos de recurso:

**1. Tools (Ferramentas)** — Ações que o agente pode executar:
```json
{
  "name": "create_issue",
  "description": "Cria uma issue no GitHub",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "body": { "type": "string" },
      "repo": { "type": "string" }
    }
  }
}
```

**2. Resources (Recursos)** — Dados que o agente pode ler:
```json
{
  "uri": "github://repo/org/project/issues",
  "name": "Lista de issues do projeto",
  "mimeType": "application/json"
}
```

**3. Prompts** — Templates de prompt pré-definidos:
```json
{
  "name": "code_review",
  "description": "Faz review de um PR",
  "arguments": [{ "name": "pr_number", "required": true }]
}
```

### Transporte

O MCP suporta dois mecanismos de transporte:

- **stdio:** Comunicação via stdin/stdout. Ideal para servers locais (processos no mesmo computador).
- **HTTP + SSE (Streamable HTTP):** Para servers remotos. O client faz requests HTTP e recebe eventos via Server-Sent Events.

---

## 2. A2A — Agent-to-Agent Protocol

### O problema

O MCP conecta agentes a ferramentas, mas e quando um **agente precisa delegar trabalho para outro agente**? Agentes diferentes podem ser de empresas diferentes, rodar em infraestruturas diferentes, e usar LLMs diferentes. Precisamos de um protocolo para eles se comunicarem.

### A solução

O A2A, proposto pelo Google, define como agentes **descobrem capacidades uns dos outros** e **colaboram em tarefas**, independentemente do framework ou provedor.

```
┌──────────────┐    A2A     ┌──────────────┐
│   Agente A   │◄──────────►│   Agente B   │
│  (Cliente)   │ (protocolo │  (Remoto)    │
│              │  HTTP/JSON) │              │
│  LangGraph   │            │  CrewAI      │
│  + Claude    │            │  + GPT-4     │
└──────────────┘            └──────────────┘
```

### Agent Card — Descoberta de capacidades

Cada agente publica um **Agent Card** em `/.well-known/agent.json`:

```json
{
  "name": "Travel Agent",
  "description": "Agente especializado em planejamento de viagens",
  "url": "https://travel-agent.example.com",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true
  },
  "skills": [
    {
      "id": "flight_search",
      "name": "Busca de Voos",
      "description": "Encontra e compara voos",
      "examples": ["Buscar voo SP para NY em março"]
    },
    {
      "id": "hotel_booking",
      "name": "Reserva de Hotel",
      "description": "Busca e reserva hotéis"
    }
  ]
}
```

Um agente cliente pode consultar os Agent Cards de múltiplos agentes remotos para decidir qual deles é o melhor para uma subtarefa.

### Conceitos-chave do A2A

| Conceito | Descrição |
| :--- | :--- |
| **Task** | Unidade central de trabalho. Tem estados: `submitted`, `working`, `input-required`, `completed`, `failed` |
| **Message** | Comunicação entre agentes dentro de uma task. Tem role: `user` ou `agent` |
| **Part** | Conteúdo dentro de uma message: `TextPart`, `FilePart`, `DataPart` |
| **Artifact** | Saída gerada pelo agente (arquivos, dados estruturados) |

### Fluxo de uma Task

```
Cliente                          Agente Remoto
   │                                  │
   │──── POST /tasks/send ──────────►│
   │     {message: "Buscar voo       │
   │      SP→NY em 15/mar"}          │
   │                                  │
   │◄─── {status: "working"} ────────│
   │                                  │
   │◄─── {status: "input-required",──│
   │      message: "Classe            │
   │      econômica ou executiva?"}   │
   │                                  │
   │──── {message: "Econômica"} ────►│
   │                                  │
   │◄─── {status: "completed", ──────│
   │      artifacts: [resultados]}   │
```

---

## 3. MCP vs A2A — Quando usar cada um

```
┌─────────────────────────────────────────────┐
│              Agente Principal                │
│                                             │
│  ┌──── MCP ─────┐    ┌──── A2A ─────┐      │
│  │ Ferramentas  │    │ Outros Agentes│      │
│  │ - GitHub     │    │ - Travel Agent│      │
│  │ - Slack      │    │ - Legal Agent │      │
│  │ - Database   │    │ - Data Agent  │      │
│  └──────────────┘    └───────────────┘      │
└─────────────────────────────────────────────┘
```

| Aspecto | MCP | A2A |
| :--- | :--- | :--- |
| **Conecta** | Agente ↔ Ferramenta/Dados | Agente ↔ Agente |
| **Modelo** | Client-Server | Peer-to-Peer (via HTTP) |
| **Complexidade do "outro lado"** | Servidor expõe funções simples | Agente autônomo com raciocínio próprio |
| **Quem decide** | O agente host decide tudo | Cada agente tem autonomia |
| **Estado** | Stateless (cada chamada independente) | Stateful (tasks com ciclo de vida) |
| **Interação** | Síncrona (request-response) | Pode ser assíncrona (long-running tasks) |
| **Criado por** | Anthropic | Google |

### Usados juntos

Na prática, os dois protocolos são **complementares**:

1. O agente principal usa **MCP** para acessar suas ferramentas locais (banco de dados, APIs internas)
2. O agente principal usa **A2A** para delegar subtarefas a agentes especializados de terceiros
3. Os agentes remotos, por sua vez, usam **MCP** para acessar suas próprias ferramentas

---

## 4. Exemplo Concreto — Sistema de Recrutamento

```
┌──────────────────────┐
│   Agente de RH       │
│   (Orchestrator)     │
│                      │
│  MCP: banco interno  │
│  MCP: email          │
│                      │
│  A2A ──► Agente de   │───► Analisa LinkedIn, GitHub
│          Screening   │     Retorna ranking de candidatos
│                      │
│  A2A ──► Agente de   │───► Analisa fit cultural
│          Assessment  │     Retorna score e justificativa
│                      │
│  A2A ──► Agente de   │───► Gera proposta salarial
│          Compensation│     Com base em mercado
└──────────────────────┘
```

- O agente de RH usa **MCP** para ler dados do banco interno e enviar emails
- Usa **A2A** para delegar análise de candidatos, assessment e compensação para agentes especializados (que podem ser de empresas diferentes)
- Cada agente remoto publica seu **Agent Card** descrevendo suas skills

---

## 5. Vantagens e Limitações

**Interoperabilidade:** Agentes de qualquer framework/provedor podem se comunicar via protocolos abertos.

**Ecossistema:** MCP já tem centenas de servers disponíveis (GitHub, Slack, Postgres, etc.). A2A está crescendo rapidamente.

**Separação de responsabilidades:** MCP para ferramentas, A2A para colaboração entre agentes — cada protocolo faz uma coisa bem.

**Segurança explícita:** Ambos os protocolos definem mecanismos de autenticação e controle de acesso.

**Maturidade:** Ambos os protocolos são relativamente novos. A2A especialmente ainda está em fase inicial de adoção.

**Complexidade operacional:** Gerenciar múltiplos MCP servers e agentes A2A exige observabilidade, monitoramento e políticas de retry.

**Latência de rede:** Cada chamada A2A envolve rede, serialização e potencialmente fila — mais lento que tudo rodando no mesmo processo.

**Confiança entre agentes:** Delegar para um agente externo via A2A exige confiança na qualidade e segurança daquele agente.

---

## Conclusão

MCP e A2A são os dois pilares da interoperabilidade no ecossistema de agentes de IA. O MCP padroniza como agentes acessam ferramentas e dados — eliminando o problema dos N conectores custom. O A2A padroniza como agentes colaboram entre si — habilitando um ecossistema onde agentes especializados de diferentes provedores trabalham juntos. Conforme o ecossistema amadurece, esses protocolos tendem a se tornar tão fundamentais para agentes quanto HTTP é para a web.
