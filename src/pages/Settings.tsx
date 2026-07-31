import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuthUser } from "@/hooks/useAuthUser";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { errorMessage } from "@/lib/errors";
import { toast } from "sonner";

const CURRENCIES = [
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "CAD", label: "Canadian Dollar (C$)" },
  { code: "AED", label: "UAE Dirham (د.إ)" },
];

export default function Settings() {
  const { user } = useAuthUser();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const navigate = useNavigate();

  const { theme, setTheme } = useTheme();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("INR");

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setCurrency(profile.currency ?? "INR");
    }
  }, [profile]);

  /** Apply the theme instantly, persist it with the rest of the settings. */
  const onThemeChange = (value: string) => setTheme(value);

  const save = async () => {
    try {
      await update.mutateAsync({ display_name: name.trim() || null, currency, theme: theme ?? "system" });
      toast.success("Settings saved");
    } catch (e) {
      toast.error(errorMessage(e, "Couldn't save your settings."));
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* Local session is cleared either way — always leave for the sign-in page. */
    }
    navigate("/auth", { replace: true });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your Cashivo account</p>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader><CardTitle className="text-base font-display">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="rounded-xl bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="display">Display name</Label>
            <Input id="display" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" placeholder="Your name" maxLength={60} />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (<SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme ?? "system"} onValueChange={onThemeChange}>
              <SelectTrigger className="rounded-xl" aria-label="Theme"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">Match system</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={save} disabled={update.isPending} className="rounded-xl press">{update.isPending ? "Saving…" : "Save changes"}</Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader><CardTitle className="text-base font-display">Account</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" onClick={signOut} className="rounded-xl gap-2 text-destructive press">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
