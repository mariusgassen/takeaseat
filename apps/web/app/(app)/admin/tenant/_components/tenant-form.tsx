"use client";
import * as React from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Skeleton } from "@takeaseat/ui";
import { useAuth } from "@/lib/auth/context";
import { useLocale } from "@/lib/i18n/context";
import { apiGetTenant, apiPatchTenant } from "@/lib/api/admin-client";
import type { TenantResponse } from "@/lib/api/admin-client";

type SaveState = "idle" | "saving" | "saved" | "error";

export function TenantForm() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [tenant, setTenant] = React.useState<TenantResponse | null>(null);
  const [name, setName] = React.useState("");
  const [ssoEnforced, setSsoEnforced] = React.useState(false);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");

  React.useEffect(() => {
    if (!user?.tenantId) return;
    apiGetTenant(user.tenantId)
      .then((data) => {
        setTenant(data);
        setName(data.name);
        setSsoEnforced(data.sso_enforced);
      })
      .catch(() => {});
  }, [user?.tenantId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setSaveState("saving");
    try {
      const updated = await apiPatchTenant(tenant.id, {
        name,
        slug: tenant.slug,
        sso_enforced: ssoEnforced,
      });
      setTenant(updated);
      setName(updated.name);
      setSsoEnforced(updated.sso_enforced);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
    }
  }

  if (!tenant) {
    return (
      <Card>
        <CardHeader><CardTitle><Skeleton className="h-5 w-40" /></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.admin.tenantTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tenant-name">{t.admin.tenantName}</Label>
            <Input
              id="tenant-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tenant-slug">{t.admin.tenantSlug}</Label>
            <Input id="tenant-slug" value={tenant.slug} disabled />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="sso-enforced"
              type="checkbox"
              checked={ssoEnforced}
              onChange={(e) => setSsoEnforced(e.target.checked)}
              className="size-4 rounded border-border accent-accent"
            />
            <Label htmlFor="sso-enforced">{t.admin.ssoEnforced}</Label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saveState === "saving"}>
              {saveState === "saving" ? t.admin.saving : t.admin.save}
            </Button>
            {saveState === "saved" && (
              <span className="text-sm text-green-600">{t.admin.saved}</span>
            )}
            {saveState === "error" && (
              <span className="text-sm text-destructive">{t.admin.saveError}</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
