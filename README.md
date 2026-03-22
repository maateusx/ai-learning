# AI Learning

Plataforma interativa de estudos sobre Inteligência Artificial, com foco em **RAG (Retrieval-Augmented Generation)**, embeddings, busca vetorial e padrões de agentes.

O conteúdo cobre desde conceitos fundamentais até técnicas avançadas:

- Introdução a IA e modelos de linguagem
- Busca vetorial, keyword e híbrida
- Chunking, Cross-Encoders e Reciprocal Rank Fusion
- RAG, Graph RAG e RAG Híbrida
- Agentic/Adaptive RAG e Orchestrator-Worker
- Embeddings hiperbólicos e métricas de qualidade
- Protocolos MCP e A2A
- Context/Prompt Caching, Tenancy e Security Trimming

## Features

- Conteúdo em **3 idiomas**: Português, English e Español
- **Dark/Light mode**
- **Text-to-Speech** com player de áudio integrado
- Sidebar com navegação por seções
- Markdown renderizado com syntax highlighting

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- react-markdown + rehype-highlight + remark-gfm
- lucide-react (ícones)

## Como rodar

```bash
# Clone o repositório
git clone git@github.com:maateusx/ai-learning.git
cd ai-learning

# Instale as dependências
npm install

# Rode o servidor de desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:5173`.

## Outros comandos

```bash
# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```
