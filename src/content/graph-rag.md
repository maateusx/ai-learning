# GraphRAG (Knowledge Graphs)

O RAG tradicional recupera **chunks de texto** e os passa ao LLM. Isso funciona bem para perguntas diretas, mas falha quando a resposta depende de **conexões entre entidades** espalhadas por vários documentos. O **GraphRAG** resolve isso construindo um **Knowledge Graph** (grafo de conhecimento) a partir dos documentos e usando a estrutura do grafo para retrieval — capturando relações que a busca vetorial simplesmente não enxerga.

---

## 1. O problema que o GraphRAG resolve

Considere esta base de documentos de uma empresa:

- **Doc A:** _"Maria Silva é a tech lead do time de pagamentos."_
- **Doc B:** _"O time de pagamentos é responsável pela integração com o Stripe."_
- **Doc C:** _"A integração com o Stripe está com latência acima do SLA."_

**Pergunta:** _"Quem é responsável pelo problema de latência no Stripe?"_

| Abordagem | Resultado |
| :--- | :--- |
| RAG vetorial | Recupera Doc C (mais similar semanticamente). Não encontra Maria. |
| GraphRAG | Segue o caminho: Stripe → time de pagamentos → Maria Silva. Responde corretamente. |

O grafo conecta os pontos entre documentos que a busca por similaridade trata como independentes.

---

## 2. Como funciona o GraphRAG?

O pipeline tem duas fases: **construção do grafo** (indexação) e **retrieval baseado em grafo** (consulta).

### Fase 1 — Construção do Knowledge Graph

```
Documentos Brutos
       │
       ▼
[ Extração de Entidades e Relações (LLM) ]
       │
       ▼
  ┌─────────────────────────────────┐
  │        Knowledge Graph          │
  │                                 │
  │  (Maria)──[tech lead]──►(Pagamentos)
  │                            │    │
  │                       [responsável]
  │                            │    │
  │                            ▼    │
  │                        (Stripe) │
  │                            │    │
  │                       [tem issue]
  │                            │    │
  │                            ▼    │
  │                      (Latência) │
  └─────────────────────────────────┘
```

**Etapas da construção:**

1. **Extração de entidades:** O LLM identifica pessoas, times, tecnologias, conceitos — os **nós** do grafo.
2. **Extração de relações:** O LLM identifica como as entidades se conectam — as **arestas** do grafo (ex: "é líder de", "depende de", "causou").
3. **Resolução de entidades:** Unificar referências à mesma entidade (_"Maria"_, _"Maria Silva"_, _"a tech lead"_ → mesmo nó).
4. **Community Detection:** Agrupar nós densamente conectados em **comunidades** que representam temas ou domínios.
5. **Community Summaries:** Gerar resumos de cada comunidade para buscas de alto nível.

### Fase 2 — Retrieval baseado em grafo

```
Consulta do Usuário
       │
       ▼
[ Extrair entidades da consulta ]
       │
       ▼
[ Localizar entidades no grafo ]
       │
       ▼
[ Expandir vizinhança (1-2 hops) ]
       │
       ▼
[ Coletar subgrafo relevante ]
       │
       ▼
[ Converter subgrafo em contexto textual ]
       │
       ▼
[ LLM gera resposta ]
```

O retrieval encontra as entidades mencionadas na pergunta, expande para os nós vizinhos (1-2 saltos no grafo), e monta um contexto que preserva as **relações explícitas** entre os conceitos.

---

## 3. Local vs Global Search

O paper original da Microsoft sobre GraphRAG introduz dois modos de busca:

### Local Search

- Parte de entidades específicas mencionadas na query
- Expande a vizinhança no grafo
- Ideal para: _"Quais projetos Maria lidera?"_

### Global Search

- Usa os **community summaries** em vez de nós individuais
- Agrega informações de múltiplas comunidades
- Ideal para: _"Quais são os principais desafios técnicos da empresa?"_

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
       Entidades + Vizinhos   Community Summaries
                │                     │
                ▼                     ▼
        Resposta específica    Resposta temática
```

---

## 4. Construção prática do Knowledge Graph

### Prompt de extração (simplificado)

O LLM recebe cada chunk de texto com um prompt como:

```
Dado o texto abaixo, extraia todas as entidades e relações.

Formato de saída:
Entidades: (nome, tipo, descrição)
Relações: (entidade_origem, tipo_relação, entidade_destino, descrição)

Texto: "Maria Silva é a tech lead do time de pagamentos.
O time migrou para o Stripe em janeiro de 2024."
```

**Saída esperada:**

```
Entidades:
- (Maria Silva, Pessoa, "Tech lead do time de pagamentos")
- (Time de Pagamentos, Equipe, "Time responsável por pagamentos")
- (Stripe, Tecnologia, "Plataforma de pagamentos")

Relações:
- (Maria Silva, É_LÍDER_DE, Time de Pagamentos, "Tech lead")
- (Time de Pagamentos, UTILIZA, Stripe, "Migração em Jan/2024")
```

### Armazenamento

O grafo é tipicamente armazenado em:

| Banco | Tipo | Quando usar |
| :--- | :--- | :--- |
| Neo4j | Banco de grafos nativo | Grafos grandes, queries complexas com Cypher |
| NetworkX | Biblioteca Python | Prototipação, grafos pequenos em memória |
| Amazon Neptune | Managed graph DB | Produção na AWS |
| FalkorDB | Redis-based graph | Baixa latência, integração com Redis |

---

## 5. Exemplo Concreto

Base de conhecimento de um hospital:

**Grafo construído:**
```
(Dr. Santos)──[atende]──►(Cardiologia)
                              │
                         [trata]
                              │
                              ▼
                     (Insuficiência Cardíaca)
                              │
                        [medicamento]
                              │
                              ▼
                        (Enalapril)──[interage com]──►(Ibuprofeno)
```

**Pergunta:** _"Há risco em prescrever ibuprofeno para pacientes do Dr. Santos?"_

**Retrieval no grafo:**
1. Localiza `Dr. Santos`
2. Expande: Dr. Santos → Cardiologia → Insuficiência Cardíaca → Enalapril
3. Encontra relação: Enalapril **interage com** Ibuprofeno
4. Contexto para o LLM inclui toda a cadeia de relações

**Resposta:** _"Sim. O Dr. Santos atende cardiologia e seus pacientes com insuficiência cardíaca frequentemente usam Enalapril, que tem interação medicamentosa conhecida com Ibuprofeno."_

Uma busca vetorial dificilmente conectaria "Dr. Santos" a "Ibuprofeno" — são conceitos distantes semanticamente.

---

## 6. GraphRAG Híbrido

Na prática, as melhores implementações combinam GraphRAG com busca vetorial:

```
Consulta
   │
   ├──► [ Busca Vetorial ] ──► Chunks relevantes
   │
   └──► [ Busca no Grafo ] ──► Subgrafo com relações
                │
                ▼
     [ Merge dos contextos ]
                │
                ▼
         [ LLM gera resposta ]
```

A busca vetorial traz contexto textual rico, enquanto o grafo traz relações estruturadas. Juntos, cobrem tanto a profundidade semântica quanto a conectividade entre entidades.

---

## 7. Vantagens e Limitações

**Relações explícitas:** Captura conexões entre entidades que a busca vetorial perde completamente.

**Raciocínio multi-hop:** Responde perguntas que exigem seguir cadeias de relações (A → B → C → D).

**Global understanding:** Community summaries permitem perguntas sobre temas amplos, não só fatos pontuais.

**Explicabilidade:** O caminho no grafo mostra exatamente como a resposta foi derivada.

**Custo de indexação:** Extrair entidades e relações com LLM é caro — cada chunk exige uma chamada.

**Qualidade da extração:** Erros na extração de entidades se propagam por todo o grafo. Resolução de entidades é especialmente difícil.

**Manutenção:** Documentos atualizados exigem re-extração e atualização do grafo.

**Complexidade:** Requer expertise em bancos de grafos, modelagem de entidades e tuning de queries de traversal.

---

## Conclusão

O GraphRAG transforma documentos não-estruturados em uma rede de conhecimento estruturado, onde as **relações entre conceitos** são cidadãos de primeira classe. Ele é especialmente poderoso para domínios onde a resposta depende de conectar informações espalhadas — saúde, compliance, organizações complexas, bases de conhecimento técnico. O custo de construção e manutenção do grafo é significativo, mas o ganho em qualidade para perguntas multi-hop e de raciocínio é algo que nenhuma outra técnica de RAG consegue igualar.
