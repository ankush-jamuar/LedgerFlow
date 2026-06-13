# LedgerFlow — Project Scope & Boundaries

This document defines the functional boundaries, CSV requirements, data-handling procedures, and anomaly classifications for the LedgerFlow platform.

---

## Phase 11 Boundaries (Current)

### In Scope
- **Clerk User Synchronization**: Verified Clerk webhooks upsert local `User` records for `user.created` and `user.updated` events.
- **Development-Time Lazy Synchronization**: Authenticated dashboard requests create missing local users and preferences without requiring ngrok or webhook delivery.
- **Audit-Safe Deletion Handling**: Clerk `user.deleted` events are logged, but local users are preserved so future financial records remain traceable.
- **User Preferences**: Authenticated users receive a local `UserPreference` row with INR defaults and can update theme, currency, and notification settings.
- **Group Operations**: Create, update, archive, get, and list groups through service-backed APIs.
- **Membership Timeline Operations**: Add, remove, role-change, list, and timeline-read behavior using `GroupMember` without physical membership deletion.
- **Role Enforcement**: OWNER, ADMIN, and MEMBER permissions are enforced in domain services.
- **Expense Engine**: Expense CRUD validates Equal, Exact, Percentage, and Shares split configurations while storing raw participant values.
- **Expense Membership Validation**: Expense participants and payers must be members during the expense date interval.
- **Balance Engine**: Group balances, member net positions, totals, and simplified settlement suggestions are computed from source records only.
- **Settlement Engine**: Settlements are recorded separately from expenses and affect computed balances without mutating historical expenses.
- **CSV Import Engine**: Backend routes create, list, and retrieve import sessions while parsing CSV content into candidate expenses.
- **Import Validation**: Required CSV headers are validated, participant identifiers are resolved against group members, and all supported split types are checked before writes.
- **Anomaly Detection**: Imports create `Anomaly` rows for duplicate expenses, conflicting duplicates, invalid dates, missing currency, unknown members, settlement-like descriptions, negative amounts, and inactive members.
- **Import Reports**: Each import session stores a report with row totals, created expense IDs, rejected row explanations, anomaly counts, currency coverage, settlement-like row counts, and processing time.
- **Dashboard Aggregation Layer**: Authenticated dashboard APIs aggregate overview, activity, import, anomaly, group, expense, settlement, and reporting metrics from existing records.
- **Dashboard Access Boundary**: Dashboard metrics are scoped to groups where the current user has an active membership.
- **Reporting Aggregations**: Monthly spending, monthly settlements, top payers, top debtors, top creditors, currency breakdowns, and import statistics are computed from source rows without persisted snapshots.
- **Activity Logs**: Group, membership, expense, and settlement mutations write `ActivityLog` records.
- **Webhook Verification**: Svix signatures are verified against the raw request body before event processing.
- **Idempotent Database Writes**: User and preference synchronization uses Prisma upserts without interactive transactions.
- **Production-Grade Database Architecture**: Prisma schema defining Users, UserPreferences, Groups, GroupMembers (with timeline state), Expenses, ExpenseParticipants, Settlements, ImportSessions, Anomalies, ActivityLogs, and Messages.
- **Relational Integrity**: Complete schema relations, custom constraint names, database indexes, and strict delete constraints (`onDelete: Restrict` for financial tables).
- **Compilation & Verification**: Automatic schema validation, Prisma client generation, TypeScript checking, ESLint rules, and production build checks.

### Out of Scope
- CSV import UI workflows.
- Dashboard UI and visual components.
- Realtime chat sockets or Pusher connection broadcasts.
- Direct payments or payment-provider integrations.
- Persisted balance snapshots or balance tables.
- Phase 8 features and UI polish.

---

## CSV Import Objectives & Pipelines

The Import Center (`/import`) is designed to capture external ledger entries and reconcile them against groups.

### Objectives
1. **Backend Parsing**: Server-side PapaParse parsing supports JSON and multipart uploads through the same service layer.
2. **Schema Isolation**: Zod validates request payloads, while import validation validates CSV headers, date formats, numeric values, currencies, members, and split semantics.
3. **Transaction Safety**: Accepted financial writes are created inside one Prisma transaction. If the financial write phase fails, no expense subset is committed.
4. **Auditability**: Rejected rows always include explanations, and anomaly payloads include row numbers, raw row context, and related expense identifiers when available.

### Known Data Problems & Handling Strategy
- **Null Contact Names**: Maps names to username or fallback string, never crashing.
- **Precision Floating Errors**: All currency attributes are cast to Prisma `Decimal` types with fixed `(12, 2)` scales.
- **Format Inconsistencies**: Auto-formats date headers and currency codes (e.g. converting `USD$` to `USD`).

---

## Planned Anomaly Categories

The Anomaly Engine runs validations on uploaded ledgers to flag inconsistencies. The simplified target categories (mapped directly to the `AnomalyType` database enum) are:
- **DUPLICATE_EXPENSE**: Scans for identical transactions by same amount, date, payer, and normalized description.
- **CONFLICTING_DUPLICATE**: Similar transaction details with conflicting amount or currency values.
- **MEMBER_NOT_ACTIVE**: Transactions referencing users who are not active members of the group at that point in time.
- **MISSING_CURRENCY**: Transactions without a valid currency identifier.
- **INVALID_DATE**: Transactions with corrupted, future, or unparseable date strings.
- **SETTLEMENT_AS_EXPENSE**: Debt settlement transactions incorrectly cataloged as standard expenses.
- **UNKNOWN_MEMBER**: Transactions containing user identifiers that do not exist in the system.
- **NEGATIVE_AMOUNT**: Expenses or settlements created with negative financial amounts.

---

## Future Enhancements
- Automated multi-currency reconciliation using live exchange rates.
- Persisted dashboard caches if production data volume later requires them.
