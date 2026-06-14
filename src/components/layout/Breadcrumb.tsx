/**
 * src/components/layout/Breadcrumb.tsx — Auto-generated Breadcrumb
 *
 * Reads the current pathname and generates a breadcrumb trail.
 * Segments are humanized from URL slugs.
 */

"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ALL_NAV_ITEMS } from "@/constants/navigation";

interface BreadcrumbProps {
  pathname: string;
}

function humanize(segment: string): string {
  // Try to find a matching nav label first
  const nav = ALL_NAV_ITEMS.find(
    (item) => item.href === `/${segment}` || item.href.endsWith(`/${segment}`)
  );
  if (nav) return nav.label;

  // Capitalize and replace hyphens
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function Breadcrumb({ pathname }: BreadcrumbProps) {
  // Remove leading slash and split
  const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <span className="text-sm font-medium text-[var(--color-text-primary)]">
        Home
      </span>
    );
  }

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = humanize(segment);
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center">
      <ol className="flex items-center gap-1">
        {crumbs.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight
                className="h-3.5 w-3.5 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
            )}
            {crumb.isLast ? (
              <span
                className="text-sm font-medium text-[var(--color-text-primary)] max-w-[200px] truncate"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors max-w-[120px] truncate"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
