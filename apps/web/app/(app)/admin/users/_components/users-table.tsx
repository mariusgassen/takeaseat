"use client";
import * as React from "react";
import { Trash2 } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@takeaseat/ui";
import { useLocale } from "@/lib/i18n/context";
import { apiListUsers, apiPatchUser, apiDeleteUser } from "@/lib/api/admin-client";
import type { UserResponse } from "@/lib/api/admin-client";

const ROLES = ["admin", "manager", "member", "guest"] as const;

const ROLE_VARIANT: Record<string, "default" | "accent"> = {
  admin: "accent",
  manager: "accent",
  member: "default",
  guest: "default",
};

export function UsersTable() {
  const { t } = useLocale();
  const [users, setUsers] = React.useState<UserResponse[] | null>(null);

  React.useEffect(() => {
    apiListUsers()
      .then((res) => setUsers(res.users))
      .catch(() => setUsers([]));
  }, []);

  async function handleRoleChange(user: UserResponse, newRole: string) {
    try {
      const updated = await apiPatchUser(user.id, { name: user.name, role: newRole });
      setUsers((prev) =>
        prev?.map((u) => (u.id === updated.id ? updated : u)) ?? []
      );
    } catch {
      // noop
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDeleteUser(id);
      setUsers((prev) => prev?.filter((u) => u.id !== id) ?? []);
    } catch {
      // noop
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.admin.usersTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {users === null ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-fg-muted">{t.admin.noUsers}</p>
        ) : (
          <div className="divide-y divide-border">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-fg-muted truncate">{u.email}</p>
                </div>

                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u, e.target.value)}
                  aria-label={`${t.admin.userRole} for ${u.name}`}
                  className="rounded-md border border-border bg-bg px-2 py-1 text-xs"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {t.admin.roles[r]}
                    </option>
                  ))}
                </select>

                <Badge variant={ROLE_VARIANT[u.role] ?? "default"}>
                  {t.admin.roles[u.role as keyof typeof t.admin.roles] ?? u.role}
                </Badge>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${t.admin.delete} ${u.name}`}
                  onClick={() => handleDelete(u.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
