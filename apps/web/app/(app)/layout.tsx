import { AppShell } from "@takeaseat/ui";
import { AuthGate } from "./_components/auth-gate";
import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppShell sidebar={<Sidebar />} topbar={<Topbar />}>
        {children}
      </AppShell>
    </AuthGate>
  );
}
