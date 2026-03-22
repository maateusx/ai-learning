# Agentic & Adaptive RAG

Até agora, vimos pipelines de RAG que seguem um caminho fixo: receber pergunta → buscar documentos → gerar resposta. Mas e se o sistema pudesse **decidir sozinho** qual estratégia usar, avaliar se a resposta está boa e **tentar de novo** se não estiver? Esse é o salto do RAG tradicional para o **Agentic & Adaptive RAG**: pipelines que pensam, planejam e se corrigem.

---

## 1. Adaptive RAG — Escolhendo a estratégia certa

O Adaptive RAG parte de uma premissa simples: **nem toda pergunta precisa do mesmo tratamento**. Antes de buscar qualquer coisa, um classificador analisa a consulta e decide qual rota seguir.

### Como funciona?

```
Consulta do Usuário
       │
       ▼
[ Classificador de Consulta ]
       │
       ├── Simples ──────► Busca direta no índice
       │
       ├── Complexa ─────► Decomposição em sub-perguntas
       │                    (cada uma com sua própria busca)
       │
       └── Fora do escopo ► Resposta direta do LLM
                            (sem retrieval)
```

### Tipos de roteamento

| Tipo de Consulta | Estratégia | Exemplo |
| :--- | :--- | :--- |
| Factual simples | Busca direta | _"Qual o limite de tokens do GPT-4?"_ |
| Multi-facetada | Decomposição + múltiplas buscas | _"Compare os prós e contras de PostgreSQL vs MongoDB para um sistema de e-commerce"_ |
| Conversacional | Reformulação com contexto do chat | _"E quanto ao preço?"_ (referindo-se ao tópico anterior) |
| Fora do escopo | Sem retrieval, resposta do LLM | _"Quanto é 2 + 2?"_ |

O classificador pode ser um LLM com prompt específico, um modelo treinado para classificação, ou até regras heurísticas simples. O ponto-chave é que a **rota é decidida dinamicamente**, não hardcoded.

---

## 2. Loop Agêntico — Planning & Reflection

Aqui é onde o RAG ganha verdadeira autonomia. Em vez de um pipeline linear, o sistema opera em um **loop iterativo** com três capacidades fundamentais:

### 2.1 Planning (Planejamento)

O agente recebe uma tarefa complexa e a decompõe em passos antes de executar qualquer coisa.

```
Pergunta: "Quais empresas brasileiras de IA receberam investimento
           Series B em 2024 e qual foi o impacto no mercado?"

Plano gerado pelo agente:
  1. Buscar empresas brasileiras de IA com funding Series B em 2024
  2. Para cada empresa encontrada, buscar detalhes do investimento
  3. Buscar análises de mercado sobre IA no Brasil em 2024
  4. Sintetizar tudo em uma resposta coerente
```

Cada passo do plano é executado como uma ação independente de retrieval e pode gerar novos passos conforme o agente descobre mais informações.

### 2.2 Reflection (Reflexão)

Após gerar uma resposta (ou um resultado intermediário), o agente **avalia a própria saída**:

```
┌─────────────────────────────────────────────┐
│              Loop Agêntico                  │
│                                             │
│  ┌─────────┐    ┌──────────┐    ┌────────┐ │
│  │ Planejar│───►│ Executar │───►│Refletir│ │
│  └────▲────┘    └──────────┘    └───┬────┘ │
│       │                             │      │
│       │    ┌──────────────┐         │      │
│       └────┤ Precisa      │◄────────┘      │
│            │ melhorar?    │                │
│            └──────┬───────┘                │
│                   │ Não                    │
│                   ▼                        │
│           [ Resposta Final ]               │
└─────────────────────────────────────────────┘
```

As perguntas que o agente faz a si mesmo durante a reflexão:

- **Relevância:** Os documentos recuperados são relevantes para a pergunta?
- **Completude:** A resposta cobre todos os aspectos da pergunta?
- **Fidelidade:** A resposta é fiel aos documentos fonte (sem alucinação)?
- **Coerência:** A resposta é internamente consistente e bem estruturada?

Se algum critério falha, o agente decide a ação corretiva:

| Problema detectado | Ação corretiva |
| :--- | :--- |
| Documentos irrelevantes | Reformular a query e buscar novamente |
| Resposta incompleta | Identificar lacunas e fazer buscas adicionais |
| Alucinação detectada | Descartar trecho e regenerar com base nos documentos |
| Consulta ambígua | Pedir clarificação ou testar múltiplas interpretações |

### 2.3 Tool Use (Uso de Ferramentas)

O agente não está limitado a buscar em um único índice. Ele pode ter acesso a múltiplas ferramentas:

- **Busca vetorial** na base de conhecimento interna
- **Busca na web** para informações recentes
- **SQL** para consultar bancos de dados estruturados
- **APIs** para dados em tempo real (preços, clima, status)
- **Calculadora** para operações matemáticas

O agente decide **qual ferramenta usar** em cada passo do plano — por isso o nome "agêntico".

---

## 3. Frameworks e Padrões

### CRAG (Corrective RAG)

O CRAG adiciona uma etapa de **avaliação de relevância** logo após o retrieval:

```
Query → Retrieval → [Avaliar Relevância] → Correto? ─── Sim ──► Gerar Resposta
                                              │
                                             Não
                                              │
                                              ▼
                                     Busca Web complementar
                                              │
                                              ▼
                                       Gerar Resposta
```

Se os documentos recuperados não passam no filtro de relevância, o CRAG recorre a uma busca web como fallback — combinando o melhor do conhecimento interno com informação externa.

### Self-RAG

O Self-RAG treina o LLM para emitir **tokens especiais de reflexão** junto com a resposta:

- `[Retrieve]` — "Preciso buscar mais informação para responder isso"
- `[IsRel]` — "Este documento é relevante para a pergunta?"
- `[IsSup]` — "Minha afirmação é suportada pelo documento?"
- `[IsUse]` — "Minha resposta é útil para o usuário?"

Isso transforma a reflexão em parte do processo de geração, sem precisar de chamadas extras ao LLM.

---

## 4. Exemplo Concreto — Agente de Suporte Técnico

Imagine um agente de suporte para uma plataforma SaaS:

**Pergunta do usuário:** _"Minha integração com o Stripe parou de funcionar depois da atualização de ontem"_

**Iteração 1 — Planning:**
1. Buscar changelog da atualização mais recente
2. Buscar documentação da integração com Stripe
3. Buscar issues conhecidos relacionados a Stripe

**Iteração 1 — Execução:**
- Recupera changelog → encontra: _"Atualização de headers de autenticação para API v3"_
- Recupera docs Stripe → encontra: _"A integração usa header `X-Auth-Token`"_
- Busca issues → nenhum issue aberto

**Iteração 1 — Reflexão:**
- _"O changelog menciona mudança nos headers de autenticação. A integração Stripe usa um header de auth. Há uma correlação provável, mas preciso verificar se o header específico foi afetado."_

**Iteração 2 — Execução adicional:**
- Busca específica: _"mudanças X-Auth-Token API v3"_
- Encontra: _"Header `X-Auth-Token` renomeado para `Authorization: Bearer` na v3"_

**Resposta final:**
_"A atualização de ontem migrou a API para v3, que renomeia o header de autenticação de `X-Auth-Token` para `Authorization: Bearer`. A integração com Stripe precisa ser atualizada para usar o novo formato de header."_

Sem o loop agêntico, o sistema teria retornado apenas o changelog genérico sem fazer a conexão entre a mudança e o problema específico.

---

## 5. Vantagens e Limitações

**Respostas mais precisas:** O loop de reflexão captura e corrige erros antes de entregar ao usuário.

**Lida com perguntas complexas:** Decomposição e planejamento permitem responder perguntas que exigem múltiplas fontes.

**Autocorreção:** O sistema detecta alucinações e documentos irrelevantes sem intervenção humana.

**Flexibilidade:** Diferentes estratégias para diferentes tipos de consulta, em vez de one-size-fits-all.

**Latência maior:** Múltiplas iterações significam mais chamadas ao LLM e mais tempo de resposta.

**Custo:** Cada iteração do loop consome tokens — uma pergunta pode gerar 3-5x mais chamadas que um RAG simples.

**Risco de loops infinitos:** Sem limites bem definidos, o agente pode ficar preso refinando indefinidamente. É essencial definir um **número máximo de iterações** e critérios claros de parada.

**Complexidade de implementação:** Orquestrar planning, execução e reflexão exige frameworks robustos (LangGraph, CrewAI, Autogen).

---

## Conclusão

O Agentic & Adaptive RAG representa a evolução do retrieval de um **pipeline passivo** para um **sistema autônomo**. O Adaptive RAG traz inteligência na escolha da estratégia, enquanto o loop agêntico com planning e reflection permite que o sistema raciocine sobre suas próprias limitações e se corrija. O custo é maior latência e complexidade, mas o ganho em qualidade — especialmente para perguntas complexas — é transformador. Frameworks como CRAG e Self-RAG mostram que essa evolução já está consolidada na pesquisa e rapidamente chegando à produção.
