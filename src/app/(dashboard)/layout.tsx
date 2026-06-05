import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/context/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-dvh bg-canvas">
        <Sidebar />
        <main className="m-2.5 ml-1 flex min-w-0 flex-1 flex-col overflow-hidden rounded-[1.1rem] border border-line-soft bg-surface shadow-[0_1px_2px_oklch(0.5_0.01_75_/_0.04),0_18px_40px_-30px_oklch(0.45_0.02_60_/_0.4)] max-lg:m-0 max-lg:rounded-none max-lg:border-0">
          <Header />
          <div className="safeen-scroll min-h-0 flex-1 overflow-y-auto px-7 pt-7 pb-9 max-md:px-4 max-md:pt-5">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}
