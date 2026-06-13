# AI Usage & Development Patterns

This document describes how the AI coding assistant (Antigravity) was utilized during the construction of LedgerFlow's Phase 1 foundation.

---

## Model & Execution Details
- **Assistant**: Antigravity, Google DeepMind
- **Mode**: Planning & Execution Mode. Every change was fully researched, planned, approved, and executed with automated validation gates (TypeScript compiler, ESLint, Next.js production build).
- **Style Rules**: Follows clean, premium, scalable conventions — TailwindCSS v4 `@theme` tokens, custom glassmorphism layers, and Next.js App Router conventions.

---

## Division of Labor

- **AI Assistant**: Developed folder layouts, wrote configuration loaders, designed the Prisma 7 schema, implemented verified Clerk webhook routes, created landing pages, loading indicators, and structured documentation.
- **User / Senior Architect**: Reviewed design proposals, set authentication requirements, defined nullable contact constraints, and approved all implementation plans.

---

## AI-Identified & Corrected Errors

The following are real corrections made during the Phase 1 build cycle, discovered by running the TypeScript compiler and reading type definition files directly.

### 1. Zod `.errors` → `.issues` (env.ts)

**Problem**: The initial implementation of `env.ts` used `zodError.errors.map(...)` to format validation error messages. This property does not exist on `ZodError` in Zod v4.

**Error**:
```
env.ts(53,29): error TS2339: Property 'errors' does not exist on type 'ZodError<...>'
env.ts(54,10): error TS7006: Parameter 'e' implicitly has an 'any' type.
```

**Fix**: Replaced `.errors` with `.issues`, which is the correct property on `ZodError` in Zod v3/v4. This also resolved the implicit `any` type error on the `.map()` parameter.

```diff
- ...serverResult.error.errors.map((e) => `[Server] ${e.path.join(".")}: ${e.message}`)
+ ...serverResult.error.issues.map((e) => `[Server] ${e.path.join(".")}: ${e.message}`)
```

---

### 2. Clerk Appearance Variables Renamed (clerk-provider.tsx)

**Problem**: The initial `ClerkProvider` appearance configuration used variable names from an older Clerk API version (`colorInputBackground`, `colorInputText`, `colorText`, `colorTextSecondary`) that no longer exist in the `Variables` type in `@clerk/nextjs` v7.

**Error**:
```
src/providers/clerk-provider.tsx(24,11): error TS2561: Object literal may only specify known properties, but 'colorInputBackground' does not exist in type 'Variables'.
src/providers/clerk-provider.tsx(24,11): error TS2353: Object literal may only specify known properties, and 'colorText' does not exist in type 'Variables'.
```

**Fix**: Inspected `node_modules/@clerk/react/dist/types-CiIhevkA.d.mts` directly to discover the correct Clerk v5+ variable names and replaced accordingly:

```diff
- colorInputBackground: "#0d1117",
- colorInputText: "#e2e8f0",
- colorText: "#e2e8f0",
- colorTextSecondary: "#94a3b8",
+ colorForeground: "#e2e8f0",
+ colorMutedForeground: "#94a3b8",
```

---

### 3. Framer Motion in Server Component (not-found.tsx)

**Problem**: `not-found.tsx` used `motion.div` from Framer Motion without the `"use client"` directive. During `next build`, Next.js attempted to pre-render the 404 page as a static server component, which crashed because `createMotionComponent()` is a client-only function.

**Error**:
```
Error: Attempted to call createMotionComponent() from the server but createMotionComponent is on the client.
Export encountered an error on /_not-found/page: /_not-found, exiting the build.
```

**Fix**: Added `"use client";` at the top of `not-found.tsx` and removed the static `metadata` export, which cannot coexist with a Client Component in the App Router.

```diff
+ "use client";
+
  import Link from "next/link";
  import { motion } from "framer-motion";
- import type { Metadata } from "next";
-
- export const metadata: Metadata = {
-   title: "Page Not Found",
- };
```

---

### 4. Prisma 7 Client Initialization (prisma.ts)

**Problem**: In Prisma 7, `new PrismaClient()` without an explicit driver adapter throws a runtime error — the old implicit Rust-based engine is no longer bundled.

**Error**:
```
PrismaClientConstructorValidationError: Using engine type "client" requires either "adapter" or "accelerateUrl" to be provided to PrismaClient constructor.
```

**Fix**: Installed `@prisma/adapter-pg` and `pg`, then initialized the client with a `PrismaPg` adapter backed by a `pg.Pool`, providing the connection string from the environment:

```typescript
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "..." });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter, log: [...] });
```
