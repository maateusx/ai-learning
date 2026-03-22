# Métricas de Qualidade em Sistemas de Busca

Imagine que você é um professor corrigindo uma prova. Não basta saber se o aluno acertou — você precisa saber: _"Das respostas que ele deu, quantas estão certas?"_ e _"De todas as respostas certas possíveis, quantas ele encontrou?"_. É exatamente assim que medimos a qualidade de um sistema de busca: usando **Precision**, **Recall** e **NDCG**.

---

## 1. Precision: Quantos Resultados São Relevantes?

A **Precision (Precisão)** responde à pergunta: _"Dos resultados que o sistema me trouxe, quantos são realmente úteis?"_

### Fórmula:

```
Precision = Resultados Relevantes Retornados / Total de Resultados Retornados
```

### Exemplo:

Você busca "política de reembolso" e o sistema retorna 10 documentos. Desses 10, apenas 6 falam realmente sobre reembolso.

```
Precision = 6 / 10 = 0.60 (60%)
```

### Precision@K:

Na prática, medimos a precisão nos **top K** resultados, porque o usuário raramente olha além dos primeiros. O **Precision@5** avalia apenas os 5 primeiros resultados retornados.

| Posição | Documento | Relevante? |
| :------ | :-------- | :--------- |
| 1 | Política de Reembolso v2 | ✅ |
| 2 | Manual do Funcionário | ❌ |
| 3 | FAQ - Devoluções | ✅ |
| 4 | Regras de Reembolso Internacional | ✅ |
| 5 | Catálogo de Produtos | ❌ |

```
Precision@5 = 3 / 5 = 0.60 (60%)
```

---

## 2. Recall: Quantos Relevantes Foram Encontrados?

O **Recall (Revocação)** responde à pergunta oposta: _"De todos os documentos relevantes que existem no banco, quantos o sistema conseguiu encontrar?"_

### Fórmula:

```
Recall = Resultados Relevantes Retornados / Total de Relevantes no Banco
```

### Exemplo:

No seu banco existem 15 documentos sobre reembolso. O sistema retornou 10 resultados, dos quais 6 são relevantes.

```
Recall = 6 / 15 = 0.40 (40%)
```

O sistema encontrou 60% dos resultados corretos (precision), mas só cobriu 40% de todos os documentos relevantes (recall).

---

## 3. O Tradeoff Precision vs. Recall

Precision e Recall vivem em tensão constante:

- **Aumentar resultados retornados** → Recall sobe (encontra mais relevantes), mas Precision cai (mais lixo junto).
- **Diminuir resultados retornados** → Precision sobe (menos lixo), mas Recall cai (pode perder documentos importantes).

### Como equilibrar?

| Cenário | Prioridade | Por quê |
| :------ | :--------- | :------ |
| Atendimento ao cliente | **Precision** | O usuário quer a resposta certa, não 20 opções |
| Pesquisa jurídica | **Recall** | Não pode perder nenhum documento relevante |
| E-commerce | **Equilíbrio** | Mostrar produtos relevantes sem poluir a página |
| [RAG](#rag-hibrida) empresarial | **Precision** | Enviar chunks irrelevantes para o [LLM](#ia-e-modelos) desperdiça [tokens](#ia-e-modelos) e pode confundir a resposta |

A [Busca Híbrida](#busca-hibrida) combinada com [Cross-Encoders](#cross-encoders) é uma das estratégias mais eficazes para melhorar ambas as métricas simultaneamente: a busca híbrida maximiza o recall e o reranker filtra para maximizar a precision.

---

## 4. NDCG: A Ordem Importa

O **NDCG (Normalized Discounted Cumulative Gain)** vai além de contar acertos. Ele avalia se os resultados **mais relevantes estão nas primeiras posições**.

### Intuição:

Imagine dois sistemas que retornam os mesmos 5 documentos relevantes em 10 resultados:

- **Sistema A:** Os 5 relevantes estão nas posições 1, 2, 3, 4 e 5.
- **Sistema B:** Os 5 relevantes estão nas posições 2, 4, 6, 8 e 10.

Ambos têm Precision@10 = 50% e Recall idêntico. Mas o **Sistema A** é claramente melhor — o NDCG captura essa diferença.

### Como funciona (simplificado):

1. Cada resultado recebe uma pontuação de relevância (ex: 0, 1, 2 ou 3).
2. Resultados em posições mais baixas recebem um **desconto logarítmico** — quanto mais distante do topo, menos vale.
3. O score é normalizado pelo "resultado perfeito" (todos os relevantes no topo).

```
DCG = Σ (relevância_i / log₂(posição_i + 1))

NDCG = DCG / DCG_ideal
```

### Exemplo numérico:

| Posição | Relevância | Ganho Descontado |
| :------ | :--------- | :--------------- |
| 1 | 3 (muito relevante) | 3 / log₂(2) = 3.00 |
| 2 | 0 (irrelevante) | 0 / log₂(3) = 0.00 |
| 3 | 2 (relevante) | 2 / log₂(4) = 1.00 |
| 4 | 3 (muito relevante) | 3 / log₂(5) = 1.29 |
| 5 | 1 (pouco relevante) | 1 / log₂(6) = 0.39 |

```
DCG = 3.00 + 0.00 + 1.00 + 1.29 + 0.39 = 5.68
```

Se o ranking perfeito geraria DCG = 8.50:

```
NDCG = 5.68 / 8.50 = 0.668 (66.8%)
```

O resultado de 66.8% indica que o ranking é bom, mas poderia melhorar — o segundo resultado deveria ser relevante. O [RRF](#reciprocal-rank-fusion) e os [Cross-Encoders](#cross-encoders) são técnicas que melhoram diretamente o NDCG ao reordenar resultados.

---

## 5. Resumo das Métricas

| Métrica | O que Mede | Quando Usar | Score Ideal |
| :------ | :--------- | :---------- | :---------- |
| **Precision@K** | % de resultados relevantes nos top K | Avaliar a qualidade dos primeiros resultados | 1.0 (100%) |
| **Recall@K** | % de todos os relevantes que foram encontrados | Avaliar cobertura da busca | 1.0 (100%) |
| **NDCG@K** | Qualidade do ranking (ordem importa) | Avaliar se os melhores estão no topo | 1.0 (ranking perfeito) |

---

## 6. Vantagens e Limitações

✅ Precision e Recall são intuitivas e fáceis de calcular.

✅ NDCG captura a qualidade do ranking, não apenas presença/ausência.

✅ Precision@K é a métrica mais prática para sistemas de [RAG](#rag-hibrida) (só importa o que chega ao LLM).

✅ Permitem comparar objetivamente diferentes estratégias de busca.

⚠️ Exigem um conjunto de avaliação com relevância marcada manualmente (golden set).

⚠️ Recall exige saber o total de documentos relevantes no banco — nem sempre é viável.

⚠️ NDCG com poucos resultados pode ser instável.

⚠️ Métricas offline nem sempre refletem a satisfação real do usuário.

---

## Relação com Outros Tópicos

Essas métricas são usadas para avaliar e comparar todas as técnicas de busca discutidas neste material: [Busca Vetorial](#busca-vetorial), [Busca por Palavras-chave](#busca-palavra-chave), [Busca Híbrida](#busca-hibrida), [RRF](#reciprocal-rank-fusion) e [Cross-Encoders](#cross-encoders). Técnicas como [Query Expansion e HyDE](#tecnicas-avancadas-busca) tipicamente melhoram o Recall, enquanto [Rerankers](#cross-encoders) melhoram Precision e NDCG. Em pipelines de [RAG](#rag-hibrida), o Precision@K é especialmente crítico, pois cada chunk irrelevante consome [tokens](#ia-e-modelos) e pode degradar a resposta.
