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
