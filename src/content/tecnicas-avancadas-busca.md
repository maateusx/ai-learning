# Técnicas Avançadas de Busca

Quando você pergunta algo para um sistema de [RAG](#rag-hibrida), a qualidade da resposta depende diretamente da qualidade dos documentos recuperados. Mas e se a sua pergunta for curta, vaga ou ambígua? Técnicas como **Query Expansion** e **HyDE** reformulam a pergunta antes de buscar, garantindo que o sistema encontre os melhores resultados mesmo quando o usuário não sabe exatamente como perguntar.

---

## 1. Query Expansion: Ampliando a Consulta

A **Query Expansion (Expansão de Consulta)** é a técnica de reescrever ou enriquecer a pergunta do usuário antes de enviá-la para o mecanismo de busca. O objetivo é cobrir mais variações do mesmo conceito.

### Como funciona?

1. O usuário digita uma pergunta curta: _"pneu furado"_.
2. O sistema usa um [LLM](#ia-e-modelos) para expandir: _"troca de pneu, manutenção de rodas, borracha automotiva, estepe, calibragem"_.
3. A busca é feita com a consulta expandida, aumentando as chances de encontrar documentos relevantes.

### Tipos de expansão:

| Tipo | Descrição | Exemplo |
| :--- | :-------- | :------ |
| **Sinônimos** | Adiciona palavras com mesmo significado | "carro" → "carro, automóvel, veículo" |
| **Termos relacionados** | Adiciona conceitos adjacentes | "diabetes" → "diabetes, glicemia, insulina, hemoglobina glicada" |
| **Multi-query** | Gera N versões diferentes da mesma pergunta | "Como funciona RAG?" → 3 reformulações distintas |
| **Step-back** | Generaliza a pergunta para buscar conceitos mais amplos | "Qual a velocidade do F-22?" → "Quais as especificações de aeronaves militares?" |

### Exemplo prático com Multi-query:

```python
# Pergunta original
query = "Como reduzir custos com IA?"

# LLM gera 3 variações
queries_expandidas = [
    "Como reduzir custos com IA?",
    "Estratégias para diminuir gastos em projetos de inteligência artificial",
    "Otimização de orçamento para implementação de modelos de machine learning"
]

# Busca vetorial é feita para CADA variação
# Resultados são combinados e deduplicados
```

Essa abordagem multi-query é especialmente eficaz com [Busca Híbrida](#busca-hibrida), pois cada variação pode capturar documentos diferentes tanto na busca semântica quanto na busca por palavras-chave.

---

## 2. HyDE (Hypothetical Document Embeddings)

O **HyDE** é uma técnica engenhosa que inverte a lógica da busca. Em vez de buscar diretamente pela pergunta, o sistema primeiro **gera uma resposta hipotética** e depois busca documentos parecidos com essa resposta.

### Por que isso funciona?

O problema: o vetor de uma **pergunta curta** geralmente fica distante do vetor de um **parágrafo de resposta**, mesmo que falem sobre o mesmo assunto. Perguntas e respostas têm estruturas linguísticas muito diferentes.

A solução do HyDE:

1. O usuário pergunta: _"Qual a política de férias?"_
2. O [LLM](#ia-e-modelos) gera uma resposta hipotética (pode ser imprecisa, não importa):
   > _"A empresa oferece 30 dias de férias por ano, que podem ser divididas em até 3 períodos..."_
3. Essa resposta hipotética é transformada em um vetor (embedding).
4. A [Busca Vetorial](#busca-vetorial) usa esse vetor para encontrar documentos reais semelhantes.

### Por que a resposta falsa funciona?

Porque o embedding da resposta hipotética estará no mesmo "bairro" vetorial dos documentos reais sobre o assunto. O [ANN](#universo-dos-vetores) encontra os vizinhos mais próximos desse vetor — e esses vizinhos são os documentos verdadeiros.

```python
# Passo 1: Gerar documento hipotético
resposta_hipotetica = llm.generate(
    f"Responda de forma detalhada: {pergunta_usuario}"
)

# Passo 2: Gerar embedding da resposta (não da pergunta!)
embedding_hyde = modelo_embedding.encode(resposta_hipotetica)

# Passo 3: Buscar documentos reais similares à resposta hipotética
resultados = vector_db.query(
    query_embedding=embedding_hyde,
    top_k=5
)
```

---

## 3. Comparativo

| Critério | Busca Simples | Query Expansion | HyDE |
| :------- | :------------ | :-------------- | :--- |
| **Complexidade** | Baixa | Média | Alta |
| **Custo** | 1 chamada ao embedding | 1 chamada ao LLM + N buscas | 1 chamada ao LLM + 1 busca |
| **Perguntas curtas** | Fraco | Bom | Excelente |
| **Perguntas específicas** | Bom | Bom | Pode gerar ruído |
| **Latência** | Baixa | Média (N buscas) | Média (geração + busca) |

---

## 4. Quando Usar Cada Técnica?

- **Query Expansion (Multi-query):** Quando os usuários fazem perguntas genéricas e você quer maximizar o recall (encontrar o máximo de documentos relevantes). Funciona muito bem com [Busca Híbrida](#busca-hibrida) e [RRF](#reciprocal-rank-fusion).

- **HyDE:** Quando as perguntas são muito curtas (1-3 palavras) e a busca simples não retorna bons resultados. Ideal para cenários de FAQ e atendimento ao cliente.

- **Ambas combinadas:** Em pipelines de [RAG](#rag-hibrida) de alto desempenho, é possível usar query expansion para gerar variações e HyDE para uma delas, depois combinar todos os resultados.

---

## 5. Vantagens e Limitações

✅ Query Expansion aumenta significativamente o recall sem alterar a infraestrutura de busca.

✅ HyDE melhora drasticamente a qualidade para perguntas curtas e ambíguas.

✅ Ambas as técnicas são compatíveis com qualquer [banco vetorial](#universo-dos-vetores).

✅ Multi-query naturalmente se beneficia de [fusão de resultados (RRF)](#reciprocal-rank-fusion).

⚠️ Ambas adicionam latência (chamadas extras ao [LLM](#ia-e-modelos)).

⚠️ HyDE pode gerar ruído se a resposta hipotética for muito diferente da realidade.

⚠️ Query Expansion com muitas variações multiplica o custo de busca.

⚠️ Requerem um LLM disponível no momento da busca, aumentando dependências do sistema.

---

## Relação com Outros Tópicos

Essas técnicas se posicionam entre a pergunta do usuário e o mecanismo de busca no pipeline de [RAG](#rag-hibrida). Elas melhoram a entrada da [Busca Vetorial](#busca-vetorial) e da [Busca Híbrida](#busca-hibrida), resultando em documentos mais relevantes antes mesmo do [Reranking](#cross-encoders). A eficácia dessas técnicas pode ser medida comparando [Precision e Recall](#metricas-qualidade) antes e depois da sua aplicação.
