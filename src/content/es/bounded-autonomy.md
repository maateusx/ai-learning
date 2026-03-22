# Bounded Autonomy

Los agentes de IA autónomos son poderosos, pero la autonomía sin límites es peligrosa. Un agente que puede ejecutar cualquier acción sin supervisión puede eliminar datos, enviar emails equivocados o gastar miles de dólares en llamadas de API. **Bounded Autonomy** (Autonomía Limitada) es el principio de diseño que define **lo que el agente puede hacer solo, lo que necesita aprobación humana y lo que nunca puede hacer** — creando guardrails que permiten productividad sin riesgo descontrolado.

---

## 1. El espectro de la autonomía

```
Ninguna                                                    Total
autonomía ◄──────────────────────────────────────────────► autonomía
   │                                                          │
   │  Chatbot       Copilot        Agente con       Agente    │
   │  (solo responde)(sugiere      guardrails       sin       │
   │                  acciones)    (ejecuta con     límites   │
   │                                límites)        (⚠️)      │
   └──────────────────────────────────────────────────────────┘
```

La mayoría de las aplicaciones en producción debe operar en el rango del **"Agente con guardrails"** — autonomía suficiente para ser útil, límites suficientes para ser seguro.

---

## 2. Los tres niveles de permiso

El framework más práctico para Bounded Autonomy clasifica acciones en tres niveles:

### Nivel 1 — Automático (sin supervisión)

Acciones de **bajo riesgo y reversibles** que el agente ejecuta libremente:

- Buscar información en bases de conocimiento
- Leer documentos y archivos
- Generar borradores y sugerencias
- Realizar cálculos
- Clasificar y categorizar datos

### Nivel 2 — Human-in-the-Loop (aprobación necesaria)

Acciones de **riesgo medio o con impacto externo** que requieren confirmación humana antes de la ejecución:

- Enviar emails o mensajes
- Crear tickets o issues
- Modificar registros en bases de datos
- Realizar compras o pagos
- Agendar reuniones

### Nivel 3 — Prohibido (nunca ejecutar)

Acciones de **alto riesgo, irreversibles o con impacto legal** que el agente nunca debe ejecutar:

- Eliminar datos en producción
- Acceder a datos de otros tenants
- Tomar decisiones legales o médicas
- Compartir datos confidenciales externamente
- Modificar configuraciones de seguridad/acceso

```
┌─────────────────────────────────────────────┐
│              Acción solicitada               │
└─────────────┬───────────────────────────────┘
              │
              ▼
     ┌────────────────┐
     │  Clasificar    │
     │  nivel de riesgo│
     └───────┬────────┘
             │
     ┌───────┼────────────────┐
     ▼       ▼                ▼
  [Nivel 1] [Nivel 2]     [Nivel 3]
  Ejecutar  Pedir          Rechazar
  directo   aprobación     y explicar
             │
             ▼
        ┌─────────┐
        │ ¿Humano │
        │ aprueba?│
        └────┬────┘
          Sí │ No
             │  └──► Cancelar
             ▼
          Ejecutar
```

---

## 3. Implementando guardrails

### Policy Engine

Una policy engine centraliza las reglas de autonomía:

```python
class PolicyEngine:
    def evaluate(self, action: Action, context: Context) -> Decision:
        if action.type in BLOCKED_ACTIONS:
            return Decision.DENY
        if action.type == "payment" and action.amount > 100:
            return Decision.REQUIRE_APPROVAL
        if self.count_recent(action.type, hours=1) > 10:
            return Decision.REQUIRE_APPROVAL
        if action.is_external and not is_business_hours():
            return Decision.REQUIRE_APPROVAL
        return Decision.ALLOW
```

### Tipos de guardrails

| Guardrail | Qué limita | Ejemplo |
| :--- | :--- | :--- |
| **Acción** | Qué acciones pueden ejecutarse | "Puede leer, no puede eliminar" |
| **Alcance** | Sobre qué recursos puede actuar | "Solo puede modificar sus propios tickets" |
| **Volumen** | Cantidad de acciones en un período | "Máximo 50 emails por hora" |
| **Costo** | Gasto financiero permitido | "Máximo $10 en llamadas de API por tarea" |
| **Tiempo** | Duración máxima de ejecución | "Timeout de 5 minutos por tarea" |
| **Contenido** | Qué puede ser generado/enviado | "No puede incluir datos personales en logs" |
| **Contexto** | Cuándo la acción está permitida | "Deploy solo en horario comercial" |

### Circuit Breaker

Cuando algo falla repetidamente, el sistema debe detenerse automáticamente:

```
Ejecución normal
     │
     ▼
[Acción falla] ──► Incrementar contador
     │
     ▼
¿Contador > threshold?
     │
    Sí ──► CIRCUIT OPEN: pausar todas las acciones
     │       │
     │       ▼
     │      Notificar humano
     │       │
     │       ▼
     │      Humano investiga y resetea
     │
    No ──► Continuar ejecución normal
```

---

## 4. Patrones de Human-in-the-Loop

### Aprobación síncrona

```
Agente: "Voy a enviar este email al cliente:
         [preview del email]
         ¿Puedo enviarlo?"

Humano: "Sí, puedes enviarlo" / "No, ajusta el tono"
```

Ideal para: acciones individuales de impacto medio.

### Aprobación en batch

```
Agente: "Tengo 15 tickets para actualizar:
         - 8 para cerrar (resueltos)
         - 5 para escalar (sin respuesta >48h)
         - 2 para reclasificar
         ¿Aprobar todos / Revisar individualmente?"
```

Ideal para: operaciones repetitivas en volumen.

### Supervisión asíncrona

```
Agente: [ejecuta acciones de nivel 1 automáticamente]
        [genera reporte diario de todas las acciones]

Humano: [revisa reporte, ajusta políticas si es necesario]
```

Ideal para: acciones de bajo riesgo en alto volumen.

### Escalation path

```
Agente ──► Supervisor automático ──► Humano nivel 1 ──► Humano nivel 2
(ejecuta)  (valida reglas)          (aprueba acciones   (excepciones y
                                     estándar)           edge cases)
```

---

## 5. Ejemplo Concreto — Agente de Customer Success

```
┌─────────────────────────────────────────────────────┐
│          Agente de Customer Success                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  NIVEL 1 (Automático):                              │
│  ✅ Buscar historial del cliente                    │
│  ✅ Consultar base de conocimiento                  │
│  ✅ Clasificar sentimiento del ticket               │
│  ✅ Generar borrador de respuesta                   │
│  ✅ Actualizar tags y prioridad del ticket          │
│                                                     │
│  NIVEL 2 (Requiere aprobación):                     │
│  ⚠️ Enviar respuesta al cliente                     │
│  ⚠️ Ofrecer descuento (hasta 20%)                   │
│  ⚠️ Escalar a ingeniería                            │
│  ⚠️ Agendar llamada con el cliente                  │
│                                                     │
│  NIVEL 3 (Prohibido):                               │
│  🚫 Prometer features no lanzados                   │
│  🚫 Ofrecer descuento > 20% (necesita gerencia)     │
│  🚫 Cancelar suscripción del cliente                │
│  🚫 Acceder a datos de pago (PCI)                   │
│  🚫 Compartir datos de otros clientes               │
│                                                     │
│  LÍMITES:                                            │
│  📊 Máximo 100 tickets procesados por hora          │
│  💰 Máximo $500 en descuentos por día               │
│  ⏱️ Timeout de 3 minutos por ticket                 │
│  🔄 Circuit breaker: 5 fallos consecutivos = pausa  │
└─────────────────────────────────────────────────────┘
```

**Escenario:** Cliente abre un ticket reclamando una facturación duplicada.

1. **Automático:** El agente busca el historial de pagos, confirma la facturación duplicada, clasifica como "billing issue" con alta prioridad.
2. **Pide aprobación:** "Detecté una facturación duplicada de $299. ¿Puedo enviar esta respuesta al cliente y solicitar reembolso al equipo financiero?"
3. **Humano aprueba** con ajuste: "Ok, pero agrega que el reembolso tarda 5-10 días hábiles."
4. **Agente ejecuta** y registra la acción en el log de auditoría.

---

## 6. Observabilidad y Auditoría

Bounded Autonomy exige logging detallado:

```json
{
  "timestamp": "2024-12-15T14:32:00Z",
  "agent": "customer-success-bot",
  "action": "send_email",
  "level": 2,
  "status": "approved",
  "approved_by": "user_bruno",
  "approval_latency_ms": 45000,
  "input": {"ticket_id": "T-4521", "customer": "acme_corp"},
  "output": {"email_sent": true, "refund_requested": true},
  "policy_version": "v2.3",
  "cost_usd": 0.003
}
```

Métricas importantes:

- **Automation rate:** % de acciones ejecutadas sin intervención humana
- **Approval latency:** Tiempo promedio que el humano tarda en aprobar
- **Override rate:** % de veces que el humano rechaza o modifica la acción del agente
- **Incident rate:** Cuántas veces se activó el circuit breaker

---

## 7. Ventajas y Limitaciones

**Seguridad controlada:** Límites claros impiden que el agente cause daños irreversibles.

**Confianza incremental:** Comienza con límites estrictos y relájalos conforme el agente demuestra confiabilidad.

**Auditabilidad:** Toda acción es clasificada, registrada y rastreable — esencial para compliance.

**Productividad real:** El agente automatiza lo que es seguro y escala lo que no lo es, en lugar de bloquear todo.

**Overhead de aprobación:** Muchas acciones en el nivel 2 pueden crear un cuello de botella en el humano, anulando el beneficio de la automatización.

**Calibración difícil:** Definir los límites correctos requiere experimentación — demasiado estricto = agente inútil, demasiado flexible = agente peligroso.

**Mantenimiento continuo:** Las políticas necesitan evolucionar conforme el agente adquiere nuevas capacidades.

**Latencia:** Acciones que requieren aprobación humana pueden tardar horas si el aprobador no está disponible.

---

## Conclusión

Bounded Autonomy es el principio que hace viables a los agentes de IA en producción. La autonomía total es una fantasía peligrosa; la supervisión total es un desperdicio. El punto ideal está en **clasificar acciones por riesgo**, **automatizar lo seguro**, **supervisar lo sensible** y **prohibir lo peligroso**. La inversión está en construir una buena policy engine, definir escalation paths claros e instrumentar todo con observabilidad. Conforme el agente demuestra confiabilidad, los límites pueden relajarse gradualmente — la autonomía como algo que se **conquista**, no que se concede de una vez.
