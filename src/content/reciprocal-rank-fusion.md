# RRF (Reciprocal Rank Fusion)

Em um sistema de busca moderno, muitas vezes usamos mais de um método para encontrar o que o usuário quer. Mas como você decide se o primeiro lugar da "Busca por IA" é melhor que o primeiro lugar da "Busca por Palavra-chave"?

É aqui que entra o **RRF**, um algoritmo simples e brilhante para combinar diferentes rankings em uma única lista final de alta qualidade.

## 1. O Problema da Comparação

Imagine que você tem dois juízes avaliando uma competição:

- **Juiz A (BM25):** Dá notas de 0 a 100 baseadas na frequência das palavras.
- **Juiz B (Vetorial):** Dá notas de 0.0 a 1.0 baseadas na similaridade matemática.

Como você soma 85 pontos de palavras-chave com 0.92 de similaridade vetorial? **Você não soma.** As escalas são diferentes demais. O RRF ignora a "nota" e olha apenas para a **posição (rank)** que cada item ocupou na lista de cada juiz.

---

## 2. Como o RRF funciona?

A lógica do RRF é: **"Quanto mais alto um item aparece em múltiplas listas, mais relevante ele provavelmente é"**.

Ele aplica uma penalidade baseada na posição. Quem está em 1º lugar ganha muito peso; quem está em 100º ganha quase nada. Se um documento aparece bem posicionado em _todas_ as listas, ele sobe para o topo da lista final.

### A Fórmula Matemática

A beleza do RRF está na sua simplicidade. O cálculo do score para um documento $d$ é:

$$RRFscore(d) = \sum_{r \in R} \frac{1}{k + r(d)}$$

> **Onde:**
>
> - $R$ é o conjunto de listas de resultados (ex: uma lista da busca vetorial e outra do BM25).
> - $r(d)$ é a posição (rank) do documento naquela lista específica (1º, 2º, 3º...).
> - $k$ é uma constante (geralmente **60**) que serve para evitar que os primeiros resultados tenham um peso absurdamente maior que os outros, garantindo estabilidade.

---

## 3. Um Exemplo Prático

Imagine que buscamos por "Como trocar pneu":

- **Na Busca BM25:** O documento "Pneu" ficou em **1º lugar**.
- **Na Busca Vetorial:** O mesmo documento "Pneu" ficou em **3º lugar**.

**O cálculo (usando $k=60$):**

1.  Pela Busca BM25: $\frac{1}{60 + 1} = 0.01639$
2.  Pela Busca Vetorial: $\frac{1}{60 + 3} = 0.01587$
3.  **Score Final RRF:** $0.01639 + 0.01587 = \mathbf{0.03226}$

Agora, um documento que apareceu apenas em 1º lugar em uma lista, mas sumiu da outra, teria um score menor (apenas $0.01639$), ficando abaixo do documento que agradou a ambos os "juízes".

---

## 4. Por que usar RRF?

Existem três motivos principais que tornam o RRF o padrão ouro para **Busca Híbrida**:

1.  **Não precisa de normalização:** Você não precisa tentar converter as notas de diferentes modelos para uma escala comum. O ranking é a única coisa que importa.
2.  **Robustez:** Ele impede que um único modelo "mantenha o controle" do resultado. Se a busca vetorial trouxer algo totalmente irrelevante mas com nota alta, o RRF ajuda a filtrar isso se a busca por palavras-chave não concordar.
3.  **Simplicidade técnica:** É extremamente fácil de implementar em qualquer banco de dados ou backend (como Node.js, Python ou Go).

---

## 5. Quando o RRF entra em cena?

O RRF é o componente final do que chamamos de **Busca Híbrida**. O fluxo completo é:

1.  O usuário digita a dúvida.
2.  O sistema roda o **BM25** (Palavras-chave).
3.  O sistema roda a **Busca Vetorial** (Contexto/IA).
4.  O **RRF** pega o Top 100 de cada um e gera a **Lista Definitiva**.

---

## Conclusão

O RRF prova que, às vezes, a melhor solução para problemas complexos de IA é uma lógica matemática simples de ranking. Ele garante que o usuário receba o melhor dos dois mundos: a precisão técnica das palavras e a compreensão profunda do contexto.
