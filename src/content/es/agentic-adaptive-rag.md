# Agentic & Adaptive RAG

Hasta ahora, hemos visto pipelines de RAG que siguen un camino fijo: recibir pregunta, buscar documentos, generar respuesta. Pero, ¿y si el sistema pudiera **decidir por sí mismo** qué estrategia usar, evaluar si la respuesta es buena y **volver a intentarlo** si no lo es? Este es el salto del RAG tradicional al **Agentic & Adaptive RAG**: pipelines que piensan, planifican y se corrigen.

---

## 1. Adaptive RAG — Eligiendo la estrategia correcta

El Adaptive RAG parte de una premisa simple: **no toda pregunta necesita el mismo tratamiento**. Antes de buscar cualquier cosa, un clasificador analiza la consulta y decide qué ruta seguir.

### ¿Cómo funciona?

```
Consulta del Usuario
       │
       ▼
[ Clasificador de Consulta ]
       │
       ├── Simple ──────► Búsqueda directa en el índice
       │
       ├── Compleja ─────► Descomposición en sub-preguntas
       │                    (cada una con su propia búsqueda)
       │
       └── Fuera del alcance ► Respuesta directa del LLM
                                (sin retrieval)
```

### Tipos de enrutamiento

| Tipo de Consulta | Estrategia | Ejemplo |
| :--- | :--- | :--- |
| Factual simple | Búsqueda directa | _"¿Cuál es el límite de tokens de GPT-4?"_ |
| Multifacética | Descomposición + múltiples búsquedas | _"Compara los pros y contras de PostgreSQL vs MongoDB para un sistema de e-commerce"_ |
| Conversacional | Reformulación con contexto del chat | _"¿Y en cuanto al precio?"_ (refiriéndose al tema anterior) |
| Fuera del alcance | Sin retrieval, respuesta del LLM | _"¿Cuánto es 2 + 2?"_ |

El clasificador puede ser un LLM con un prompt específico, un modelo entrenado para clasificación, o incluso reglas heurísticas simples. El punto clave es que la **ruta se decide dinámicamente**, no está hardcodeada.

---

## 2. Loop Agéntico — Planning & Reflection

Aquí es donde el RAG adquiere verdadera autonomía. En lugar de un pipeline lineal, el sistema opera en un **loop iterativo** con tres capacidades fundamentales:

### 2.1 Planning (Planificación)

El agente recibe una tarea compleja y la descompone en pasos antes de ejecutar cualquier cosa.

```
Pregunta: "¿Qué empresas brasileñas de IA recibieron inversión
           Series B en 2024 y cuál fue el impacto en el mercado?"

Plan generado por el agente:
  1. Buscar empresas brasileñas de IA con funding Series B en 2024
  2. Para cada empresa encontrada, buscar detalles de la inversión
  3. Buscar análisis de mercado sobre IA en Brasil en 2024
  4. Sintetizar todo en una respuesta coherente
```

Cada paso del plan se ejecuta como una acción independiente de retrieval y puede generar nuevos pasos conforme el agente descubre más información.

### 2.2 Reflection (Reflexión)

Después de generar una respuesta (o un resultado intermedio), el agente **evalúa su propia salida**:

```
┌─────────────────────────────────────────────┐
│              Loop Agéntico                  │
│                                             │
│  ┌─────────┐    ┌──────────┐    ┌────────┐ │
│  │Planificar│───►│ Ejecutar │───►│Reflexio│ │
│  └────▲────┘    └──────────┘    └───┬────┘ │
│       │                             │      │
│       │    ┌──────────────┐         │      │
│       └────┤ ¿Necesita    │◄────────┘      │
│            │ mejorar?     │                │
│            └──────┬───────┘                │
│                   │ No                     │
│                   ▼                        │
│           [ Respuesta Final ]              │
└─────────────────────────────────────────────┘
```

Las preguntas que el agente se hace a sí mismo durante la reflexión:

- **Relevancia:** ¿Los documentos recuperados son relevantes para la pregunta?
- **Completitud:** ¿La respuesta cubre todos los aspectos de la pregunta?
- **Fidelidad:** ¿La respuesta es fiel a los documentos fuente (sin alucinación)?
- **Coherencia:** ¿La respuesta es internamente consistente y está bien estructurada?

Si algún criterio falla, el agente decide la acción correctiva:

| Problema detectado | Acción correctiva |
| :--- | :--- |
| Documentos irrelevantes | Reformular la query y buscar nuevamente |
| Respuesta incompleta | Identificar lagunas y realizar búsquedas adicionales |
| Alucinación detectada | Descartar fragmento y regenerar con base en los documentos |
| Consulta ambigua | Pedir aclaración o probar múltiples interpretaciones |

### 2.3 Tool Use (Uso de Herramientas)

El agente no está limitado a buscar en un único índice. Puede tener acceso a múltiples herramientas:

- **Búsqueda vectorial** en la base de conocimiento interna
- **Búsqueda web** para información reciente
- **SQL** para consultar bases de datos estructuradas
- **APIs** para datos en tiempo real (precios, clima, estado)
- **Calculadora** para operaciones matemáticas

El agente decide **qué herramienta usar** en cada paso del plan — por eso el nombre "agéntico".

---

## 3. Frameworks y Patrones

### CRAG (Corrective RAG)

El CRAG agrega una etapa de **evaluación de relevancia** justo después del retrieval:

```
Query → Retrieval → [Evaluar Relevancia] → ¿Correcto? ─── Sí ──► Generar Respuesta
                                              │
                                             No
                                              │
                                              ▼
                                     Búsqueda Web complementaria
                                              │
                                              ▼
                                       Generar Respuesta
```

Si los documentos recuperados no pasan el filtro de relevancia, el CRAG recurre a una búsqueda web como fallback — combinando lo mejor del conocimiento interno con información externa.

### Self-RAG

El Self-RAG entrena al LLM para emitir **tokens especiales de reflexión** junto con la respuesta:

- `[Retrieve]` — "Necesito buscar más información para responder esto"
- `[IsRel]` — "¿Este documento es relevante para la pregunta?"
- `[IsSup]` — "¿Mi afirmación está respaldada por el documento?"
- `[IsUse]` — "¿Mi respuesta es útil para el usuario?"

Esto transforma la reflexión en parte del proceso de generación, sin necesidad de llamadas extras al LLM.

---

## 4. Ejemplo Concreto — Agente de Soporte Técnico

Imagina un agente de soporte para una plataforma SaaS:

**Pregunta del usuario:** _"Mi integración con Stripe dejó de funcionar después de la actualización de ayer"_

**Iteración 1 — Planning:**
1. Buscar changelog de la actualización más reciente
2. Buscar documentación de la integración con Stripe
3. Buscar issues conocidos relacionados con Stripe

**Iteración 1 — Ejecución:**
- Recupera changelog → encuentra: _"Actualización de headers de autenticación para API v3"_
- Recupera docs Stripe → encuentra: _"La integración usa el header `X-Auth-Token`"_
- Busca issues → ningún issue abierto

**Iteración 1 — Reflexión:**
- _"El changelog menciona un cambio en los headers de autenticación. La integración con Stripe usa un header de auth. Hay una correlación probable, pero necesito verificar si el header específico fue afectado."_

**Iteración 2 — Ejecución adicional:**
- Búsqueda específica: _"cambios X-Auth-Token API v3"_
- Encuentra: _"Header `X-Auth-Token` renombrado a `Authorization: Bearer` en la v3"_

**Respuesta final:**
_"La actualización de ayer migró la API a la v3, que renombra el header de autenticación de `X-Auth-Token` a `Authorization: Bearer`. La integración con Stripe necesita ser actualizada para usar el nuevo formato de header."_

Sin el loop agéntico, el sistema habría retornado solo el changelog genérico sin hacer la conexión entre el cambio y el problema específico.

---

## 5. Ventajas y Limitaciones

**Respuestas más precisas:** El loop de reflexión captura y corrige errores antes de entregarlos al usuario.

**Maneja preguntas complejas:** La descomposición y planificación permiten responder preguntas que requieren múltiples fuentes.

**Autocorrección:** El sistema detecta alucinaciones y documentos irrelevantes sin intervención humana.

**Flexibilidad:** Diferentes estrategias para diferentes tipos de consulta, en lugar de una solución única para todo.

**Mayor latencia:** Múltiples iteraciones significan más llamadas al LLM y más tiempo de respuesta.

**Costo:** Cada iteración del loop consume tokens — una pregunta puede generar 3-5x más llamadas que un RAG simple.

**Riesgo de loops infinitos:** Sin límites bien definidos, el agente puede quedarse atrapado refinando indefinidamente. Es esencial definir un **número máximo de iteraciones** y criterios claros de parada.

**Complejidad de implementación:** Orquestar planning, ejecución y reflexión requiere frameworks robustos (LangGraph, CrewAI, Autogen).

---

## Conclusión

El Agentic & Adaptive RAG representa la evolución del retrieval de un **pipeline pasivo** a un **sistema autónomo**. El Adaptive RAG aporta inteligencia en la elección de la estrategia, mientras que el loop agéntico con planning y reflection permite que el sistema razone sobre sus propias limitaciones y se corrija. El costo es mayor latencia y complejidad, pero la ganancia en calidad — especialmente para preguntas complejas — es transformadora. Frameworks como CRAG y Self-RAG muestran que esta evolución ya está consolidada en la investigación y rápidamente llegando a producción.
