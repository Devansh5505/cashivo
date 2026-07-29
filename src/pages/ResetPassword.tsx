import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { motion } from "framer-motion";

/**
 * Password recovery landing page.
 * Supabase redirects here from the reset email with a recovery session in the URL.
 * We wait for the session to hydrate, then let the user set a new password.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setValid(true);
        setReady(true);
      }
    });
    // Fallback for when the session is already restored before the listener attaches.
    supabase.auth.getSession().then(({ data }) => {
      setValid((v) => v || !!data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (password.length > 128) return toast.error("Password must be 128 characters or fewer.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes("expired") || m.includes("invalid")) {
          return toast.error("This reset link has expired. Please request a new one.");
        }
        return toast.error(error.message);
      }
      await supabase.auth.signOut();
      toast.success("Password updated — please sign in with your new password.");
      navigate("/auth", { replace: true });
    } catch {
      toast.error("Network error — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={48} showWordmark={false} />
          <h1 className="font-display text-3xl font-bold tracking-tight">Set a new password</h1>
        </div>

        <Card className="rounded-3xl border-none shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="font-display">Choose a new password</CardTitle>
            <CardDescription>Must be between 8 and 128 characters.</CardDescription>
          </CardHeader>
          <CardContent>
            {ready && !valid ? (
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>This reset link is invalid or has expired. Request a new password reset email to continue.</p>
                <Button className="w-full rounded-xl h-11 press" onClick={() => navigate("/auth", { replace: true })}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-pw">New password</Label>
                  <Input id="new-pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pw">Confirm password</Label>
                  <Input id="confirm-pw" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="rounded-xl" />
                </div>
                <Button type="submit" className="w-full rounded-xl h-11 press" disabled={busy || !ready}>
                  {busy ? "Updating…" : "Update password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
