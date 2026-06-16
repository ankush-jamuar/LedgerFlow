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

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Left Navigation/Meta Sidebar */}
          <div className="space-y-6">
            <section className="glass rounded-xl p-5 text-center">
              <div className="flex flex-col items-center">
                {account.user.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={account.user.imageUrl}
                    alt=""
                    className="size-20 rounded-full border border-2 border-[var(--color-primary-light)] object-cover shadow-lg mb-3"
                  />
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-full bg-[var(--color-secondary-ghost)] text-2xl font-bold text-[var(--color-secondary-light)] shadow-lg mb-3">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}

                <h2 className="truncate max-w-full text-base font-bold text-[var(--color-text-primary)]">
                  {displayName}
                </h2>
                <p className="truncate max-w-full text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {contactLabel}
                </p>
              </div>

              <div className="mt-5 border-t border-[var(--glass-border)] pt-4 text-left space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] block">Clerk Account ID</span>
                  <span className="font-mono text-[10px] break-all text-[var(--color-text-secondary)]">
                    {account.user.id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] block">Username</span>
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    {account.user.username ?? "None synced"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] block">Phone Number</span>
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    {account.user.phone ?? "None synced"}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Settings forms / sections */}
          <div className="space-y-6">
            <PreferencesForm
              initialTheme={account.preferences.theme}
              initialCurrency={account.preferences.currency}
              initialNotificationsEnabled={
                account.preferences.notificationsEnabled
              }
            />

            {/* Notification Details Section */}
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Notification Channels</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                Receive device alerts and notifications when financial changes occur in your groups.
              </p>
              <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                <div className="flex justify-between items-center py-2 border-b border-[var(--glass-border)]/50">
                  <span>Expense Created & Modified Alerts</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">Active</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--glass-border)]/50">
                  <span>Settlement Ingestion Notifications</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">Active</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>CSV Import & Anomaly Reports</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">Active</span>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Security & Identity</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                Your credentials and login parameters are securely managed externally by Clerk.
              </p>
              <div className="p-3 bg-white/[0.02] border border-[var(--glass-border)] rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Manage Identity Settings</h4>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Change password, email address, or add multi-factor authentication methods.</p>
                </div>
                <a
                  href="https://accounts.clerk.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center rounded-lg bg-white/[0.06] hover:bg-white/[0.1] px-3 text-xs font-semibold text-[var(--color-text-primary)] transition"
                >
                  Manage Account
                </a>
              </div>
            </div>
          </div>
        </div>
      </DashboardShell>
    </PageContainer>
    </PageTransition>
  );
}
