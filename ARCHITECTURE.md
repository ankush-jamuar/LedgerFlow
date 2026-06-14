# LedgerFlow — System Architecture & Technical Specifications

This document outlines the architecture, data models, integration boundaries, and design considerations for LedgerFlow.

---

## 1. Authentication & Local User Sync
LedgerFlow delegates identity verification and session handling to Clerk. To maintain relational database constraints, Clerk events are synchronized to our PostgreSQL database:
- **Webhook Endpoint**: `/api/webhooks/clerk` processes `user.created`, `user.updated`, and `user.deleted` events verified via `svix`.
- **Relational Integrity**: Local user records reference the unique Clerk User ID as their primary key (`User.id`).
- **User Preference**: A one-to-one relationship (`UserPreference`) stores user themes, currencies, and notifications state.

---

## 2. Dynamic Group Membership Timeline
To prevent previous members from being charged for subsequent group transactions, and newer members from inheriting previous debts:
- **`GroupMember` Join Model**: Records a `joinedAt` timestamp, a soft-leave `leftAt` timestamp, and an `isActive` flag.
- **Active Window Check**: A member participates in an expense on a given date *if and only if* their normalized joining date is less than or equal to the expense date, and they have not left (or left after the expense date).
- **Date Normalization**: All timestamps are truncated to midnight before comparison to resolve timezone shifts.

---

## 3. Real-time Notification Architecture
LedgerFlow implements a database-backed notification system to track actions across active workflows:
- **Notification Model**:
  - `id` (String UUID @id)
  - `userId` (String User @relation)
  - `type` (String enum)
  - `title` (String)
  - `message` (String)
  - `isRead` (Boolean)
  - `createdAt` (DateTime)
- **Supported Notification Types**:
  - `GROUP_MEMBER_ADDED`
  - `GROUP_MEMBER_REMOVED`
  - `EXPENSE_CREATED`
  - `SETTLEMENT_CREATED`
  - `IMPORT_COMPLETED`
  - `ANOMALY_DETECTED`
- **Endpoints**:
  - `GET /api/notifications`: Returns the recent notifications for the logged-in user.
  - `PATCH /api/notifications/[id]/read`: Marks a single notification as read.
  - `PATCH /api/notifications/read-all`: Marks all user notifications as read.
- **Hook Integration**: `useUserNotifications` connects the notification dropdown dynamically with live DB counts and updates.
