import { LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useNavigate } from "react-router-dom";

export function UserMenu() {
  const { data: profile } = useProfile();
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const name = profile?.display_name || user?.email?.split("@")[0] || "You";
  const initials = name.slice(0, 2).toUpperCase();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full press interactive">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl elev-3">
        <DropdownMenuLabel>
          <div className="truncate font-semibold">{name}</div>
          <div className="text-xs font-normal text-muted-foreground truncate">{user?.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")} className="h-10 gap-2 rounded-lg">
          <UserIcon className="h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut} className="h-10 gap-2 rounded-lg text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
