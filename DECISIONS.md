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
- Payload verification is performed using `svix` to ensure that incoming requests originate from Clerk.
- Events handled: `user.created`, `user.updated`, `user.deleted`.
- Webhook operations are transactionally wrapped to initialize user preferences immediately when a profile is created.

### Consequences
- Decreases local authentication attack vectors.
- Assures database relational integrity.
- Clerk profile actions auto-replicate to LedgerFlow database entries immediately.

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
