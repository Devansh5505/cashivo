import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, Tag, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Txns", url: "/transactions", icon: ArrowLeftRight },
  { title: "Tags", url: "/categories", icon: Tag },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = pathname === item.url;
          return (
            <NavLink
              key={item.title}
              to={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "scale-110")} />
              <span className="text-[10px] font-medium">{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
