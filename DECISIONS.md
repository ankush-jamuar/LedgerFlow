# LedgerFlow — Architecture Decision Records (ADRs)

This document contains design notes and decisions governing LedgerFlow's architectural foundation.

---

## ADR 01: Clerk Webhook Synchronization Strategy

### Status
Approved

### Context
LedgerFlow requires user records (such as names, usernames, and profile images) in the local database to enforce relational constraints on expense memberships, settlements, and balances. However, user registration, authentication, and credentials must be handled securely outside our platform.

### Decision
Use Clerk as the identity source of truth. Synchronize user profile updates to the local database using verified HTTP webhooks:
- We expose a public webhook endpoint at `/api/webhooks/clerk`.
- Payload verification is performed using `svix` against the raw `req.text()` body to ensure that incoming requests originate from Clerk.
- Events handled: `user.created`, `user.updated`, `user.deleted`.
- Webhook operations use idempotent upserts to initialize user preferences immediately when a profile is created.
- `user.created` and `user.updated` are handled through idempotent Prisma upserts.
- `user.deleted` is logged but does not delete local user records, preserving future financial audit history.

### Consequences
- Decreases local authentication attack vectors.
- Assures database relational integrity.
- Clerk profile actions auto-replicate to LedgerFlow database entries immediately.
- Deleting a Clerk identity does not erase local ledger identity references required for auditability.

---

## ADR 02: Nullable Contact Parameters

### Status
Approved

### Context
Clerk supports various authentication channels, including Google OAuth, Email OTP, Phone OTP, and Username/Password. Under these configurations, a user might not possess a registered email (e.g. phone-only registration) or a phone number.

### Decision
Configure local database schemas to make `email`, `phone`, and `username` nullable (`String?` in Prisma):
- Do not assume email is present in user objects.
- Mark `username` as unique and nullable.
- Use fallback mechanisms in the UI when rendering user names (e.g. check `username` -> `email` -> `phone` -> "Group Member").

### Consequences
- Complete support for passwordless, email-less, and OAuth authentication flows.
- Prevents database runtime constraint violations when sync hooks process users without active email handles.

---

## ADR 03: GroupMember Membership Timeline Architecture

### Status
Approved

### Context
In shared expense tracking, group membership is dynamic. Members join, leave, or rejoin at different points in time. When a member leaves a group, their past financial records (expenses paid, shares owed, and settlements completed) must remain intact to preserve correct group balance calculations. New members who join later must not be held responsible for expenses incurred prior to their arrival.

### Decision
Model group memberships using a dedicated `GroupMember` join table containing:
- `joinedAt` (DateTime): The exact time the membership became active.
- `leftAt` (DateTime?): The time the membership was terminated. If null, the member is currently active.
- `isActive` (Boolean): A flag denoting whether the membership is active.
- An index on `(groupId, isActive)` for performant active member listing.
- Soft-leaving: Terminating a membership sets `leftAt` to the current time and `isActive` to `false`, rather than deleting the database row.

### Consequences
- Maintains absolute financial auditability: previous expenses are correctly matched against membership state at the transaction date.
- Avoids data loss: members who leave do not have their historical expenses cascade-deleted.
- Simplifies query logic for group balances over time.

---

## ADR 04: Separate Settlements From Expenses

### Status
Approved

### Context
A ledger requires distinguishing between adding a debt (an expense) and settling a debt (a payment between members). In some systems, settlements are represented as a special class of expenses. However, this conflates two distinct financial operations, complicates the database schema, and increases the risk of double-counting group balances.

### Decision
Define a distinct `Settlement` model separate from the `Expense` model:
- `Expense`: Represents a transaction where one member pays for a standard purchase shared among multiple participants (adds debt).
- `Settlement`: Represents a peer-to-peer balance transfer from one debtor to one creditor to reduce outstanding balances (resolves debt).
- Use `onDelete: Restrict` on settlements to block cascading deletes when a user or group is deleted, preserving the financial history.

### Consequences
- Simpler schema design: `Settlement` requires only a sender (`payer`), a receiver (`receiver`), an amount, and a date.
- Faster ledger auditing and balance calculations (expenses add positive/negative balances, settlements subtract them).
- Clear UI separation between bills and payments.

---

## ADR 05: Expense Participant Split Configuration Architecture

### Status
Approved

### Context
Expenses can be split in multiple ways: equally, by exact amount, by percentage, or by share weight. Storing the computed result of the splits (the precomputed balance) as part of the split configuration violates normalization principles and risks synchronization bugs if group balances are modified or recalculated.

### Decision
Store raw split input values in a child table `ExpenseParticipant` rather than precomputed balances:
- The parent `Expense` determines the `splitType` (enum `EQUAL`, `EXACT`, `PERCENTAGE`, `SHARES`).
- `ExpenseParticipant` stores `splitValue` (Decimal?) which is the raw user-provided parameter (percentage value, number of shares, or exact amount).
- If `splitType` is `EQUAL`, `splitValue` is set to null.
- Group balance engines will dynamically resolve outstanding shares using the raw configuration values at query time.

### Consequences
- Prevents database drift and precision errors from stored calculations.
- Clean database design obeying First Normal Form (1NF).
- Facilitates changing division logic later without backfilling calculated values.

---

## ADR 06: LedgerFlow-Owned User Preferences

### Status
Approved

### Context
Clerk owns user identity, authentication factors, OAuth profile data, and account lifecycle events. LedgerFlow needs application-specific settings such as theme, default currency, and notification preferences. These values should not depend on Clerk profile metadata because they are product behavior settings rather than identity credentials.

### Decision
Store application preferences in the local `UserPreference` table. Initialize preferences during the same lazy synchronization flow that mirrors a Clerk user into the local database:
- `theme`: `dark`
- `currency`: `INR`
- `notificationsEnabled`: `true`

Clerk profile updates only update mirrored identity fields on `User`. They do not reset or overwrite `UserPreference`.

### Consequences
- Users keep app preferences across Clerk profile changes.
- INR is the default currency for newly synchronized users.
- Preference updates can be validated with LedgerFlow-specific Zod schemas.
- Future financial defaults are controlled by the application database, not Clerk metadata.
- Preference initialization remains idempotent and does not require an interactive transaction.

---

## ADR 07: Development-Time Lazy User Synchronization

### Status
Approved

### Context
Local Clerk webhook delivery requires a public endpoint, commonly through ngrok or a similar tunnel. That complicates development and makes local application behavior dependent on external webhook delivery. Real testing also exposed a `P2028` interactive transaction startup timeout when the settings page attempted to create missing local users through `ensureCurrentLocalUser()`.

### Decision
Authenticated dashboard requests lazily synchronize Clerk identities into the local database before protected pages render:
- Read the current Clerk user from the authenticated request.
- Upsert the local `User` by Clerk ID.
- Upsert the associated `UserPreference`.
- Continue rendering the protected feature.

This lazy sync path uses plain Prisma upserts instead of an interactive `$transaction`. User and preference creation is not financial ledger mutation, and the operation is idempotent: a later request can safely repair a missing preference if the first write is interrupted. Financial mutations remain subject to stricter transaction rules in later phases.

Production Clerk webhooks remain supported for prompt background synchronization, but application functionality no longer depends on webhook delivery.

### Consequences
- No ngrok dependency for local development.
- Local user and preference records are guaranteed before protected dashboard features load.
- Settings no longer crashes because a local user is missing.
- Avoids Neon/PostgreSQL interactive transaction startup timeouts for non-financial identity bootstrapping.
- Webhooks still verify signatures and handle `user.created`, `user.updated`, and `user.deleted`.

---

## ADR 08: Membership Validation Strategy

### Status
Approved

### Context
LedgerFlow groups are timeline-aware. A member can leave a group, but historical expenses must remain auditable. Expense participation must therefore be validated against membership dates, not only current membership status.

### Decision
Use the existing `GroupMember` row as the membership interval for a user in a group. A member is eligible for an expense only when:

```text
expenseDate >= joinedAt
AND (leftAt IS NULL OR expenseDate <= leftAt)
```

Removing a member soft-closes the membership by setting `leftAt = now()` and `isActive = false`. Membership rows are never physically deleted by domain services.

### Consequences
- Historical ledger rows remain explainable after a member leaves.
- Expense creation rejects users who were not members on the expense date.
- Role and membership changes can be audited through `ActivityLog`.
- The current schema supports one interval per group/user pair because of `@@unique([groupId, userId])`; future multi-interval rejoin history would require a schema migration.

---

## ADR 09: Balance Calculation Architecture

### Status
Approved

### Context
Persisting balances introduces drift risk because balances can be invalidated by expense edits, membership corrections, or settlement updates. Interviewers and auditors need to see the source rows behind every result.

### Decision
Do not create balance tables. Compute group balances at read time from:
- active `Expense` rows
- `ExpenseParticipant` raw split configuration
- `Settlement` rows

Each balance result includes totals, per-member net balances, simplified settlement suggestions, and source metadata linking amounts back to expenses and settlements.

### Consequences
- No stored balance drift.
- Balance output remains fully traceable.
- Reads do more computation, but the current product phase favors correctness and auditability over cached projections.

---

## ADR 10: Debt Simplification Algorithm

### Status
Approved

### Context
Raw balances can produce many pairwise obligations. For example, A may owe B and B may owe C, but the optimal settlement graph can collapse that chain into A paying C.

### Decision
Use a two-pointer debt simplification algorithm:
- Partition members into debtors with negative net balances and creditors with positive net balances.
- Sort both sides by absolute amount descending.
- Match the largest debtor against the largest creditor.
- Emit a settlement suggestion for the matched amount.
- Reduce both remaining balances and advance pointers when a side reaches zero.

### Consequences
- Produces a minimal practical settlement graph for the group net positions.
- Does not mutate expenses or settlements.
- Each suggestion carries source expense and settlement identifiers for explanation.

---

## ADR 11: Settlement Isolation Strategy

### Status
Approved

### Context
Settlements represent debt repayment, not new shared expenses. Treating settlements as expenses would conflate spending with repayment and risk double counting balances.

### Decision
Keep settlements in the `Settlement` table only. Settlement services validate payer/receiver membership, positive amount, distinct parties, and group existence. Settlements affect computed balances but never modify expense history or create expense rows.

### Consequences
- Expenses remain an immutable spending record.
- Settlements can be audited independently.
- Balance calculation can apply settlements as net-balance adjustments without polluting expense participant logic.

---

## ADR 12: Import Session Architecture

### Status
Approved

### Context
CSV imports can create many expense rows from untrusted external data. The system needs a durable audit record of who uploaded the file, how many rows were processed, which rows were imported, and which rows were rejected.

### Decision
Use `ImportSession` as the lifecycle container for every CSV upload:
- API routes remain thin and delegate to `src/lib/imports`.
- `POST /api/groups/[groupId]/imports` creates the session, parses CSV, validates rows, stores anomalies, writes accepted expenses, and persists the report.
- `GET /api/groups/[groupId]/imports` lists sessions for a group.
- `GET /api/imports/[importSessionId]` returns a detailed session with expenses and anomalies.
- The service accepts multipart `file` uploads and JSON `{ filename, csv }` payloads.
- Accepted expense writes happen inside a Prisma transaction with anomaly creation, report storage, and completion logs.

### Consequences
- Every import has a stable ID for review and audit.
- Financial writes do not partially commit if the write transaction fails.
- Import status reflects the outcome as `COMPLETED`, `PARTIAL`, or `FAILED`.

---

## ADR 13: Anomaly Detection Strategy

### Status
Approved

### Context
External ledgers commonly contain duplicate transactions, repayment notes mislabeled as expenses, unknown participants, inactive members, malformed dates, and missing currencies. Rejecting these silently would make reconciliation untrustworthy.

### Decision
Detect anomalies before financial writes and store them in the existing `Anomaly` model:
- `DUPLICATE_EXPENSE`: same amount, date, payer, and normalized description.
- `CONFLICTING_DUPLICATE`: similar expense identity with conflicting amount or currency.
- `NEGATIVE_AMOUNT`: amount is missing, invalid, or less than or equal to zero.
- `MISSING_CURRENCY`: currency is blank or cannot normalize to an ISO-style code.
- `INVALID_DATE`: date is invalid or future-dated.
- `UNKNOWN_MEMBER`: payer or participant cannot be resolved from group member identifiers.
- `SETTLEMENT_AS_EXPENSE`: description contains repayment language such as "paid back", "returned money", "settled", or "reimbursement".
- `MEMBER_NOT_ACTIVE`: payer or participant fails the existing membership timeline predicate.

Anomaly payloads include row number, raw CSV row context, the triggering field, and related expense context when available.

### Consequences
- Reviewers can understand why every row was rejected.
- Duplicate and timeline logic stays aligned with existing expense membership rules.
- Settlement-like rows are detected without creating settlement records implicitly.

---

## ADR 14: Import Report Generation

### Status
Approved

### Context
An import result must be readable without re-running detection logic. Product, support, and audit workflows need totals, created record IDs, anomaly breakdowns, and row-level rejection reasons.

### Decision
Generate import reports in `src/lib/reports` and persist the result in `ImportSession.reportJson`. Reports contain:
- total rows, processed rows, imported rows, and rejected rows
- anomaly count and counts by anomaly type
- total imported amount and currencies encountered
- created expense IDs
- settlement-like rows detected
- processing time in milliseconds
- rejected row details with explanations

### Consequences
- Import sessions are self-contained audit artifacts.
- API consumers can render reports without recomputing validation.
- Rejected rows remain explainable even if source CSV context is later unavailable.

---

## ADR 15: Dashboard Aggregation Strategy

### Status
Approved

### Context
LedgerFlow needs dashboard APIs for high-level product metrics, recent records, anomaly summaries, and reporting views. The project already stores source-of-truth rows for groups, memberships, expenses, settlements, imports, anomalies, and activity logs.

### Decision
Add a backend-only dashboard aggregation layer under `src/lib/dashboard`:
- Route handlers under `/api/dashboard/*` authenticate with the existing Clerk-backed local user flow.
- Services scope all metrics to groups where the current user has an active `GroupMember` row.
- Aggregations read from existing Prisma models and do not introduce new tables, snapshots, or mock data.
- Recent activity is sourced from `ActivityLog` and limited to dashboard-relevant actions.
- Outstanding balance is derived by reusing the existing balance engine for accessible groups.

### Consequences
- Dashboard APIs respect the existing permission boundary.
- No schema migration is required for Phase 11.
- Dashboard values are always current because they are computed from live source records.
- Large datasets may require future caching, but correctness remains the first priority.

---

## ADR 16: Analytics Computation Architecture

### Status
Approved

### Context
Analytics endpoints need totals, averages, monthly buckets, top payer/debtor/creditor rankings, currency breakdowns, and import statistics. These values overlap with existing balance, expense, settlement, import, and anomaly domains.

### Decision
Keep analytics computation in service modules rather than route handlers:
- `overview.ts` computes top-level dashboard metrics.
- `activity.ts` handles activity filtering and query validation.
- `analytics.ts` contains group, expense, settlement, date-range, money, and access helper logic.
- `reports.ts` computes recent imports, anomaly overview, monthly reporting, participant rankings, and import statistics.
- Money values are converted from Prisma decimals and rounded consistently at service boundaries.
- Month buckets use source dates (`Expense.date` and `Settlement.settledAt`) rather than creation timestamps.

### Consequences
- Routes remain thin and consistent with prior phases.
- Shared helpers avoid metric drift across endpoints.
- Reporting remains reconstructable from source rows and does not create persisted summary state.

---

## ADR 17: User Search and Member Invitation UX

### Status
Approved

### Context
Prior implementation of the group member addition workflow required inputting a raw Clerk User ID (e.g. `user_XXXXXXXXXXXX`). This presented poor user experience as standard users do not know and cannot query the internal Clerk IDs of other users.

### Decision
Group members must be discoverable and invited using their username or email address. Clerk IDs are internal implementation details and must never be exposed in user-facing workflows:
- Implement a user search endpoint at `/api/users/search?q=<query>`.
- Allow searching matching user records by email prefix or username prefix.
- The endpoint must return user records with username, email, image, and id fields, without exposing internal auth credentials.
- Update `AddMemberModal` to use a debounced search input, querying the endpoint and rendering interactive dropdown options with user avatars, usernames, and emails.
- Selecting a matching user submits their synced user ID directly to the add-member backend endpoint.

### Consequences
- Dramatically improved invitation flow.
- Obfuscates raw Clerk IDs from frontend labels.
- Preserves existing database relations by resolving matches locally before sending them to the membership endpoint.
