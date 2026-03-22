# Hyperbolic Embeddings

Até agora, todos os embeddings que vimos vivem no **espaço euclidiano** — o espaço "plano" que aprendemos na escola. Mas muitos dados do mundo real têm uma estrutura **hierárquica** natural: taxonomias, árvores de categorias, relações "é-um-tipo-de". O espaço euclidiano é péssimo para representar hierarquias. O **espaço hiperbólico** resolve isso — ele tem espaço exponencialmente crescente conforme nos afastamos do centro, igual a uma árvore que se ramifica.

---

## 1. O problema do espaço euclidiano

Imagine que você precisa representar esta taxonomia como embeddings:

```
                    Animal
                   /      \
            Mamífero      Réptil
           /    |    \        \
        Cão   Gato  Baleia   Cobra
       / | \
   Poodle Labrador Husky
```

No espaço euclidiano (plano), para manter as distâncias corretas entre todos os nós:
- `Poodle` deve estar perto de `Labrador` (irmãos)
- `Poodle` deve estar a distância média de `Gato` (primos)
- `Poodle` deve estar longe de `Cobra` (parentes distantes)

O problema é que **uma árvore com profundidade `d` tem até `2^d` folhas**, mas o espaço euclidiano em dimensão `n` cresce apenas polinomialmente. Para representar uma árvore com milhares de folhas sem distorção, você precisaria de **centenas de dimensões**.

| Espaço | Crescimento do "volume" | Ideal para |
| :--- | :--- | :--- |
| Euclidiano (ℝⁿ) | Polinomial (~rⁿ) | Dados "planos", clusters simétricos |
| Hiperbólico (ℍⁿ) | Exponencial (~eʳ) | Hierarquias, árvores, grafos scale-free |

---

## 2. O que é o espaço hiperbólico?

O espaço hiperbólico é uma geometria onde o **espaço disponível cresce exponencialmente** conforme nos afastamos da origem. Pense em um disco onde a borda tem "infinitamente mais espaço" que o centro.

### Modelo do Disco de Poincaré

O modelo mais usado para embeddings hiperbólicos é o **Disco de Poincaré**: um disco de raio 1 onde:

- O **centro** representa o nó raiz (conceitos gerais)
- A **borda** representa as folhas (conceitos específicos)
- A **distância hiperbólica** cresce muito rápido perto da borda

```
         ┌─────────────────────┐
        │                       │
       │      ○ Animal           │
      │       │                   │
     │    ○ Mamífero  ○ Réptil     │
     │   / |    \        \         │
    │ ○Cão ○Gato ○Baleia  ○Cobra    │
    │  /|\                          │
   │○P ○L ○H                        │
    │                               │
     │          (borda = ∞)        │
      └───────────────────────────┘
          Disco de Poincaré
```

Movimentos pequenos no espaço euclidiano perto da borda correspondem a **distâncias enormes** no espaço hiperbólico. Isso permite que as folhas da árvore "caibam" com distâncias corretas entre si, mesmo em dimensão baixa.

### Distância hiperbólica

No disco de Poincaré, a distância entre dois pontos `u` e `v` é:

```
d(u, v) = arcosh(1 + 2 · ‖u - v‖² / ((1 - ‖u‖²)(1 - ‖v‖²)))
```

Repare que quando `‖u‖` ou `‖v‖` se aproximam de 1 (borda do disco), o denominador vai a zero e a distância **explode** — é isso que cria o espaço exponencial.

---

## 3. Por que isso importa para RAG?

Muitas bases de conhecimento têm estrutura hierárquica implícita:

- **Documentação técnica:** Conceitos gerais → tópicos específicos → detalhes de implementação
- **E-commerce:** Categoria → subcategoria → produto → variante
- **Medicina:** Sistema → órgão → doença → tratamento → medicamento
- **Organizações:** Empresa → departamento → time → membro

Com embeddings euclidianos, perguntas que dependem de **nível hierárquico** ficam confusas:

**Pergunta:** _"O que é um mamífero?"_ (conceito geral)
**vs.**
**Pergunta:** _"Quais as características específicas do Poodle?"_ (conceito específico)

Com embeddings hiperbólicos, a **posição radial** (distância do centro) codifica naturalmente o nível de generalidade/especificidade, e o sistema pode usar isso para retrieval mais preciso.

---

## 4. Embeddings hiperbólicos na prática

### Treinamento

Os embeddings são treinados de forma similar aos euclidianos, mas com adaptações:

1. **Mapeamento para o espaço hiperbólico:** Projetar vetores no disco de Poincaré.
2. **Operações adaptadas:** Gradientes e otimização precisam de **Riemannian SGD** (gradiente descendente adaptado para geometria hiperbólica) em vez do SGD padrão.
3. **Função de perda:** Usa distância hiperbólica em vez de similaridade de cosseno.

### Comparação dimensional

A grande vantagem prática: embeddings hiperbólicos precisam de **muito menos dimensões** para representar hierarquias com fidelidade.

| Métrica | Euclidiano | Hiperbólico |
| :--- | :--- | :--- |
| Dimensões para representar WordNet | 200 | **5-10** |
| Distorção (MAP) | Alta em dim. baixa | Baixa mesmo em dim. baixa |
| Custo de armazenamento | Alto | Significativamente menor |

---

## 5. Exemplo Concreto — E-commerce

Base de produtos com hierarquia:

```
Eletrônicos
├── Smartphones
│   ├── iPhone 15 Pro
│   ├── Galaxy S24
│   └── Pixel 8
├── Notebooks
│   ├── MacBook Pro M3
│   ├── ThinkPad X1
│   └── Dell XPS 15
└── Acessórios
    ├── Carregador USB-C
    ├── Capa para iPhone
    └── Mouse Bluetooth
```

**Com embedding euclidiano:**
- _"acessório para celular"_ pode retornar `Mouse Bluetooth` (está perto no espaço euclidiano porque todos são "acessórios").

**Com embedding hiperbólico:**
- `Smartphones` e `Acessórios` estão no mesmo nível hierárquico
- `Capa para iPhone` está próxima de `iPhone 15 Pro` via relação hierárquica
- O sistema entende que _"acessório para celular"_ deve buscar na interseção entre `Acessórios` e `Smartphones`, retornando `Capa para iPhone` e `Carregador USB-C`.

---

## 6. Vantagens e Limitações

**Representação natural de hierarquias:** Codifica estruturas em árvore com altíssima fidelidade, algo que embeddings euclidianos não conseguem.

**Eficiência dimensional:** Menos dimensões para a mesma qualidade de representação — economia de armazenamento e computação.

**Nível de abstração embutido:** A distância radial do centro codifica se um conceito é geral ou específico.

**Complexidade matemática:** Operações no espaço hiperbólico (gradientes, médias, interpolações) são significativamente mais complexas que no euclidiano.

**Tooling imaturo:** A maioria dos bancos vetoriais (Pinecone, Weaviate, Qdrant) opera exclusivamente em espaço euclidiano. Integrar embeddings hiperbólicos exige trabalho custom.

**Nem tudo é hierárquico:** Para dados sem estrutura hierárquica clara, embeddings euclidianos funcionam igual ou melhor.

**Treinamento mais difícil:** Riemannian SGD é mais instável e lento que SGD padrão; requer tuning cuidadoso.

---

## Conclusão

Hyperbolic Embeddings são uma ferramenta poderosa para domínios onde a hierarquia é fundamental — taxonomias, ontologias, grafos de conhecimento. Eles resolvem uma limitação matemática real do espaço euclidiano, oferecendo representações mais fiéis em menos dimensões. Ainda são uma tecnologia emergente no contexto de RAG, mas à medida que os bancos vetoriais adicionarem suporte nativo, devem se tornar a escolha natural para qualquer base de conhecimento com estrutura em árvore.
