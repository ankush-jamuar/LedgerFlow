# LedgerFlow — Project Scope & Boundaries

This document defines the functional boundaries, CSV requirements, data-handling procedures, and anomaly classifications for the LedgerFlow platform.

---

## Phase 2 Boundaries (Current)

### In Scope
- **Production-Grade Database Architecture**: Prisma schema defining Users, UserPreferences, Groups, GroupMembers (with timeline state), Expenses, ExpenseParticipants, Settlements, ImportSessions, Anomalies, ActivityLogs, and Messages.
- **Relational Integrity**: Complete schema relations, custom constraint names, database indexes, and strict delete constraints (`onDelete: Restrict` for financial tables).
- **Compilation & Verification**: Automatic schema validation, Prisma client generation, TypeScript checking, ESLint rules, and production build checks.

### Out of Scope
- Expense splitting and calculation engines.
- Active CSV upload parsing or data writes.
- CRUD API routes or Server Actions.
- Realtime chat sockets or Pusher connection broadcasts.
- Settlement calculations and direct payments.

---

## CSV Import Objectives & Pipelines

The Import Center (`/import`) is designed to capture external ledger entries and reconcile them against groups.

### Objectives
1. **Zero-Lock Parsing**: Client-side PapaParse parsing prevents memory spikes on large uploads.
2. **Schema Isolation**: Zod validates CSV headers, date formats, and numeric types.
3. **Transaction Safety**: Imports must succeed as a single transaction unit, ensuring no partial ledgers are written.

### Known Data Problems & Handling Strategy
- **Null Contact Names**: Maps names to username or fallback string, never crashing.
- **Precision Floating Errors**: All currency attributes are cast to Prisma `Decimal` types with fixed `(12, 2)` scales.
- **Format Inconsistencies**: Auto-formats date headers and currency codes (e.g. converting `USD$` to `USD`).

---

## Planned Anomaly Categories

The Anomaly Engine runs validations on uploaded ledgers to flag inconsistencies. The simplified target categories (mapped directly to the `AnomalyType` database enum) are:
- **DUPLICATE_EXPENSE**: Scans for identical transactions (same amount, debtor, creditor, date) in short intervals.
- **CONFLICTING_DUPLICATE**: Duplicate transaction details but with conflicting amounts or dates.
- **MEMBER_NOT_ACTIVE**: Transactions referencing users who are not active members of the group at that point in time.
- **MISSING_CURRENCY**: Transactions without a valid currency identifier.
- **INVALID_DATE**: Transactions with corrupted, future, or unparseable date strings.
- **SETTLEMENT_AS_EXPENSE**: Debt settlement transactions incorrectly cataloged as standard expenses.
- **UNKNOWN_MEMBER**: Transactions containing user identifiers that do not exist in the system.
- **NEGATIVE_AMOUNT**: Expenses or settlements created with negative financial amounts.

---

## Future Enhancements
- Automated multi-currency reconciliation.
