import { Outlet, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { Logo } from "./Logo";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout() {
  const { user, loading } = useAuthUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-subtle">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-subtle">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <SidebarTrigger />
              </div>
              <div className="md:hidden">
                <Logo size={26} />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 pb-24 md:pb-6">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
              <Outlet />
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
