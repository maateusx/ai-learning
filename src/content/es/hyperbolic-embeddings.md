# Hyperbolic Embeddings

Hasta ahora, todos los embeddings que hemos visto viven en el **espacio euclidiano** — el espacio "plano" que aprendimos en la escuela. Pero muchos datos del mundo real tienen una estructura **jerárquica** natural: taxonomías, árboles de categorías, relaciones "es-un-tipo-de". El espacio euclidiano es pésimo para representar jerarquías. El **espacio hiperbólico** resuelve esto — tiene espacio exponencialmente creciente conforme nos alejamos del centro, igual que un árbol que se ramifica.

---

## 1. El problema del espacio euclidiano

Imagina que necesitas representar esta taxonomía como embeddings:

```
                    Animal
                   /      \
            Mamífero      Reptil
           /    |    \        \
        Perro  Gato  Ballena  Serpiente
       / | \
   Poodle Labrador Husky
```

En el espacio euclidiano (plano), para mantener las distancias correctas entre todos los nodos:
- `Poodle` debe estar cerca de `Labrador` (hermanos)
- `Poodle` debe estar a distancia media de `Gato` (primos)
- `Poodle` debe estar lejos de `Serpiente` (parientes lejanos)

El problema es que **un árbol con profundidad `d` tiene hasta `2^d` hojas**, pero el espacio euclidiano en dimensión `n` crece solo polinomialmente. Para representar un árbol con miles de hojas sin distorsión, necesitarías **cientos de dimensiones**.

| Espacio | Crecimiento del "volumen" | Ideal para |
| :--- | :--- | :--- |
| Euclidiano (ℝⁿ) | Polinomial (~rⁿ) | Datos "planos", clusters simétricos |
| Hiperbólico (ℍⁿ) | Exponencial (~eʳ) | Jerarquías, árboles, grafos scale-free |

---

## 2. ¿Qué es el espacio hiperbólico?

El espacio hiperbólico es una geometría donde el **espacio disponible crece exponencialmente** conforme nos alejamos del origen. Piensa en un disco donde el borde tiene "infinitamente más espacio" que el centro.

### Modelo del Disco de Poincaré

El modelo más usado para embeddings hiperbólicos es el **Disco de Poincaré**: un disco de radio 1 donde:

- El **centro** representa el nodo raíz (conceptos generales)
- El **borde** representa las hojas (conceptos específicos)
- La **distancia hiperbólica** crece muy rápido cerca del borde

```
         ┌─────────────────────┐
        │                       │
       │      ○ Animal           │
      │       │                   │
     │    ○ Mamífero  ○ Reptil     │
     │   / |    \        \         │
    │ ○Perro ○Gato ○Ballena ○Serpiente │
    │  /|\                          │
   │○P ○L ○H                        │
    │                               │
     │          (borde = ∞)        │
      └───────────────────────────┘
          Disco de Poincaré
```

Movimientos pequeños en el espacio euclidiano cerca del borde corresponden a **distancias enormes** en el espacio hiperbólico.

### Distancia hiperbólica

En el disco de Poincaré, la distancia entre dos puntos `u` y `v` es:

```
d(u, v) = arcosh(1 + 2 · ‖u - v‖² / ((1 - ‖u‖²)(1 - ‖v‖²)))
```

---

## 3. ¿Por qué importa para RAG?

Muchas bases de conocimiento tienen estructura jerárquica implícita:

- **Documentación técnica:** Conceptos generales → temas específicos → detalles de implementación
- **E-commerce:** Categoría → subcategoría → producto → variante
- **Medicina:** Sistema → órgano → enfermedad → tratamiento → medicamento
- **Organizaciones:** Empresa → departamento → equipo → miembro

Con embeddings hiperbólicos, la **posición radial** (distancia del centro) codifica naturalmente el nivel de generalidad/especificidad, y el sistema puede usar esto para un retrieval más preciso.

---

## 4. Embeddings hiperbólicos en la práctica

### Entrenamiento

1. **Mapeo al espacio hiperbólico:** Proyectar vectores en el disco de Poincaré.
2. **Operaciones adaptadas:** Gradientes y optimización necesitan **Riemannian SGD** en lugar del SGD estándar.
3. **Función de pérdida:** Usa distancia hiperbólica en lugar de similitud del coseno.

### Comparación dimensional

| Métrica | Euclidiano | Hiperbólico |
| :--- | :--- | :--- |
| Dimensiones para representar WordNet | 200 | **5-10** |
| Distorsión (MAP) | Alta en dim. baja | Baja incluso en dim. baja |
| Costo de almacenamiento | Alto | Significativamente menor |

---

## 5. Ejemplo Concreto — E-commerce

```
Electrónicos
├── Smartphones
│   ├── iPhone 15 Pro
│   ├── Galaxy S24
│   └── Pixel 8
├── Notebooks
│   ├── MacBook Pro M3
│   ├── ThinkPad X1
│   └── Dell XPS 15
└── Accesorios
    ├── Cargador USB-C
    ├── Funda para iPhone
    └── Mouse Bluetooth
```

**Con embedding euclidiano:**
- _"accesorio para celular"_ puede retornar `Mouse Bluetooth`

**Con embedding hiperbólico:**
- El sistema entiende que _"accesorio para celular"_ debe buscar en la intersección entre `Accesorios` y `Smartphones`, retornando `Funda para iPhone` y `Cargador USB-C`.

---

## 6. Ventajas y Limitaciones

**Representación natural de jerarquías:** Codifica estructuras en árbol con altísima fidelidad.

**Eficiencia dimensional:** Menos dimensiones para la misma calidad de representación.

**Nivel de abstracción incorporado:** La distancia radial del centro codifica si un concepto es general o específico.

**Complejidad matemática:** Las operaciones en el espacio hiperbólico son significativamente más complejas que en el euclidiano.

**Tooling inmaduro:** La mayoría de las bases de datos vectoriales opera exclusivamente en espacio euclidiano.

**No todo es jerárquico:** Para datos sin estructura jerárquica clara, los embeddings euclidianos funcionan igual o mejor.

**Entrenamiento más difícil:** Riemannian SGD es más inestable y lento que el SGD estándar.

---

## Conclusión

Los Hyperbolic Embeddings son una herramienta poderosa para dominios donde la jerarquía es fundamental — taxonomías, ontologías, grafos de conocimiento. Resuelven una limitación matemática real del espacio euclidiano, ofreciendo representaciones más fieles en menos dimensiones. Todavía son una tecnología emergente en el contexto de RAG, pero a medida que las bases de datos vectoriales añadan soporte nativo, deberían convertirse en la elección natural para cualquier base de conocimiento con estructura en árbol.
