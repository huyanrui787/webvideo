import { Sidebar } from "@/components/sidebar";
import { EnvCheckBanner } from "@/components/env-check-banner";
import { ToastContainer } from "@/components/toast";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastContainer>
      <div className="flex h-screen bg-base text-t1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 min-h-0 overflow-y-auto pl-14 lg:pl-0">
          <EnvCheckBanner />
          {children}
        </div>
      </div>
    </ToastContainer>
  );
}
