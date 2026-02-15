# Observability Proposal

## 1. Objective

Build full observability coverage for Warrant across:

1. Application health (errors, latency, availability)
2. Platform dependencies (Postgres, Stripe, Redis, Meilisearch, email)
3. Business-critical flows (login, subscribe, publish, moderation, payouts)
4. AI-assisted incident response via MCP so tools can detect, triage, verify, and close incidents

## 2. Current Gaps

From the current codebase:

1. No unified telemetry stack for logs, traces, and metrics
2. Limited alerting and no SLO-based paging policy
3. No incident correlation layer tying app errors to user-impacting flows
4. No MCP server for AI tooling to query health state and run remediations
5. No closed-loop verification workflow after fixes

## 3. Recommended Target Architecture

### 3.1 Signal Collection

1. **Errors + APM**: Sentry (Next.js SDK with server, edge, and client coverage)
2. **Structured logs**: JSON logs with request and correlation IDs (`pino`), shipped from Vercel Log Drains
3. **Distributed traces**: OpenTelemetry via Next.js instrumentation
4. **Dependency checks**: active probes for Stripe, database, Redis, Meilisearch, email provider
5. **Synthetic tests**: critical path checks (login, article read, subscribe, publish)

### 3.2 Storage and Query

1. **Error and trace store**: Sentry
2. **Log store**: Axiom or Datadog logs (pick one; do not split)
3. **DB health metrics**: Neon dashboard plus periodic `pg_stat*` snapshots
4. **Business event telemetry**: use `AuditLog` plus typed event envelopes

### 3.3 Alerting and On-call

1. Define SLOs for top journeys
2. Alert on error budget burn, not only threshold spikes
3. Route alerts to Slack and pager with severity tiers:
   - `SEV1`: customer-facing outage
   - `SEV2`: degraded critical flow
   - `SEV3`: non-critical regression

### 3.4 Incident Workflow

1. Alert -> incident ticket -> owner assignment
2. Incident timeline auto-populated from logs, traces, deploys, and webhooks
3. Post-fix verification checks must pass before closure
4. Automatic postmortem skeleton generated for SEV1/SEV2

## 4. MCP Closed Loop Design

## 4.1 MCP Server

Create a repo-local MCP server: `mcp/ops-server`.

Purpose: expose operational context and actions to AI tools.

### 4.2 MCP Resources

1. `ops://service-health`
   - Current status for API, DB, Stripe, Redis, Meilisearch, email
2. `ops://active-incidents`
   - Open incidents, severity, owners, age, affected services
3. `ops://slo-status`
   - Error budget remaining for each critical flow
4. `ops://release-health`
   - Deploy metadata, error deltas, rollback candidate status
5. `ops://runbooks`
   - Structured runbook steps and verification commands

### 4.3 MCP Tools

1. `triage_incident(incident_id)`
   - Pull related logs, traces, and recent deploys
2. `query_flow_health(flow, window)`
   - Example: `subscribe_checkout`, `auth_magic_link`, `article_publish`
3. `ack_alert(alert_id, owner)`
4. `create_incident(severity, summary, service)`
5. `run_verification(check_set)`
   - Executes post-fix checks, returns pass/fail evidence
6. `close_incident(incident_id, evidence)`
   - Allowed only when verification gates pass

### 4.4 AI Operational Loop

1. AI reads `ops://active-incidents`
2. AI calls `triage_incident`
3. AI proposes fix and opens PR
4. AI calls `run_verification`
5. AI calls `close_incident` with links to passing checks and commit SHA

This gives true closed-loop operations instead of "advice only."

## 5. Stack Mapping for Warrant

| Concern | Recommended Choice | Why it fits current stack |
|---|---|---|
| Runtime errors | Sentry Next.js SDK | Native Next.js and Vercel support |
| App traces | OpenTelemetry + Sentry bridge | Works with `src/instrumentation.ts` |
| Logs | Pino + Vercel Log Drains -> Axiom/Datadog | Structured logs from server routes |
| DB health | Neon metrics + scheduled SQL snapshots | Matches Neon production topology |
| Payments health | Stripe webhook and API monitoring | Critical revenue flow |
| Synthetic checks | Playwright checks in scheduled runs | You already have E2E coverage |
| AI integration | Custom MCP ops server | Gives AI actionable tools and evidence |

## 6. Implementation Plan

### Phase 0 (2-3 days): Standards and Baseline

1. Define telemetry schema (trace IDs, request IDs, user IDs, flow IDs)
2. Define SLOs:
   - `auth_magic_link_success_rate`
   - `article_read_api_p95`
   - `subscribe_checkout_success_rate`
   - `publish_article_success_rate`
3. Define severity and escalation policy

Deliverables:

1. `docs/09_observability_runbook.md`
2. `docs/10_slo_catalog.md`

### Phase 1 (3-5 days): Instrumentation

1. Add Sentry SDK initialization
2. Add request correlation middleware and structured logger
3. Add event envelopes for core flows

Likely files:

1. `src/instrumentation.ts`
2. `src/middleware.ts`
3. `src/lib/observability.ts` (new)
4. `src/lib/logger.ts` (new)

### Phase 2 (3-4 days): Alerting and Dashboards

1. Create dashboards for API p95, error rate, saturation
2. Configure SLO burn alerts and Slack/Pager routes
3. Add dependency health endpoint expansion from `/api/system/integrations`

Likely files:

1. `src/app/api/system/integrations/route.ts`
2. `docs/11_alert_policy.md` (new)

### Phase 3 (4-6 days): MCP Ops Server

1. Implement `mcp/ops-server`
2. Expose resources and tools listed in Section 4
3. Add read-only connectors first:
   - Sentry API
   - Vercel deploy data
   - Neon health snapshots
4. Add guarded action tools:
   - incident ack/close
   - verification runner

Likely files:

1. `mcp/ops-server/package.json` (new)
2. `mcp/ops-server/src/index.ts` (new)
3. `mcp/ops-server/src/connectors/*.ts` (new)
4. `mcp/ops-server/src/tools/*.ts` (new)

### Phase 4 (2-3 days): Close-the-loop Automation

1. Add scheduled "health review" automation that opens inbox items on incidents
2. Add AI runbook prompts tied to MCP tools
3. Require verification evidence for incident closure

## 7. Data and Security Controls

1. MCP service account tokens must be scoped read-only by default
2. Action tools require explicit allowlist and audit log entries
3. Redact PII from logs before export
4. Retention:
   - Errors/traces: 30-90 days
   - Logs: 14-30 days hot, archive after
5. Keep production write actions behind role checks and signed audit records

## 8. Success Criteria

After rollout, target:

1. MTTD < 5 minutes for SEV1/SEV2
2. MTTR < 30 minutes for top 3 failure modes
3. 100% of incidents have trace/log links and owner assignment
4. 100% of incident closures include machine-verifiable evidence
5. AI can complete triage-to-verification without manual dashboard hopping

## 9. Proposed First Sprint Scope

If you want low risk and immediate value, do this first:

1. Phase 0 fully
2. Phase 1 for auth + subscribe + article publish
3. Phase 3 minimal MCP server with:
   - `ops://service-health`
   - `ops://active-incidents`
   - `triage_incident`
   - `run_verification`

This gives practical end-to-end coverage quickly, then expand.

## 10. Open Decisions

1. Log backend: Axiom vs Datadog
2. Paging backend: PagerDuty vs Opsgenie
3. Incident system of record: Linear vs GitHub Issues
4. MCP deployment model:
   - Sidecar in Vercel functions
   - Separate internal service

