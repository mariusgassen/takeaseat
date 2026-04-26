"use client";
import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
} from "@takeaseat/ui";
import { useLocale } from "@/lib/i18n/context";
import { apiCreateSsoProvider } from "@/lib/api/admin-client";
import type { SsoProviderResponse } from "@/lib/api/admin-client";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (provider: SsoProviderResponse) => void;
}

const PROTOCOLS = ["saml", "oidc", "oauth2"] as const;

export function AddSsoDialog({ open, onClose, onCreated }: Props) {
  const { t } = useLocale();
  const [name, setName] = React.useState("");
  const [protocol, setProtocol] = React.useState<"saml" | "oidc" | "oauth2">("oidc");
  const [issuerUrl, setIssuerUrl] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function reset() {
    setName("");
    setProtocol("oidc");
    setIssuerUrl("");
    setIsActive(true);
    setSaving(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !issuerUrl.trim()) {
      setError("Name and Issuer URL are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await apiCreateSsoProvider({
        name: name.trim(),
        protocol,
        issuer_url: issuerUrl.trim(),
        is_active: isActive,
      });
      reset();
      onCreated(created);
    } catch {
      setError(t.admin.saveError);
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.admin.addProvider}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="sso-name">{t.admin.providerName}</Label>
            <Input
              id="sso-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Corporate IdP"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sso-protocol">{t.admin.protocol}</Label>
            <select
              id="sso-protocol"
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as typeof protocol)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
            >
              {PROTOCOLS.map((p) => (
                <option key={p} value={p}>
                  {p.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sso-issuer">{t.admin.issuerUrl}</Label>
            <Input
              id="sso-issuer"
              type="url"
              value={issuerUrl}
              onChange={(e) => setIssuerUrl(e.target.value)}
              placeholder="https://idp.example.com"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="sso-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-border accent-accent"
            />
            <Label htmlFor="sso-active">{t.admin.isActive}</Label>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t.admin.saving : t.admin.addProvider}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
