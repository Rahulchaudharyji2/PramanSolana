# Praman Network: TigerData (TimescaleDB) Analytics & Telemetry

## 1. Overview & Operational Principles

**TigerData** (powered by TimescaleDB hypertables) functions as an **optional, secondary analytics engine** for Praman Network. It handles high-throughput verification telemetry, latency percentiles, and developer API usage trends without impacting the primary transactional system.

### Core Non-Blocking Invariant
- **Source of Truth:** YugabyteDB remains the exclusive source of truth for transactional state.
- **Asynchronous Execution:** All telemetry recording (`TigerDataService.recordEventAsync`) fires via Node.js `setImmediate()`. If TigerData is under heavy load, network partitioned, or completely offline, core authentication proceeds without interruption.
- **Resilient Fallback:** When TigerData connection credentials are unset or the database fails, events stream into an in-memory ring buffer (capacity: 5,000 events). Developer dashboard metrics continue displaying live data.

---

## 2. Telemetry Event Taxonomy

The following event types are emitted across the authentication and verification pipeline:

| Event Type | Emitted By | Description | Key Telemetry Payload |
| :--- | :--- | :--- | :--- |
| `auth.requested` | `AuthService.initiateAuthorization` | OAuth2 PKCE challenge initiated | `projectId`, `latencyMs`, `environment` |
| `auth.success` | `AuthService.exchangeToken` | PKCE token exchange completed successfully | `projectId`, `latencyMs`, `status: SUCCESS` |
| `auth.failed` | `AuthService.verifyChallengeAndIssueCode` | ZK verification or challenge failed | `projectId`, `errorCode`, `status: FAILED` |
| `identity.verification.completed` | `IdentityService.enrollBiometricCommitment` | Biometric commitment anchored to Solana | `userId`, `latencyMs`, `status: SUCCESS` |
| `identity.verification.failed` | `AuthService.verifyChallengeAndIssueCode` | Euclidean distance exceeds threshold | `projectId`, `latencyMs`, `errorCode: ZK_FAIL` |
| `domain.verification.completed` | `DomainService.verifyDomain` | DNS TXT record validated for project | `projectId`, `domain` |
| `api.rate_limited` | API Express Middleware | Quota exceeded for project | `projectId`, `status: WARN` |

---

## 3. TimescaleDB Hypertable Schema

When TigerData is configured with `TIGERDATA_DATABASE_URL`, the following hypertable is partitioned automatically by timestamp:

```sql
CREATE TABLE IF NOT EXISTS tigerdata_analytics_events (
  event_id VARCHAR(64) NOT NULL,
  project_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  latency_ms INT DEFAULT 0,
  environment VARCHAR(32) DEFAULT 'DEVELOPMENT',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to TimescaleDB Hypertable partitioned by 1-day time chunks
SELECT create_hypertable('tigerdata_analytics_events', 'timestamp', if_not_exists => TRUE);

-- Create compound index for fast developer dashboard queries
CREATE INDEX IF NOT EXISTS idx_tigerdata_proj_time 
ON tigerdata_analytics_events (project_id, timestamp DESC);
```

---

## 4. Query & Aggregation Engine

The analytics endpoint (`GET /api/v1/analytics/tigerdata/:projectId`) provides real-time time-series aggregations calculated across the requested time window (default: 7 days):

```typescript
// Sample API Response
{
  "metrics": {
    "totalRequests": 1420,
    "successfulVerifications": 1395,
    "failedVerifications": 25,
    "successRatePercentage": 98,
    "averageLatencyMs": 34,
    "p95LatencyMs": 52,
    "timeSeriesBuckets": [
      {
        "bucket": "2026-10-25",
        "volume": 180,
        "success": 178,
        "failed": 2,
        "avgLatency": 31
      },
      ...
    ]
  },
  "health": {
    "status": "connected", // or "standby_fallback"
    "database": "TigerData (TimescaleDB Active)",
    "bufferedEvents": 1420,
    "latencyMs": 4
  }
}
```

---

## 5. Configuration & Enablement

TigerData is configured in the root `.env` file:

```env
# Enable TigerData Time-Series Engine
TIGERDATA_ENABLED=true
TIGERDATA_DATABASE_URL=postgresql://tsdbadmin:password@host.tigerdata.io:5432/praman_analytics?sslmode=require
```

If `TIGERDATA_ENABLED` is left as `false` or the URL is omitted, the system defaults cleanly to in-memory buffering without warnings.

