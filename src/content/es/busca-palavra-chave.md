# Búsqueda por Palabras Clave (Sparse Retrieval / BM25)

Si la búsqueda vectorial (que vimos anteriormente) es como un bibliotecario que entiende el "sentimiento" de tu solicitud, la **Búsqueda por Palabras Clave** es como el índice analítico al final de un libro técnico. Es directa, basada en ocurrencias exactas y extremadamente eficiente para encontrar términos específicos.

## 1. ¿Qué es la Búsqueda Dispersa?

El término "Dispersa" viene de las matemáticas. Imagina una tabla donde las columnas son **todas las palabras existentes** en un idioma y las filas son tus documentos.

Para un documento que dice _"El gato subió al tejado"_, casi todas las columnas de la tabla estarán vacías (cero), excepto las columnas "gato", "subió" y "tejado". Como la gran mayoría de las celdas son cero, lo llamamos una **Matriz Dispersa**.

---

## 2. El Algoritmo BM25: El Rey de la Búsqueda

El **BM25** (_Best Matching 25_) es la evolución del antiguo TF-IDF. Es el algoritmo que decide qué documento es más relevante para una búsqueda. No intenta "entender" el texto, sino calcular la importancia estadística de las palabras.

### ¿Cómo calcula el ranking?

BM25 analiza tres factores principales:

1.  **Frecuencia del Término (TF):** Si la palabra aparece muchas veces en el documento, este debe ser importante. _Sin embargo_, BM25 es inteligente: sabe que un documento con 100 menciones de la palabra "computadora" no es necesariamente 100 veces mejor que uno con 10 menciones. Aplica una "saturación".
2.  **Frecuencia Inversa en el Documento (IDF):** Palabras comunes como "el", "y", "de" valen poco. Palabras raras como "fotosíntesis" o "criptografía" valen mucho para el ranking.
3.  **Tamaño del Documento:** Si un libro de 500 páginas menciona "IA" 5 veces, y un tuit menciona "IA" 5 veces, el tuit probablemente está mucho más enfocado en el tema. BM25 normaliza la puntuación según la longitud del texto.

La fórmula simplificada del score para un documento $D$ y una consulta $Q$ es:

$$score(D, Q) = \sum_{q \in Q} IDF(q) \cdot \frac{f(q, D) \cdot (k_1 + 1)}{f(q, D) + k_1 \cdot (1 - b + b \cdot \frac{|D|}{avgdl})}$$

> **Donde:**
>
> - $f(q, D)$ es la frecuencia de la palabra en el documento.
> - $|D|$ es el tamaño del documento actual.
> - $avgdl$ es el promedio de tamaño de todos los documentos.
> - $k_1$ y $b$ son constantes de ajuste (estándar de la industria).

---

## 3. ¿Por qué sigue siendo esencial?

Con la aparición de la Búsqueda Vectorial (IA), muchos pensaron que BM25 moriría. ¡Todo lo contrario! Brilla donde la IA falla:

- **Términos Técnicos e IDs:** Si buscas un código de error como `ERR_CONNECTION_REFUSED` o un SKU de producto `XYZ-123`, la búsqueda vectorial puede confundirse con el "significado", mientras que BM25 encuentra el término exacto instantáneamente.
- **Velocidad y Costo:** Es órdenes de magnitud más barato y rápido de procesar que los modelos de lenguaje pesados.
- **Transparencia:** Puedes explicar exactamente por qué apareció un resultado (ej: "Este documento contiene la palabra X tres veces").

---

## 4. Comparativo Rápido

| Búsqueda Dispersa (BM25)              | Búsqueda Densa (Vectorial)       |
| :------------------------------------- | :------------------------------- |
| Encuentra **palabras exactas**.        | Encuentra **significados**.      |
| Excelente para nombres propios y siglas. | Excelente para preguntas naturales. |
| Bajo consumo de memoria/CPU.          | Requiere GPUs y bases vectoriales. |
| "¿Qué está escrito?"                  | "¿Qué quiere decir el usuario?" |

---

## 5. Lo Mejor de los Dos Mundos: Búsqueda Híbrida

Hoy en día, los sistemas de búsqueda más modernos (como los utilizados en grandes e-commerces y documentaciones técnicas) emplean la **Búsqueda Híbrida**.

Ejecutan **BM25** para garantizar que los términos exactos no se pierdan y la **Búsqueda Vectorial** para capturar la intención. Después, combinan los resultados usando una técnica llamada **RRF (Reciprocal Rank Fusion)** para entregar el mejor ranking posible al usuario.

---

## Conclusión

La Búsqueda Dispersa con BM25 es la base sólida sobre la cual se construyó la web. Incluso en la era de la IA generativa, entender cómo los términos se distribuyen estadísticamente en tus datos es el primer paso para crear cualquier sistema de recuperación de información eficiente.
