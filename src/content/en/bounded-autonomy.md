# Bounded Autonomy

Autonomous AI agents are powerful, but autonomy without limits is dangerous. An agent that can execute any action without supervision can delete data, send wrong emails, or spend thousands of dollars on API calls. **Bounded Autonomy** is the design principle that defines **what the agent can do on its own, what requires human approval, and what it must never do** — creating guardrails that enable productivity without uncontrolled risk.

---

## 1. The autonomy spectrum

```
No                                                         Full
autonomy ◄──────────────────────────────────────────────────────► autonomy
   │                                                          │
   │  Chatbot       Copilot        Agent with       Agent     │
   │  (only answers)(suggests      guardrails       without   │
   │                 actions)      (executes with    limits    │
   │                               boundaries)      (⚠️)      │
   └──────────────────────────────────────────────────────────────┘
```

Most production applications should operate in the **"Agent with guardrails"** range — enough autonomy to be useful, enough limits to be safe.

---

## 2. The three permission levels

The most practical framework for Bounded Autonomy classifies actions into three levels:

### Level 1 — Automatic (no supervision)

**Low-risk and reversible** actions that the agent executes freely:

- Searching knowledge bases for information
- Reading documents and files
- Generating drafts and suggestions
- Performing calculations
- Classifying and categorizing data

### Level 2 — Human-in-the-Loop (approval required)

**Medium-risk or externally impactful** actions that require human confirmation before execution:

- Sending emails or messages
- Creating tickets or issues
- Modifying database records
- Making purchases or payments
- Scheduling meetings

### Level 3 — Forbidden (never execute)

**High-risk, irreversible, or legally impactful** actions that the agent must never execute:

- Deleting production data
- Accessing other tenants' data
- Making legal or medical decisions
- Sharing confidential data externally
- Modifying security/access configurations

```
┌─────────────────────────────────────────────┐
│              Requested Action                │
└─────────────┴───────────────────────────────┘
              │
              ▼
     ┌────────────────┐
     │   Classify     │
     │   risk level   │
     └───────┴────────┘
             │
     ┌───────┼────────────────┐
     ▼       ▼                ▼
  [Level 1] [Level 2]     [Level 3]
  Execute   Request        Deny
  directly  approval       and explain
             │
             ▼
        ┌─────────┐
        │ Human   │
        │approves?│
        └────┬────┘
          Yes│ No
             │  └──► Cancel
             ▼
          Execute
```

---

## 3. Implementing guardrails

### Policy Engine

A policy engine centralizes the autonomy rules:

```python
class PolicyEngine:
    def evaluate(self, action: Action, context: Context) -> Decision:
        # Rules based on action type
        if action.type in BLOCKED_ACTIONS:
            return Decision.DENY

        # Rules based on limits
        if action.type == "payment" and action.amount > 100:
            return Decision.REQUIRE_APPROVAL

        # Rules based on frequency
        if self.count_recent(action.type, hours=1) > 10:
            return Decision.REQUIRE_APPROVAL

        # Rules based on time of day
        if action.is_external and not is_business_hours():
            return Decision.REQUIRE_APPROVAL

        return Decision.ALLOW
```

### Types of guardrails

| Guardrail | What it limits | Example |
| :--- | :--- | :--- |
| **Action** | Which actions can be executed | "Can read, cannot delete" |
| **Scope** | Which resources it can act on | "Can only modify its own tickets" |
| **Volume** | Number of actions in a period | "Maximum 50 emails per hour" |
| **Cost** | Allowed financial spend | "Maximum $10 in API calls per task" |
| **Time** | Maximum execution duration | "5-minute timeout per task" |
| **Content** | What can be generated/sent | "Cannot include personal data in logs" |
| **Context** | When the action is allowed | "Deploys only during business hours" |

### Circuit Breaker

When something goes wrong repeatedly, the system should stop automatically:

```
Normal execution
     │
     ▼
[Action fails] ──► Increment counter
     │
     ▼
Counter > threshold?
     │
    Yes ──► CIRCUIT OPEN: pause all actions
     │       │
     │       ▼
     │      Notify human
     │       │
     │       ▼
     │      Human investigates and resets
     │
    No ──► Continue normal execution
```

---

## 4. Human-in-the-Loop Patterns

### Synchronous approval

The agent stops and waits for approval before continuing:

```
Agent: "I'm going to send this email to the client:
        [email preview]
        May I send it?"

Human: "Yes, go ahead" / "No, adjust the tone"
```

Ideal for: individual medium-impact actions.

### Batch approval

The agent accumulates pending actions for batch approval:

```
Agent: "I have 15 tickets to update:
        - 8 to close (resolved)
        - 5 to escalate (no response >48h)
        - 2 to reclassify
        Approve all / Review individually?"
```

Ideal for: high-volume repetitive operations.

### Asynchronous supervision

The agent executes and the human reviews afterward:

```
Agent: [executes level 1 actions automatically]
       [generates daily report of all actions]

Human: [reviews report, adjusts policies if needed]
```

Ideal for: high-volume low-risk actions.

### Escalation path

```
Agent ──► Automatic supervisor ──► Human level 1 ──► Human level 2
(executes)  (validates rules)       (approves standard  (exceptions and
                                     actions)            edge cases)
```

---

## 5. Concrete Example — Customer Success Agent

```
┌─────────────────────────────────────────────────────┐
│          Customer Success Agent                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  LEVEL 1 (Automatic):                                │
│  ✅ Look up customer history                          │
│  ✅ Search knowledge base                             │
│  ✅ Classify ticket sentiment                         │
│  ✅ Generate response draft                           │
│  ✅ Update ticket tags and priority                   │
│                                                     │
│  LEVEL 2 (Requires approval):                        │
│  ⚠️ Send response to customer                        │
│  ⚠️ Offer discount (up to 20%)                       │
│  ⚠️ Escalate to engineering                           │
│  ⚠️ Schedule call with customer                       │
│                                                     │
│  LEVEL 3 (Forbidden):                                │
│  🚫 Promise unreleased features                      │
│  🚫 Offer discount > 20% (requires management)       │
│  🚫 Cancel customer subscription                     │
│  🚫 Access payment data (PCI)                        │
│  🚫 Share other customers' data                      │
│                                                     │
│  LIMITS:                                              │
│  📊 Maximum 100 tickets processed per hour           │
│  💰 Maximum $500 in discounts per day                │
│  ⏱️ 3-minute timeout per ticket                      │
│  🔄 Circuit breaker: 5 consecutive failures = pause  │
└─────────────────────────────────────────────────────┘
```

**Scenario:** Customer opens a ticket complaining about a duplicate charge.

1. **Automatic:** Agent looks up payment history, confirms duplicate charge, classifies as "billing issue" with high priority.
2. **Requests approval:** "I detected a duplicate charge of $299. May I send this response to the customer and request a refund from finance?"
3. **Human approves** with an adjustment: "OK, but add that the refund takes 5-10 business days."
4. **Agent executes** and logs the action in the audit trail.

---

## 6. Observability and Auditing

Bounded Autonomy requires detailed logging:

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

Important metrics:

- **Automation rate:** % of actions executed without human intervention
- **Approval latency:** Average time the human takes to approve
- **Override rate:** % of times the human rejects or modifies the agent's action
- **Incident rate:** How many times the circuit breaker was triggered

---

## 7. Advantages and Limitations

**Controlled safety:** Clear limits prevent the agent from causing irreversible damage.

**Incremental trust:** Start with tight limits and relax them as the agent proves reliability.

**Auditability:** Every action is classified, logged, and traceable — essential for compliance.

**Real productivity:** The agent automates what is safe and escalates what is not, instead of blocking everything.

**Approval overhead:** Too many level 2 actions can create a bottleneck on the human, negating the benefit of automation.

**Difficult calibration:** Defining the right limits requires experimentation — too tight = useless agent, too loose = dangerous agent.

**Ongoing maintenance:** Policies need to evolve as the agent gains new capabilities.

**Latency:** Actions requiring human approval can take hours if the approver is unavailable.

---

## Conclusion

Bounded Autonomy is the principle that makes AI agents viable in production. Full autonomy is a dangerous fantasy; full supervision is a waste. The sweet spot lies in **classifying actions by risk**, **automating the safe**, **supervising the sensitive**, and **prohibiting the dangerous**. The investment is in building a solid policy engine, defining clear escalation paths, and instrumenting everything with observability. As the agent demonstrates reliability, the limits can be gradually relaxed — autonomy as something that is **earned**, not granted all at once.
