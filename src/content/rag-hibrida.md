# RAG Híbrida (Retrieval-Augmented Generation)

Se você já usou o ChatGPT e ele inventou uma informação com total convicção (as famosas ["alucinações"](#ia-e-modelos)), você entende o problema das IAs puras. A **RAG (Geração Aumentada por Recuperação)** é a solução para isso.

Imagine que a IA é um estudante geniozinho fazendo uma prova.

- **IA Comum:** Faz a prova confiando apenas na memória (que pode falhar).
- **IA com RAG:** Faz a prova com o livro aberto na sua frente para consultar as respostas.

A **RAG Híbrida** é quando esse estudante usa dois tipos de índices diferentes para encontrar a página certa do livro o mais rápido possível.

---

## 1. O que compõe a RAG Híbrida?

A RAG "simples" geralmente usa apenas Busca Vetorial. A **RAG Híbrida** combina o melhor de todos os mundos que discutimos anteriormente:

1.  **Busca Esparsa (BM25):** Para encontrar termos exatos, nomes de produtos ou códigos técnicos.
2.  **Busca Densa (Vetorial):** Para entender a intenção e o contexto da pergunta do usuário.
3.  **Fusão (RRF):** Para equilibrar os resultados dessas duas buscas.
4.  **Reranking:** Para garantir que a informação mais relevante esteja no topo antes de enviar para a IA.

---

## 2. O Fluxo de Trabalho (Pipeline)

Para quem não é técnico, o processo parece mágica, mas segue estes 4 passos lógicos:

### Passo 1: A Pergunta (Query)

O usuário faz uma pergunta: _"Qual é a política de reembolso para produtos eletrônicos comprados em promoção?"_

### Passo 2: A Recuperação Híbrida (Retrieval)

O sistema não tenta responder de imediato. Ele corre no banco de dados e faz duas buscas simultâneas:

- **Busca por Palavras:** Procura por "reembolso", "eletrônicos" e "promoção".
- **Busca por Significado:** Procura por documentos que falem sobre devolução de dinheiro e regras de compra.

### Passo 3: Filtro de Qualidade (RRF + Reranker)

Os resultados são misturados pelo **RRF** e depois o **Reranker** (o especialista) olha para os 5 melhores parágrafos encontrados e decide qual deles realmente responde à pergunta.

### Passo 4: Geração da Resposta (Generation)

O sistema envia para a IA (como o GPT-4 ou Claude — veja [IA e Modelos](#ia-e-modelos)) o seguinte comando: _"Aqui estão as regras da empresa [Texto do Documento]. Com base apenas nisso, responda ao usuário: [Pergunta]"_.

---

## 3. Por que a RAG Híbrida é superior?

| Critério           | IA Pura (Sem RAG)            | RAG Simples (Só Vetores)            | RAG Híbrida                                       |
| :----------------- | :--------------------------- | :---------------------------------- | :------------------------------------------------ |
| **Confiabilidade** | Baixa (Alucina muito).       | Média (Pode errar termos técnicos). | **Altíssima** (Baseada em fatos e termos exatos). |
| **Atualização**    | Precisa de novo treinamento. | Basta atualizar os documentos.      | **Basta atualizar os documentos.**                |
| **Precisão**       | N/A                          | Boa para conceitos gerais.          | **Excelente para casos complexos.**               |
| **Custo**          | Caríssimo (Treinamento).     | Baixo.                              | Moderado (Mas muito eficiente).                   |

---

## 4. Vantagens para o Negócio

- **Fim das Alucinações:** A IA só responde o que está nos seus documentos. Se ela não encontrar a resposta, ela dirá "Eu não sei".
- **Segurança de Dados:** Você pode controlar quais documentos a IA pode ler, garantindo que informações privadas não vazem.
- **Citação de Fontes:** A RAG permite que a IA diga: _"Segundo o parágrafo 4 do manual técnico..."_, dando muito mais credibilidade.

---

## Conclusão

A **RAG Híbrida** é a arquitetura de estado da arte para qualquer empresa que queira usar IA de forma profissional. Ela transforma um modelo de linguagem genérico em um especialista profundo nos **seus** dados, combinando a intuição da busca vetorial com a precisão da busca por palavras-chave. Para isso, seus documentos passam por [Chunking](#chunking) antes de serem indexados, e a qualidade dos resultados pode ser medida com [métricas como Precision e NDCG](#metricas-qualidade).
