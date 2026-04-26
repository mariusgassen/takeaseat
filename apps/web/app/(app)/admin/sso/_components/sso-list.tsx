"use client";
import * as React from "react";
import { Trash2 } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@takeaseat/ui";
import { useLocale } from "@/lib/i18n/context";
import { apiListSsoProviders, apiDeleteSsoProvider } from "@/lib/api/admin-client";
import type { SsoProviderResponse } from "@/lib/api/admin-client";
import { AddSsoDialog } from "./add-sso-dialog";

const PROTOCOL_LABELS: Record<string, string> = {
  saml: "SAML",
  oidc: "OIDC",
  oauth2: "OAuth 2.0",
};

export function SsoList() {
  const { t } = useLocale();
  const [providers, setProviders] = React.useState<SsoProviderResponse[] | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    apiListSsoProviders()
      .then((res) => setProviders(res.sso_providers))
      .catch(() => setProviders([]));
  }, []);

  async function handleDelete(id: string) {
    try {
      await apiDeleteSsoProvider(id);
      setProviders((prev) => prev?.filter((p) => p.id !== id) ?? []);
    } catch {
      // noop — keep list as-is
    }
  }

  function handleCreated(provider: SsoProviderResponse) {
    setProviders((prev) => [...(prev ?? []), provider]);
    setDialogOpen(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t.admin.ssoTitle}</CardTitle>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          {t.admin.addProvider}
        </Button>
      </CardHeader>
      <CardContent>
        {providers === null ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : providers.length === 0 ? (
          <p className="text-sm text-fg-muted">{t.admin.noProviders}</p>
        ) : (
          <div className="divide-y divide-border">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3">
                <span className="flex-1 text-sm font-medium">{p.name}</span>
                <Badge>{PROTOCOL_LABELS[p.protocol] ?? p.protocol}</Badge>
                <span className="hidden text-xs text-fg-muted sm:block">{p.issuer_url}</span>
                {p.is_active && <Badge>{t.admin.isActive}</Badge>}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${t.admin.delete} ${p.name}`}
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AddSsoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </Card>
  );
}
