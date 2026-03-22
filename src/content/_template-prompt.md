# Prompt para Geração de Conteúdo

Use o prompt abaixo substituindo `{{ASSUNTO}}` pelo tema desejado.

---

````
Gere um conteúdo educacional em Markdown sobre: {{ASSUNTO}}

O conteúdo é para uma página pessoal de estudos de IA. Segue uma estrutura de exemplo:

# {{ASSUNTO}}

Parágrafo introdutório (2-3 frases): o que é, por que é relevante no contexto de IA.

## Conceitos Fundamentais

Explique os conceitos-base necessários para entender o assunto. Use sub-headings (###) se houver mais de um conceito.

## Como Funciona

Explicação técnica do mecanismo/processo, passo a passo. Use listas ordenadas para processos sequenciais. Inclua fórmulas ou pseudocódigo em blocos de código quando relevante.

## Tipos / Variações

Tabela comparativa ou lista dos principais tipos/abordagens, com breve descrição de cada.

| Tipo | Descrição | Quando usar |
|------|-----------|-------------|

## Exemplo Prático

Um exemplo concreto e simples que ilustre o conceito. Pode incluir:
- Bloco de código (Python preferencialmente)
- Diagrama em texto (ASCII ou Mermaid)
- Input → Output demonstrando o comportamento

## Vantagens e Limitações

Lista com ✅ vantagens e ⚠️ limitações reais e práticas.

## Relação com Outros Tópicos

Breve parágrafo conectando este assunto a outros temas de IA (ex: como se relaciona com deep learning, NLP, etc).

## Referências e Leitura Complementar

- Links para papers, docs ou artigos relevantes

---

Regras de formatação:
- Use linguagem clara e direta, em PT-BR
- Headings: h1 apenas no título, h2 para seções principais, h3 para sub-tópicos
- Use **negrito** para termos-chave na primeira aparição
- Use `código inline` para nomes de funções, bibliotecas e termos técnicos
- Use blocos de código com language tag (```python, ```bash, etc)
- Use tabelas para comparações
- Use listas para enumerações
- Não use emojis exceto nos marcadores de vantagens/limitações (✅ / ⚠️)
- Tamanho alvo: 800-1500 palavras
````
