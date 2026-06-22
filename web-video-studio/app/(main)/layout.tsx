import { Sidebar } from "@/components/sidebar";
import { EnvCheckBanner } from "@/components/env-check-banner";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-base text-t1 overflow-hidden">
      <Sidebar />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <EnvCheckBanner />
        {children}
      </div>
    </div>
  );
}
