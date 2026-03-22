# Bounded Autonomy

Agentes de IA autônomos são poderosos, mas autonomia sem limites é perigosa. Um agente que pode executar qualquer ação sem supervisão pode deletar dados, enviar emails errados, ou gastar milhares de dólares em chamadas de API. **Bounded Autonomy** (Autonomia Limitada) é o princípio de design que define **o que o agente pode fazer sozinho, o que precisa de aprovação humana, e o que nunca pode fazer** — criando guardrails que permitem produtividade sem risco descontrolado.

---

## 1. O espectro da autonomia

```
Nenhuma                                                    Total
autonomia ◄──────────────────────────────────────────────► autonomia
   │                                                          │
   │  Chatbot       Copilot        Agente com       Agente    │
   │  (só responde) (sugere ações) guardrails       sem       │
   │                               (executa com     limites   │
   │                                limites)        (⚠️)      │
   └──────────────────────────────────────────────────────────┘
```

A maioria das aplicações em produção deve operar na faixa do **"Agente com guardrails"** — autonomia suficiente para ser útil, limites suficientes para ser seguro.

---

## 2. Os três níveis de permissão

O framework mais prático para Bounded Autonomy classifica ações em três níveis:

### Nível 1 — Automático (sem supervisão)

Ações de **baixo risco e reversíveis** que o agente executa livremente:

- Buscar informações em bases de conhecimento
- Ler documentos e arquivos
- Gerar rascunhos e sugestões
- Fazer cálculos
- Classificar e categorizar dados

### Nível 2 — Human-in-the-Loop (aprovação necessária)

Ações de **médio risco ou com impacto externo** que requerem confirmação humana antes da execução:

- Enviar emails ou mensagens
- Criar tickets ou issues
- Modificar registros em bancos de dados
- Fazer compras ou pagamentos
- Agendar reuniões

### Nível 3 — Proibido (nunca executar)

Ações de **alto risco, irreversíveis ou com impacto legal** que o agente nunca deve executar:

- Deletar dados em produção
- Acessar dados de outros tenants
- Tomar decisões legais ou médicas
- Compartilhar dados confidenciais externamente
- Modificar configurações de segurança/acesso

```
┌─────────────────────────────────────────────┐
│              Ação solicitada                 │
└─────────────┬───────────────────────────────┘
              │
              ▼
     ┌────────────────┐
     │  Classificar   │
     │  nível de risco│
     └───────┬────────┘
             │
     ┌───────┼────────────────┐
     ▼       ▼                ▼
  [Nível 1] [Nível 2]     [Nível 3]
  Executar  Pedir          Recusar
  direto    aprovação      e explicar
             │
             ▼
        ┌─────────┐
        │ Humano  │
        │ aprova? │
        └────┬────┘
          Sim│ Não
             │  └──► Cancelar
             ▼
          Executar
```

---

## 3. Implementando guardrails

### Policy Engine

Uma policy engine centraliza as regras de autonomia:

```python
class PolicyEngine:
    def evaluate(self, action: Action, context: Context) -> Decision:
        # Regras baseadas no tipo de ação
        if action.type in BLOCKED_ACTIONS:
            return Decision.DENY

        # Regras baseadas em limites
        if action.type == "payment" and action.amount > 100:
            return Decision.REQUIRE_APPROVAL

        # Regras baseadas em frequência
        if self.count_recent(action.type, hours=1) > 10:
            return Decision.REQUIRE_APPROVAL

        # Regras baseadas no horário
        if action.is_external and not is_business_hours():
            return Decision.REQUIRE_APPROVAL

        return Decision.ALLOW
```

### Tipos de guardrails

| Guardrail | O que limita | Exemplo |
| :--- | :--- | :--- |
| **Ação** | Quais ações podem ser executadas | "Pode ler, não pode deletar" |
| **Escopo** | Sobre quais recursos pode agir | "Só pode modificar seus próprios tickets" |
| **Volume** | Quantidade de ações em um período | "Máximo 50 emails por hora" |
| **Custo** | Gasto financeiro permitido | "Máximo $10 em chamadas de API por task" |
| **Tempo** | Duração máxima de execução | "Timeout de 5 minutos por tarefa" |
| **Conteúdo** | O que pode ser gerado/enviado | "Não pode incluir dados pessoais em logs" |
| **Contexto** | Quando a ação é permitida | "Deploy só em horário comercial" |

### Circuit Breaker

Quando algo dá errado repetidamente, o sistema deve parar automaticamente:

```
Execução normal
     │
     ▼
[Ação falha] ──► Incrementar contador
     │
     ▼
Contador > threshold?
     │
    Sim ──► CIRCUIT OPEN: pausar todas as ações
     │       │
     │       ▼
     │      Notificar humano
     │       │
     │       ▼
     │      Humano investiga e reseta
     │
    Não ──► Continuar execução normal
```

---

## 4. Padrões de Human-in-the-Loop

### Aprovação síncrona

O agente para e espera pela aprovação antes de continuar:

```
Agente: "Vou enviar este email para o cliente:
         [preview do email]
         Posso enviar?"

Humano: "Sim, pode enviar" / "Não, ajuste o tom"
```

Ideal para: ações individuais de médio impacto.

### Aprovação em batch

O agente acumula ações pendentes para aprovação em lote:

```
Agente: "Tenho 15 tickets para atualizar:
         - 8 para fechar (resolvidos)
         - 5 para escalar (sem resposta >48h)
         - 2 para reclassificar
         Aprovar todos / Revisar individualmente?"
```

Ideal para: operações repetitivas em volume.

### Supervisão assíncrona

O agente executa e o humano revisa depois:

```
Agente: [executa ações de nível 1 automaticamente]
        [gera relatório diário de todas as ações]

Humano: [revisa relatório, ajusta políticas se necessário]
```

Ideal para: ações de baixo risco em alto volume.

### Escalation path

```
Agente ──► Supervisor automático ──► Humano nível 1 ──► Humano nível 2
(executa)  (valida regras)          (aprova ações      (exceções e
                                     padrão)            edge cases)
```

---

## 5. Exemplo Concreto — Agente de Customer Success

```
┌─────────────────────────────────────────────────────┐
│          Agente de Customer Success                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  NÍVEL 1 (Automático):                              │
│  ✅ Buscar histórico do cliente                     │
│  ✅ Consultar base de conhecimento                  │
│  ✅ Classificar sentimento do ticket                │
│  ✅ Gerar rascunho de resposta                      │
│  ✅ Atualizar tags e prioridade do ticket            │
│                                                     │
│  NÍVEL 2 (Requer aprovação):                        │
│  ⚠️ Enviar resposta ao cliente                      │
│  ⚠️ Oferecer desconto (até 20%)                     │
│  ⚠️ Escalar para engenharia                         │
│  ⚠️ Agendar call com o cliente                      │
│                                                     │
│  NÍVEL 3 (Proibido):                                │
│  🚫 Prometer features não lançadas                  │
│  🚫 Oferecer desconto > 20% (precisa de gerência)   │
│  🚫 Cancelar assinatura do cliente                  │
│  🚫 Acessar dados de pagamento (PCI)                │
│  🚫 Compartilhar dados de outros clientes           │
│                                                     │
│  LIMITES:                                            │
│  📊 Máximo 100 tickets processados por hora         │
│  💰 Máximo $500 em descontos por dia                │
│  ⏱️ Timeout de 3 minutos por ticket                 │
│  🔄 Circuit breaker: 5 falhas consecutivas = pausa  │
└─────────────────────────────────────────────────────┘
```

**Cenário:** Cliente abre ticket reclamando de cobrança duplicada.

1. **Automático:** Agente busca histórico de pagamentos, confirma cobrança duplicada, classifica como "billing issue" com alta prioridade.
2. **Pede aprovação:** "Detectei cobrança duplicada de R$299. Posso enviar esta resposta ao cliente e solicitar estorno ao financeiro?"
3. **Humano aprova** com ajuste: "Ok, mas adicione que o estorno leva 5-10 dias úteis."
4. **Agente executa** e registra a ação no log de auditoria.

---

## 6. Observabilidade e Auditoria

Bounded Autonomy exige logging detalhado:

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

- **Automation rate:** % de ações executadas sem intervenção humana
- **Approval latency:** Tempo médio que o humano leva para aprovar
- **Override rate:** % de vezes que o humano rejeita ou modifica a ação do agente
- **Incident rate:** Quantas vezes o circuit breaker foi acionado

---

## 7. Vantagens e Limitações

**Segurança controlada:** Limites claros impedem que o agente cause danos irreversíveis.

**Confiança incremental:** Comece com limites apertados e relaxe conforme o agente prova confiabilidade.

**Auditabilidade:** Toda ação é classificada, logada e rastreável — essencial para compliance.

**Produtividade real:** O agente automatiza o que é seguro e escala o que não é, em vez de bloquear tudo.

**Overhead de aprovação:** Muitas ações no nível 2 podem criar gargalo no humano, anulando o benefício da automação.

**Calibração difícil:** Definir os limites certos exige experimentação — muito apertado = agente inútil, muito frouxo = agente perigoso.

**Manutenção contínua:** As políticas precisam evoluir conforme o agente ganha novas capacidades.

**Latência:** Ações que requerem aprovação humana podem demorar horas se o aprovador não estiver disponível.

---

## Conclusão

Bounded Autonomy é o princípio que torna agentes de IA viáveis em produção. A autonomia total é uma fantasia perigosa; a supervisão total é um desperdício. O ponto ideal está em **classificar ações por risco**, **automatizar o seguro**, **supervisionar o sensível** e **proibir o perigoso**. O investimento está em construir uma boa policy engine, definir escalation paths claros e instrumentar tudo com observabilidade. Conforme o agente demonstra confiabilidade, os limites podem ser gradualmente relaxados — autonomia como algo que se **conquista**, não que se concede de uma vez.
