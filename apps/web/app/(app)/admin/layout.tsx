import * as React from "react";
import { AdminGate } from "./_components/admin-gate";
import { AdminNav } from "./_components/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <AdminNav />
        {children}
      </div>
    </AdminGate>
  );
}
