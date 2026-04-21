import { AppShell } from "@takeaseat/ui";
import { AuthGate } from "./_components/auth-gate";
import { MobileNav } from "./_components/mobile-nav";
import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppShell sidebar={<Sidebar />} topbar={<Topbar />} bottomNav={<MobileNav />}>
        {children}
      </AppShell>
    </AuthGate>
  );
}
