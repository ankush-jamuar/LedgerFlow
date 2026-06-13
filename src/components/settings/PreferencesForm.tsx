"use client";

import { useState, useTransition } from "react";
import { Bell, Check, Palette, Save } from "lucide-react";
import { useTheme } from "next-themes";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

interface PreferencesFormProps {
  initialTheme: string;
  initialCurrency: string;
  initialNotificationsEnabled: boolean;
}

const THEME_OPTIONS = ["dark", "light", "system"] as const;

export function PreferencesForm({
  initialTheme,
  initialCurrency,
  initialNotificationsEnabled,
}: PreferencesFormProps) {
  const { setTheme } = useTheme();
  const [theme, setLocalTheme] = useState(initialTheme);
  const [currency, setCurrency] = useState(initialCurrency);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    initialNotificationsEnabled
  );
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  function savePreferences() {
    setStatus("idle");

    startTransition(async () => {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          currency,
          notificationsEnabled,
        }),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setTheme(theme);
      setStatus("saved");
    });
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-primary-ghost)] text-[var(--color-primary-light)]">
          <Palette className="size-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Preferences
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Personal defaults for your LedgerFlow workspace
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            Theme
          </span>
          <select
            className="h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--color-brand-surface)] px-3 text-sm text-[var(--color-text-primary)]"
            value={theme}
            onChange={(event) => setLocalTheme(event.target.value)}
          >
            {THEME_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            Default currency
          </span>
          <select
            className="h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--color-brand-surface)] px-3 text-sm text-[var(--color-text-primary)]"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-h-10 items-center gap-3 rounded-lg border border-[var(--glass-border)] px-3">
          <input
            type="checkbox"
            className="size-4 accent-[var(--color-primary)]"
            checked={notificationsEnabled}
            onChange={(event) => setNotificationsEnabled(event.target.checked)}
          />
          <Bell className="size-4 text-[var(--color-secondary)]" aria-hidden="true" />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            Notifications
          </span>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={savePreferences}
          disabled={isPending}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-light)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saved" ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          {isPending ? "Saving" : status === "saved" ? "Saved" : "Save"}
        </button>

        {status === "error" && (
          <p className="text-sm text-[var(--color-danger)]">
            Preferences could not be saved.
          </p>
        )}
      </div>
    </div>
  );
}
