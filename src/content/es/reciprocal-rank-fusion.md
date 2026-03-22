# RRF (Reciprocal Rank Fusion)

En un sistema de búsqueda moderno, muchas veces usamos más de un método para encontrar lo que el usuario quiere. Pero ¿cómo decides si el primer lugar de la "Búsqueda por IA" es mejor que el primer lugar de la "Búsqueda por Palabra Clave"?

Aquí es donde entra el **RRF**, un algoritmo simple y brillante para combinar diferentes rankings en una única lista final de alta calidad.

## 1. El Problema de la Comparación

Imagina que tienes dos jueces evaluando una competición:

- **Juez A (BM25):** Da notas de 0 a 100 basadas en la frecuencia de las palabras.
- **Juez B (Vectorial):** Da notas de 0.0 a 1.0 basadas en la similitud matemática.

¿Cómo sumas 85 puntos de palabras clave con 0.92 de similitud vectorial? **No los sumas.** Las escalas son demasiado diferentes. El RRF ignora la "nota" y solo mira la **posición (rank)** que cada ítem ocupó en la lista de cada juez.

---

## 2. ¿Cómo funciona el RRF?

La lógica del RRF es: **"Cuanto más alto aparece un ítem en múltiples listas, más relevante probablemente es"**.

Aplica una penalización basada en la posición. Quien está en 1.er lugar gana mucho peso; quien está en el 100.° gana casi nada. Si un documento aparece bien posicionado en _todas_ las listas, sube al tope de la lista final.

### La Fórmula Matemática

La belleza del RRF está en su simplicidad. El cálculo del score para un documento $d$ es:

$$RRFscore(d) = \sum_{r \in R} \frac{1}{k + r(d)}$$

> **Donde:**
>
> - $R$ es el conjunto de listas de resultados (ej: una lista de la búsqueda vectorial y otra de BM25).
> - $r(d)$ es la posición (rank) del documento en esa lista específica (1.°, 2.°, 3.°...).
> - $k$ es una constante (generalmente **60**) que sirve para evitar que los primeros resultados tengan un peso absurdamente mayor que los demás, garantizando estabilidad.

---

## 3. Un Ejemplo Práctico

Imagina que buscamos "Cómo cambiar un neumático":

- **En la Búsqueda BM25:** El documento "Neumático" quedó en **1.er lugar**.
- **En la Búsqueda Vectorial:** El mismo documento "Neumático" quedó en **3.er lugar**.

**El cálculo (usando $k=60$):**

1.  Por la Búsqueda BM25: $\frac{1}{60 + 1} = 0.01639$
2.  Por la Búsqueda Vectorial: $\frac{1}{60 + 3} = 0.01587$
3.  **Score Final RRF:** $0.01639 + 0.01587 = \mathbf{0.03226}$

Ahora, un documento que apareció solo en 1.er lugar en una lista, pero desapareció de la otra, tendría un score menor (solo $0.01639$), quedando por debajo del documento que convenció a ambos "jueces".

---

## 4. ¿Por qué usar RRF?

Existen tres motivos principales que hacen del RRF el estándar de oro para la **Búsqueda Híbrida**:

1.  **No necesita normalización:** No necesitas intentar convertir las notas de diferentes modelos a una escala común. El ranking es lo único que importa.
2.  **Robustez:** Impide que un único modelo "tome el control" del resultado. Si la búsqueda vectorial trae algo totalmente irrelevante pero con nota alta, el RRF ayuda a filtrarlo si la búsqueda por palabras clave no está de acuerdo.
3.  **Simplicidad técnica:** Es extremadamente fácil de implementar en cualquier base de datos o backend (como Node.js, Python o Go).

---

## 5. ¿Cuándo entra en escena el RRF?

El RRF es el componente final de lo que llamamos **Búsqueda Híbrida**. El flujo completo es:

1.  El usuario escribe su duda.
2.  El sistema ejecuta **BM25** (Palabras clave).
3.  El sistema ejecuta la **Búsqueda Vectorial** (Contexto/IA).
4.  El **RRF** toma el Top 100 de cada uno y genera la **Lista Definitiva**.

---

## Conclusión

El RRF demuestra que, a veces, la mejor solución para problemas complejos de IA es una lógica matemática simple de ranking. Garantiza que el usuario reciba lo mejor de ambos mundos: la precisión técnica de las palabras y la comprensión profunda del contexto.
