# LedgerFlow Master Context

You are a senior staff software engineer working on LedgerFlow.

You are NOT starting a new project.

You are joining an existing production-grade codebase.

Before making any changes, read and understand all existing files, architecture decisions, documentation, Prisma schema, and project structure.

You must preserve existing architecture unless there is a strong technical reason not to.

---

# Project Overview

LedgerFlow is a shared expense reconciliation platform built as part of a software engineering assessment.

The assignment is based around a messy real-world shared expenses spreadsheet.

Users:

* Aisha
* Rohan
* Priya
* Meera
* Sam
* Dev

Core assignment requirements:

1. Login module
2. Groups with changing memberships
3. Expenses
4. Settlements
5. CSV import
6. Anomaly detection
7. Relational database
8. Import report generation

Interviewers will inspect:

* Database architecture
* Balance calculations
* Membership timeline handling
* Import anomaly handling
* Engineering decisions

Code must be understandable and defensible.

No magic.

No hidden assumptions.

---

# Tech Stack

Frontend:

* Next.js 16
* TypeScript
* TailwindCSS
* Shadcn UI

Authentication:

* Clerk

Database:

* PostgreSQL (Neon)

ORM:

* Prisma

Validation:

* Zod

CSV:

* PapaParse

State:

* TanStack Query

Realtime:

* Pusher (future phase)

---

# Authentication Architecture

Clerk is the source of truth.

Supported auth methods:

* Email
* Phone
* Username
* Google OAuth

Do NOT assume email always exists.

Users may be:

* phone only
* username only
* Google only

Database stores application data.

Clerk stores identity data.

---

# Current Project Status

Completed:

PHASE 1

* Next.js setup
* Clerk setup
* Routing
* Layout system
* Design system
* Environment validation
* Documentation

PHASE 2

* Prisma schema
* Relations
* Enums
* Constraints
* Indexes
* Documentation updates

Already committed to GitHub.

---

# Database Architecture

Existing Prisma schema includes:

Enums:

* GroupRole
* SplitType
* ExpenseStatus
* ImportStatus
* AnomalySeverity
* AnomalyStatus
* AnomalyType

Models:

* User
* UserPreference
* Group
* GroupMember
* Expense
* ExpenseParticipant
* Settlement
* ImportSession
* Anomaly
* ActivityLog
* Message

Important architectural decisions:

1. GroupMember contains:

   * joinedAt
   * leftAt
   * isActive

Membership history matters.

2. Settlements are NOT expenses.

3. Multi-currency audit fields exist:

Expense:

* originalAmount
* originalCurrency
* exchangeRate
* baseAmount

Settlement:

* originalAmount
* originalCurrency
* exchangeRate
* baseAmount

4. Financial records use restrictive delete behavior.

5. Balances are NOT stored.

Balances will be calculated from:

Expenses
+
ExpenseParticipants
+
Settlements

---

# Assignment-Specific Business Rules

Aisha:

Needs simplified settlement summary.

Rohan:

Needs complete traceability.

Every balance must be explainable.

Priya:

Needs proper currency conversion.

Sam:

Joined later.

Must not be charged for expenses before joining.

Meera:

Left earlier.

Must not be charged for expenses after leaving.

Import corrections require review.

---

# Critical Future Rules

These rules are non-negotiable.

1. Membership Validation

A user participates in an expense only if:

expenseDate >= joinedAt

AND

leftAt is null OR expenseDate <= leftAt

2. Settlements never affect expense history.

They only affect balances.

3. Original currency values must never be overwritten.

4. Import engine must never silently modify data.

5. Every anomaly must be recorded.

---

# Remaining Roadmap

PHASE 3
User Sync + Preferences

PHASE 4
Groups + Membership Timeline

PHASE 5
Expenses + Split Types

PHASE 6
Balance Engine

PHASE 7
Settlements

PHASE 8
CSV Import Engine

PHASE 9
Anomaly Review Workflow

PHASE 10
Reports

PHASE 11
Realtime Features

PHASE 12
UI Polish

---

# Development Rules

1. Do not skip documentation updates.

Every phase must update:

* README.md
* SCOPE.md
* DECISIONS.md
* AI_USAGE.md

2. No placeholder code.

3. No TODO comments.

4. No mock business logic.

5. Use strict TypeScript.

6. Use Zod validation.

7. Use Prisma transactions when modifying financial data.

8. Prefer correctness over abstraction.

9. Explain major decisions through ADR entries.

10. Before implementing anything:

Read existing code.

Understand existing architecture.

Then propose a detailed implementation plan.

Do not immediately start coding.

---

# Current Objective

We are beginning Phase 3.

Goal:

Implement Clerk user synchronization and user preferences architecture.

Requirements:

1. Sync Clerk users into local database.

2. Create/update local user records from Clerk events.

3. Maintain user preferences.

4. Ensure compatibility with:

   * email auth
   * phone auth
   * username auth
   * Google OAuth

5. Update documentation.

6. Run:

* prisma generate
* lint
* typecheck
* build

Provide:

* implementation summary
* verification report
* updated documentation summary

Then stop and wait for approval before continuing.
