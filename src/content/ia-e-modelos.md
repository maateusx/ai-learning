# IA e Modelos de Linguagem (LLMs)

Imagine um estudante que leu toda a internet — livros, artigos, fóruns, código — e agora consegue escrever sobre qualquer assunto com fluência. Esse é o **LLM (Large Language Model)**. Ele é o cérebro por trás de ferramentas como ChatGPT, Claude e Llama, e é o componente que gera as respostas finais em sistemas de [RAG](#rag-hibrida).

---

## 1. O que é um LLM?

Um **Large Language Model** é uma rede neural treinada com bilhões de textos para prever a próxima palavra em uma sequência. Ao fazer isso trilhões de vezes, o modelo "aprende" gramática, fatos, raciocínio lógico e até nuances culturais.

### Como ele gera texto?

O processo é surpreendentemente simples na essência:

1. Você envia um texto (o **prompt**).
2. O modelo calcula a probabilidade de cada palavra possível ser a próxima.
3. Ele escolhe uma palavra e repete o processo até completar a resposta.

É como o autocompletar do celular, mas com bilhões de parâmetros em vez de centenas.

---

## 2. Tokens: A Unidade de Pensamento da IA

Os LLMs não leem letras nem palavras — eles leem **tokens**. Um token é um fragmento de texto que o modelo usa como unidade básica de processamento.

### Exemplos de tokenização:

| Texto Original | Tokens (aproximado) |
| :------------- | :------------------ |
| "Inteligência Artificial" | `["Int", "elig", "ência", " Art", "ificial"]` |
| "Hello World" | `["Hello", " World"]` |
| "ChatGPT é incrível" | `["Chat", "GPT", " é", " incrível"]` |

### Regra prática:

- **Em inglês:** 1 token ≈ ¾ de uma palavra (1.000 tokens ≈ 750 palavras).
- **Em português:** Tokens tendem a ser menores por causa de acentos e conjugações, então 1.000 tokens ≈ 600-650 palavras.

Os tokens são a "moeda" das IAs — você paga por token consumido, e o limite de processamento é medido em tokens.

---

## 3. Context Window: A Memória de Curto Prazo

A **Context Window (Janela de Contexto)** é o limite máximo de tokens que um modelo consegue processar de uma só vez. Pense nela como a mesa de trabalho do estudante: tudo o que ele precisa consultar tem que caber nessa mesa.

| Modelo | Context Window |
| :----- | :------------- |
| GPT-3.5 | 4.096 tokens (~3.000 palavras) |
| GPT-4 | 128.000 tokens (~96.000 palavras) |
| Claude 3.5 Sonnet | 200.000 tokens (~150.000 palavras) |
| Llama 3 | 8.192 tokens (~6.000 palavras) |

### Por que isso importa?

Na janela de contexto precisam caber **ao mesmo tempo**:

1. As instruções do sistema (system prompt).
2. Os documentos recuperados pela busca (os "chunks" — veja [Chunking](#chunking)).
3. A pergunta do usuário.
4. A resposta que a IA vai gerar.

Se os documentos forem grandes demais, eles não cabem na janela. É por isso que o [Chunking](#chunking) e a qualidade da [Busca Vetorial](#busca-vetorial) são tão importantes — precisamos entregar apenas os pedaços mais relevantes.

---

## 4. Alucinações: Quando a IA Inventa

**Alucinação (Hallucination)** é quando o modelo gera informações que parecem verdadeiras, são escritas com total confiança, mas são completamente falsas.

### Por que isso acontece?

O LLM é um modelo probabilístico — ele gera a sequência de palavras mais **provável**, não necessariamente a mais **verdadeira**. Se ele não tem a informação correta, ele "preenche a lacuna" com algo estatisticamente plausível.

### Exemplos clássicos:

- Inventar citações de artigos acadêmicos que não existem.
- Criar nomes de funções de bibliotecas que nunca foram implementadas.
- Afirmar datas, números ou fatos com total convicção — e estar errado.

### Como a RAG reduz alucinações?

A [RAG (Retrieval-Augmented Generation)](#rag-hibrida) é a principal arma contra alucinações. Em vez de confiar na "memória" do modelo, o sistema:

1. **Busca** documentos reais no seu banco de dados.
2. **Entrega** esses documentos como contexto na janela de contexto.
3. **Instrui** o modelo: _"Responda apenas com base nos documentos fornecidos."_

Isso transforma a IA de um "estudante confiando na memória" para um "estudante com o livro aberto".

---

## 5. Principais Modelos

| Modelo | Desenvolvedor | Destaques | Open Source? |
| :----- | :------------ | :-------- | :----------- |
| GPT-4 | OpenAI | Raciocínio avançado, multimodal | Não |
| Claude | Anthropic | Janela de contexto enorme, segurança | Não |
| Llama 3 | Meta | Melhor modelo open source | Sim |
| Gemini | Google | Integração com ecossistema Google | Não |
| Mistral | Mistral AI | Leve e eficiente | Sim |

---

## 6. Vantagens e Limitações

✅ Capacidade de entender e gerar texto em linguagem natural com alta fluência.

✅ Versatilidade — o mesmo modelo pode resumir, traduzir, codificar e raciocinar.

✅ Combinado com [RAG](#rag-hibrida), pode se tornar um especialista nos seus dados.

⚠️ Alucinações são inevitáveis sem mecanismos de grounding (como RAG).

⚠️ Custo proporcional ao número de tokens processados.

⚠️ Context Window limita a quantidade de informação processada por vez.

⚠️ Sem acesso a informações em tempo real (a menos que conectado a ferramentas externas).

---

## Relação com Outros Tópicos

Os LLMs são o componente de **geração** nos pipelines de [RAG](#rag-hibrida). Mas sem uma boa estratégia de recuperação — usando [Busca Vetorial](#busca-vetorial), [Busca Híbrida](#busca-hibrida) e [Reranking](#cross-encoders) — a IA não recebe os documentos certos, e a qualidade da resposta despenca. Entender tokens e context window também é essencial para definir a estratégia de [Chunking](#chunking) dos seus documentos.
