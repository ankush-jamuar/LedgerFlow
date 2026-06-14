import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/PageContainer";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PreferencesForm } from "@/components/settings/PreferencesForm";
import { PageTransition } from "@/components/system/PageTransition";
import { ensureCurrentLocalUser } from "@/lib/users/current-user";
import {
  getUserContactLabel,
  getUserDisplayName,
} from "@/lib/users/user-display";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const account = await ensureCurrentLocalUser();

  if (!account) {
    return (
      <PageTransition>
        <PageContainer>
          <DashboardShell>
            <SectionHeader
              title="Settings"
              subtitle="Sign in to manage your account preferences"
            />
          </DashboardShell>
        </PageContainer>
      </PageTransition>
    );
  }

  const displayName = getUserDisplayName(account.user);
  const contactLabel = getUserContactLabel(account.user);

  return (
    <PageTransition>
    <PageContainer>
      <DashboardShell>
        <SectionHeader
          title="Settings"
          subtitle="Configure preferences and account information"
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <section className="glass rounded-xl p-5">
            <div className="flex items-center gap-4">
              {account.user.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={account.user.imageUrl}
                  alt=""
                  className="size-14 rounded-full border border-[var(--glass-border)] object-cover"
                />
              ) : (
                <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-secondary-ghost)] text-lg font-semibold text-[var(--color-secondary-light)]">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-[var(--color-text-primary)]">
                  {displayName}
                </h2>
                <p className="truncate text-sm text-[var(--color-text-secondary)]">
                  {contactLabel}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid gap-3 text-sm">
              <div>
                <dt className="text-[var(--color-text-muted)]">Clerk ID</dt>
                <dd className="break-all font-mono text-xs text-[var(--color-text-secondary)]">
                  {account.user.id}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">Username</dt>
                <dd className="text-[var(--color-text-secondary)]">
                  {account.user.username ?? "Not synced"}
                </dd>
              </div>
            </dl>
          </section>

          <PreferencesForm
            initialTheme={account.preferences.theme}
            initialCurrency={account.preferences.currency}
            initialNotificationsEnabled={
              account.preferences.notificationsEnabled
            }
          />
        </div>
      </DashboardShell>
    </PageContainer>
    </PageTransition>
  );
}
