import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuthUser } from "@/hooks/useAuthUser";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Check, Coins, LogOut, Mail, Monitor, Moon, Palette, Sun, UserRound } from "lucide-react";
import { useTheme, type Theme } from "@/components/ThemeProvider";
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

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function Settings() {
  const { user } = useAuthUser();
  const { data: profile, isLoading } = useProfile();
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
  const onThemeChange = (value: string) => setTheme(value as Theme);

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

  const displayName = name.trim() || profile?.display_name || user?.email?.split("@")[0] || "You";
  const initials = displayName.slice(0, 2).toUpperCase();

  /** Presentation-only: highlights unsaved edits so the save action reads clearly. */
  const dirty = useMemo(() => {
    if (!profile) return false;
    return (
      (profile.display_name ?? "") !== name.trim() ||
      (profile.currency ?? "INR") !== currency ||
      (profile.theme ?? "system") !== (theme ?? "system")
    );
  }, [profile, name, currency, theme]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6 max-w-2xl"
    >
      {/* Header */}
      <header className="space-y-1 border-b border-border/70 pb-4">
        <p className="eyebrow">Account</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-[-0.02em]">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your Cashivo profile, currency and appearance.</p>
      </header>

      {/* Profile identity */}
      <Card className="rounded-2xl border-border/70 elev-2 surface-tint overflow-hidden">
        <div className="h-1 w-full bg-gradient-primary" aria-hidden />
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <Avatar className="h-14 w-14 elev-1">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground font-display text-base font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            {isLoading ? (
              <>
                <Skeleton className="h-5 w-40 rounded-md" />
                <Skeleton className="h-4 w-56 rounded-md" />
              </>
            ) : (
              <>
                <div className="font-display text-lg font-semibold leading-tight truncate">{displayName}</div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{user?.email}</span>
                </div>
              </>
            )}
          </div>
          <span className="sm:ml-auto inline-flex items-center gap-1.5 self-start rounded-full border border-primary/25 bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
            <Coins className="h-3.5 w-3.5" aria-hidden /> {currency}
          </span>
        </CardContent>
      </Card>

      {/* Profile details */}
      <Card className="rounded-2xl border-border/70 elev-1 card-hover">
        <CardHeader className="pb-3">
          <CardTitle className="section-title flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-accent-foreground">
              <UserRound className="h-4 w-4" aria-hidden />
            </span>
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="eyebrow">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled className="h-11 rounded-xl bg-muted text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Your email is used to sign in and can't be changed here.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display" className="eyebrow">Display name</Label>
            <Input
              id="display"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl interactive"
              placeholder="Your name"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">{name.trim().length}/60 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="eyebrow">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency" aria-label="Currency" className="h-11 rounded-xl interactive">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Used to format every amount across Cashivo.</p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="rounded-2xl border-border/70 elev-1 card-hover">
        <CardHeader className="pb-3">
          <CardTitle className="section-title flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Palette className="h-4 w-4" aria-hidden />
            </span>
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label className="eyebrow" id="theme-label">Theme</Label>
          <div role="radiogroup" aria-labelledby="theme-label" className="grid grid-cols-3 gap-2 rounded-2xl bg-muted p-1.5">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = (theme ?? "system") === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onThemeChange(value)}
                  className={`press interactive relative flex h-16 flex-col items-center justify-center gap-1.5 rounded-xl text-xs font-semibold ${
                    active
                      ? "bg-card text-foreground elev-2 ring-1 ring-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} aria-hidden />
                  {label}
                  {active && <Check className="absolute right-2 top-2 h-3 w-3 text-primary" aria-hidden />}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">Applies instantly; saved with your settings.</p>
        </CardContent>
      </Card>

      {/* Save bar */}
      <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-xs text-muted-foreground sm:mr-auto" aria-live="polite">
          {update.isPending ? "Saving your changes…" : dirty ? "You have unsaved changes." : "All changes saved."}
        </p>
        <Button
          onClick={save}
          disabled={update.isPending}
          className="h-11 rounded-xl bg-gradient-primary text-primary-foreground elev-2 press interactive hover:opacity-95 sm:w-auto"
        >
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>

      {/* Account actions */}
      <Card className="rounded-2xl border-border/70 elev-1">
        <CardHeader className="pb-3">
          <CardTitle className="section-title flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <LogOut className="h-4 w-4" aria-hidden />
            </span>
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Sign out of this device. Your data stays safe in your account.</p>
          <Button
            variant="outline"
            onClick={signOut}
            className="h-11 rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive press interactive"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
