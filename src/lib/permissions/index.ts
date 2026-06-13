/**
 * src/lib/permissions/index.ts — Permission Helpers
 *
 * Defines the permission model for LedgerFlow group-based access control.
 * These types and helpers enforce role boundaries across server actions
 * and API routes. Business-logic enforcement is implemented in Phase 2.
 */

/**
 * Roles a user can hold within a LedgerFlow group.
 * - OWNER: Full control including deletion and member management
 * - ADMIN: Can manage expenses and members but cannot delete the group
 * - MEMBER: Can view, add expenses and participate in settlements
 */
export const GROUP_ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;
export type GroupRole = (typeof GROUP_ROLES)[number];

/**
 * Ordered role hierarchy — higher index = higher privilege.
 */
const ROLE_HIERARCHY: Record<GroupRole, number> = {
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

/**
 * Returns true if `actorRole` has at least the same privilege as `requiredRole`.
 */
export function hasPermission(
  actorRole: GroupRole,
  requiredRole: GroupRole
): boolean {
  return ROLE_HIERARCHY[actorRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Asserts that `actorRole` meets the `requiredRole` requirement,
 * throwing a structured error if not.
 */
export function assertPermission(
  actorRole: GroupRole,
  requiredRole: GroupRole,
  context?: string
): void {
  if (!hasPermission(actorRole, requiredRole)) {
    throw new Error(
      `Forbidden: role '${actorRole}' cannot perform '${context ?? "this action"}' (requires '${requiredRole}')`
    );
  }
}
