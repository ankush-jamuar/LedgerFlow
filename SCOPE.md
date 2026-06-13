# LedgerFlow — Project Scope & Boundaries

This document defines the functional boundaries, CSV requirements, data-handling procedures, and anomaly classifications for the LedgerFlow platform.

---

## Phase 1 Boundaries (Current)

### In Scope
- **Scaffolded App Routing**: Full Next.js 15 App Router structure with 9 route groups (`dashboard`, `groups`, `expenses`, `settlements`, `import`, `reports`, `activity`, `chat`, `settings`).
- **Database Architecture**: Prisma schema defining User accounts, preference states, groups, group memberships, and peer-to-peer balance tables.
- **Provider Infrastructure**: Integration of Next Themes, TanStack Query, and Clerk authentication providers.
- **Identity Sync System**: SVIX-secured endpoint to capture Clerk auth profile updates.
- **Branded Design System**: TailwindCSS v4 with dark glassmorphism layout primitives, sidebar drawers, navigation tabs, and Framer Motion micro-animations.

### Out of Scope
- Expense splitting and calculation engines.
- Realtime chat webSockets or Pusher connection broadcasts.
- Active CSV upload parsing or data writes.
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

The Anomaly Engine runs validations on uploaded ledgers to flag inconsistencies. The simplified target categories are:
- **Duplicate Expense**: Scans for identical transactions (same amount, debtor, creditor, date) in short intervals.
- **Conflicting Duplicate**: Duplicate transaction details but with conflicting amounts or dates.
- **Invalid Membership**: Transactions referencing users who are not active members of the group.
- **Missing Currency**: Transactions without a valid currency identifier.
- **Invalid Date**: Transactions with corrupted, future, or unparseable date strings.
- **Settlement Logged As Expense**: Debt settlement transactions incorrectly cataloged as standard expenses.
- **Unknown Member**: Transactions containing user identifiers that do not exist in the system.
- **Negative Amount**: Expenses or settlements created with negative financial amounts.

---

## Future Enhancements
- Automated multi-currency reconciliation.
