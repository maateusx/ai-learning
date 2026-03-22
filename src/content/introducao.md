# Introdução: De Onde Vem a "Inteligência" da IA?

Você já conversou com um ChatGPT, pediu para o Claude revisar um código ou viu o Copilot completar uma função inteira? Por trás dessas experiências existe um conjunto de técnicas e arquiteturas que transformam texto em matemática, matemática em compreensão e compreensão em respostas úteis.

Este guia foi criado para explicar **como tudo isso funciona por dentro** — desde os fundamentos até as técnicas mais avançadas usadas em produção — de forma clara, prática e em português.

---

## Para quem é este guia?

Para desenvolvedores, engenheiros de dados e profissionais técnicos que querem ir além do "prompt engineering" e entender a engenharia por trás dos sistemas de IA modernos. Você não precisa ser especialista em Machine Learning — mas ajuda ter familiaridade com conceitos básicos de programação.

---

## O que você vai aprender?

Este guia é organizado em camadas. Cada tópico constrói sobre o anterior, então a ordem de leitura importa:

### Camada 1: Fundamentos

- **[IA e Modelos de Linguagem (LLMs)](#ia-e-modelos):** O que são os modelos que geram texto, como funcionam tokens, context window e por que a IA "alucina".
- **[Universo dos Vetores](#universo-dos-vetores):** Como bancos de dados vetoriais organizam informação por significado, não por palavras-chave.

### Camada 2: Busca e Recuperação

- **[Busca por Palavras-chave (BM25)](#busca-palavra-chave):** O método clássico de busca textual — rápido, preciso para termos exatos, mas limitado em compreensão.
- **[Busca Vetorial](#busca-vetorial):** Como transformar texto em vetores e encontrar documentos por similaridade semântica.
- **[Busca Híbrida](#busca-hibrida):** Combinar BM25 e busca vetorial para eliminar os pontos cegos de cada abordagem.

### Camada 3: Refinamento

- **[Chunking](#chunking):** Como quebrar documentos grandes em pedaços que cabem na janela de contexto do LLM.
- **[Reciprocal Rank Fusion (RRF)](#reciprocal-rank-fusion):** O algoritmo que funde rankings de diferentes métodos de busca em uma lista única.
- **[Cross-Encoders (Reranking)](#cross-encoders):** Modelos que reordenam resultados com altíssima precisão, analisando query e documento juntos.
- **[Métricas de Qualidade](#metricas-qualidade):** Como medir se o seu sistema de busca está realmente funcionando.

### Camada 4: Arquitetura RAG

- **[RAG (Retrieval-Augmented Generation)](#rag):** A arquitetura que conecta busca + LLM para gerar respostas baseadas nos seus dados reais.
- **[RAG Híbrida](#rag-hibrida):** RAG em produção — combinando múltiplas estratégias de busca e reranking.
- **[Context e Prompt Caching](#context-prompt-caching):** Otimizações para reduzir latência e custo em chamadas repetidas.

### Camada 5: Técnicas Avançadas

- **[Técnicas Avançadas de Busca](#tecnicas-avancadas-busca):** Query expansion, hypothetical document embeddings (HyDE) e outras estratégias.
- **[Hyperbolic Embeddings](#hyperbolic-embeddings):** Representações vetoriais em espaço hiperbólico para dados com hierarquia natural.
- **[Graph RAG](#graph-rag):** Combinando grafos de conhecimento com RAG para raciocínio multi-hop.
- **[Tenancy e Security Trimming](#tenancy-security-trimming):** Como garantir que cada usuário só acesse seus próprios dados em um sistema RAG multi-tenant.

### Camada 6: Agentes e Orquestração

- **[Bounded Autonomy](#bounded-autonomy):** Frameworks para dar autonomia controlada a agentes de IA.
- **[Orchestrator-Worker](#orchestrator-worker):** Padrão de arquitetura onde um agente central delega tarefas para agentes especializados.
- **[Agentic Adaptive RAG](#agentic-adaptive-rag):** Quando o agente decide dinamicamente qual estratégia de busca usar.
- **[Protocolos MCP e A2A](#protocolos-mcp-a2a):** Protocolos de comunicação entre modelos, ferramentas e agentes.

---

## A Grande Imagem

Todos esses conceitos se conectam em um fluxo que, simplificado, funciona assim:

```text
Pergunta do Usuário
       │
       ▼
┌─────────────────────────────┐
│  Busca (BM25 + Vetorial)    │  ← Busca Híbrida
│  nos documentos chunkeados  │  ← Chunking
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Reranking (Cross-Encoder)  │  ← Refinamento
│  + Fusão (RRF)              │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  LLM gera resposta          │  ← RAG
│  com base nos documentos    │
└─────────────┬───────────────┘
              │
              ▼
     Resposta Fundamentada
```

O objetivo final é sempre o mesmo: **dar ao LLM a informação certa, no formato certo, na hora certa** — para que ele responda com precisão em vez de inventar.

---

## Como usar este guia

- **Leitura sequencial:** Siga a ordem das camadas se você está começando do zero.
- **Consulta pontual:** Use os links acima para pular direto para o tópico que você precisa.
- **Prática:** Cada tópico inclui exemplos concretos e, quando possível, ferramentas reais que implementam o conceito.

Vamos começar? O primeiro passo é entender [o cérebro por trás de tudo: os LLMs](#ia-e-modelos).
