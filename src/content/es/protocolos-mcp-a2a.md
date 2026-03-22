# Protocolos MCP y A2A

A medida que los agentes de IA se vuelven más capaces, surge un problema práctico: **¿cómo se conectan con el mundo externo?** El **MCP (Model Context Protocol)** resuelve la comunicación entre un agente y sus **herramientas/datos**. El **A2A (Agent-to-Agent)** resuelve la comunicación entre **agentes diferentes**. Juntos, forman la capa de interoperabilidad del ecosistema de agentes.

---

## 1. MCP — Model Context Protocol

### El problema

Cada proveedor de herramientas (Slack, GitHub, base de datos, etc.) tiene su propia API, formato de autenticación y schema de datos. Sin un estándar, integrar un agente con 10 herramientas exige 10 integraciones custom. Es el problema de los "M×N connectors" — M agentes × N herramientas = M×N integraciones.

### La solución

El MCP define un **protocolo estandarizado** para conectar agentes a fuentes de datos y herramientas. Piensa en él como el "USB-C de los agentes" — un único estándar que funciona con cualquier herramienta.

```
┌──────────┐     MCP      ┌──────────────┐
│  Agente  │◄────────────►│  MCP Server  │
│  (Host)  │  (protocolo  │   (GitHub)   │
└──────────┘  estandariz.)└──────────────┘
     │
     │         MCP      ┌──────────────┐
     └───────────────────►│  MCP Server  │
                         │   (Slack)    │
                         └──────────────┘
```

### Arquitectura

| Componente | Rol | Ejemplo |
| :--- | :--- | :--- |
| **Host** | Aplicación que aloja al agente | Claude Desktop, IDE, app custom |
| **Client** | Mantiene conexión 1:1 con un server | Creado por el host para cada server |
| **Server** | Expone herramientas y datos vía MCP | MCP server de GitHub, de Postgres, etc. |

### Qué expone un MCP Server

Un server puede ofrecer tres tipos de recurso:

**1. Tools (Herramientas)** — Acciones que el agente puede ejecutar:
```json
{
  "name": "create_issue",
  "description": "Crea una issue en GitHub",
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

**2. Resources (Recursos)** — Datos que el agente puede leer:
```json
{
  "uri": "github://repo/org/project/issues",
  "name": "Lista de issues del proyecto",
  "mimeType": "application/json"
}
```

**3. Prompts** — Templates de prompt predefinidos:
```json
{
  "name": "code_review",
  "description": "Hace review de un PR",
  "arguments": [{ "name": "pr_number", "required": true }]
}
```

### Transporte

El MCP soporta dos mecanismos de transporte:

- **stdio:** Comunicación vía stdin/stdout. Ideal para servers locales (procesos en la misma computadora).
- **HTTP + SSE (Streamable HTTP):** Para servers remotos. El client hace requests HTTP y recibe eventos vía Server-Sent Events.

---

## 2. A2A — Agent-to-Agent Protocol

### El problema

El MCP conecta agentes a herramientas, pero ¿y cuando un **agente necesita delegar trabajo a otro agente**? Agentes diferentes pueden ser de empresas diferentes, correr en infraestructuras diferentes, y usar LLMs diferentes. Necesitamos un protocolo para que se comuniquen.

### La solución

El A2A, propuesto por Google, define cómo los agentes **descubren las capacidades de los demás** y **colaboran en tareas**, independientemente del framework o proveedor.

```
┌──────────────┐    A2A     ┌──────────────┐
│   Agente A   │◄──────────►│   Agente B   │
│  (Cliente)   │ (protocolo │  (Remoto)    │
│              │  HTTP/JSON) │              │
│  LangGraph   │            │  CrewAI      │
│  + Claude    │            │  + GPT-4     │
└──────────────┘            └──────────────┘
```

### Agent Card — Descubrimiento de capacidades

Cada agente publica un **Agent Card** en `/.well-known/agent.json`:

```json
{
  "name": "Travel Agent",
  "description": "Agente especializado en planificación de viajes",
  "url": "https://travel-agent.example.com",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true
  },
  "skills": [
    {
      "id": "flight_search",
      "name": "Búsqueda de Vuelos",
      "description": "Encuentra y compara vuelos",
      "examples": ["Buscar vuelo Madrid a NY en marzo"]
    },
    {
      "id": "hotel_booking",
      "name": "Reserva de Hotel",
      "description": "Busca y reserva hoteles"
    }
  ]
}
```

Un agente cliente puede consultar los Agent Cards de múltiples agentes remotos para decidir cuál de ellos es el mejor para una subtarea.

### Conceptos clave del A2A

| Concepto | Descripción |
| :--- | :--- |
| **Task** | Unidad central de trabajo. Tiene estados: `submitted`, `working`, `input-required`, `completed`, `failed` |
| **Message** | Comunicación entre agentes dentro de una task. Tiene role: `user` o `agent` |
| **Part** | Contenido dentro de un message: `TextPart`, `FilePart`, `DataPart` |
| **Artifact** | Salida generada por el agente (archivos, datos estructurados) |

### Flujo de una Task

```
Cliente                          Agente Remoto
   │                                  │
   │──── POST /tasks/send ──────────►│
   │     {message: "Buscar vuelo     │
   │      Madrid→NY el 15/mar"}      │
   │                                  │
   │◄─── {status: "working"} ────────│
   │                                  │
   │◄─── {status: "input-required",──│
   │      message: "¿Clase            │
   │      económica o ejecutiva?"}   │
   │                                  │
   │──── {message: "Económica"} ────►│
   │                                  │
   │◄─── {status: "completed", ──────│
   │      artifacts: [resultados]}   │
```

---

## 3. MCP vs A2A — Cuándo usar cada uno

```
┌─────────────────────────────────────────────┐
│              Agente Principal                │
│                                             │
│  ┌──── MCP ─────┐    ┌──── A2A ─────┐      │
│  │ Herramientas │    │ Otros Agentes│      │
│  │ - GitHub     │    │ - Travel Agent│      │
│  │ - Slack      │    │ - Legal Agent │      │
│  │ - Database   │    │ - Data Agent  │      │
│  └──────────────┘    └───────────────┘      │
└─────────────────────────────────────────────┘
```

| Aspecto | MCP | A2A |
| :--- | :--- | :--- |
| **Conecta** | Agente ↔ Herramienta/Datos | Agente ↔ Agente |
| **Modelo** | Client-Server | Peer-to-Peer (vía HTTP) |
| **Complejidad del "otro lado"** | Servidor expone funciones simples | Agente autónomo con razonamiento propio |
| **Quién decide** | El agente host decide todo | Cada agente tiene autonomía |
| **Estado** | Stateless (cada llamada independiente) | Stateful (tasks con ciclo de vida) |
| **Interacción** | Síncrona (request-response) | Puede ser asíncrona (long-running tasks) |
| **Creado por** | Anthropic | Google |

### Usados juntos

En la práctica, los dos protocolos son **complementarios**:

1. El agente principal usa **MCP** para acceder a sus herramientas locales (base de datos, APIs internas)
2. El agente principal usa **A2A** para delegar subtareas a agentes especializados de terceros
3. Los agentes remotos, a su vez, usan **MCP** para acceder a sus propias herramientas

---

## 4. Ejemplo Concreto — Sistema de Reclutamiento

```
┌──────────────────────┐
│   Agente de RRHH     │
│   (Orchestrator)     │
│                      │
│  MCP: banco interno  │
│  MCP: email          │
│                      │
│  A2A ──► Agente de   │───► Analiza LinkedIn, GitHub
│          Screening   │     Retorna ranking de candidatos
│                      │
│  A2A ──► Agente de   │───► Analiza fit cultural
│          Assessment  │     Retorna score y justificación
│                      │
│  A2A ──► Agente de   │───► Genera propuesta salarial
│          Compensation│     Con base en el mercado
└──────────────────────┘
```

- El agente de RRHH usa **MCP** para leer datos del banco interno y enviar emails
- Usa **A2A** para delegar análisis de candidatos, assessment y compensación a agentes especializados (que pueden ser de empresas diferentes)
- Cada agente remoto publica su **Agent Card** describiendo sus skills

---

## 5. Ventajas y Limitaciones

**Interoperabilidad:** Agentes de cualquier framework/proveedor pueden comunicarse vía protocolos abiertos.

**Ecosistema:** MCP ya tiene cientos de servers disponibles (GitHub, Slack, Postgres, etc.). A2A está creciendo rápidamente.

**Separación de responsabilidades:** MCP para herramientas, A2A para colaboración entre agentes — cada protocolo hace una cosa bien.

**Seguridad explícita:** Ambos protocolos definen mecanismos de autenticación y control de acceso.

**Madurez:** Ambos protocolos son relativamente nuevos. A2A especialmente aún está en fase inicial de adopción.

**Complejidad operacional:** Gestionar múltiples MCP servers y agentes A2A exige observabilidad, monitoreo y políticas de retry.

**Latencia de red:** Cada llamada A2A involucra red, serialización y potencialmente cola — más lento que todo ejecutándose en el mismo proceso.

**Confianza entre agentes:** Delegar a un agente externo vía A2A exige confianza en la calidad y seguridad de aquel agente.

---

## Conclusión

MCP y A2A son los dos pilares de la interoperabilidad en el ecosistema de agentes de IA. El MCP estandariza cómo los agentes acceden a herramientas y datos — eliminando el problema de los N conectores custom. El A2A estandariza cómo los agentes colaboran entre sí — habilitando un ecosistema donde agentes especializados de diferentes proveedores trabajan juntos. Conforme el ecosistema madura, estos protocolos tienden a volverse tan fundamentales para los agentes como HTTP lo es para la web.
