import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Auth() {
  const { user, loading } = useAuthUser();
  const navigate = useNavigate();
  const location = useLocation();
  /** Where the guard sent the user from, so we can return them after sign-in. */
  const from = (location.state as { from?: string } | null)?.from;
  const dest = from && from.startsWith("/") && !from.startsWith("//") && from !== "/auth" ? from : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);


  if (loading) return null;
  if (user) return <Navigate to={dest} replace />;

  /** Minimal password rules: required, 8-128 chars. No composition requirements. */
  const validate = (isSignUp: boolean) => {
    const mail = email.trim();
    if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return "Please enter a valid email address.";
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password.length > 128) return "Password must be 128 characters or fewer.";
    if (isSignUp && !name.trim()) return "Please enter your name.";
    return null;
  };

  /** Map raw auth errors to friendly, actionable messages. */
  const friendly = (message: string) => {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials")) return "Incorrect email or password. If you just signed up, make sure you're using the same password.";
    if (m.includes("email not confirmed")) return "Please verify your email address before signing in — check your inbox.";
    if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already"))
      return "That email is already registered. Try signing in instead.";
    if (m.includes("invalid email") || m.includes("unable to validate email")) return "Please enter a valid email address.";
    if (m.includes("password should be")) return "Password must be at least 8 characters.";
    if (m.includes("user not found")) return "We couldn't find an account with that email.";
    if (m.includes("failed to fetch") || m.includes("network")) return "Network error — please check your connection and try again.";
    if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a moment and try again.";
    return message;
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = validate(false);
    if (invalid) return toast.error(invalid);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return toast.error(friendly(error.message));
      toast.success("Welcome back!");
      navigate(dest, { replace: true });
    } catch {
      toast.error("Network error — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = validate(true);
    if (invalid) return toast.error(invalid);
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: name.trim() },
        },
      });
      if (error) return toast.error(friendly(error.message));
      // Session present => verification disabled, user is signed in immediately.
      if (data.session) {
        toast.success("Account created — you're in!");
        navigate(dest, { replace: true });
      } else {
        toast.success("Account created. Please verify your email, then sign in.");
      }
    } catch {
      toast.error("Network error — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (res.error) return toast.error(friendly(res.error.message || "Google sign-in failed"));
      if (!res.redirected) navigate(dest, { replace: true });
    } catch {
      toast.error("Network error — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  /** Send a password-reset email; the link lands on /reset-password on this same origin. */
  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const mail = resetEmail.trim();
    if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return toast.error("Please enter a valid email address.");
    setResetBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(mail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return toast.error(friendly(error.message));
      // Supabase does not reveal whether the address exists, so keep the copy neutral.
      toast.success("Password reset email sent — check your inbox (and spam folder).");
      setForgotOpen(false);
      setResetEmail("");
    } catch {
      toast.error("Network error — please check your connection and try again.");
    } finally {
      setResetBusy(false);
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
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Welcome to Cashivo</h1>
            <p className="mt-1 text-sm text-muted-foreground">Personal finance, effortlessly beautiful.</p>
          </div>
        </div>

        <Card className="rounded-3xl border-none shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="font-display">Get started</CardTitle>
            <CardDescription>Sign in or create your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full rounded-xl h-11 mb-4" onClick={google} disabled={busy}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <span className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></span>
            </div>

            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2 rounded-xl">
                <TabsTrigger value="signin" className="rounded-lg">Sign in</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-4">
                <form onSubmit={signIn} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="email-in">Email</Label>
                    <Input id="email-in" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pw-in">Password</Label>
                      <button
                        type="button"
                        onClick={() => { setResetEmail(email); setForgotOpen(true); }}
                        className="text-xs font-medium text-primary hover:underline underline-offset-4 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input id="pw-in" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full rounded-xl h-11 press" disabled={busy}>Sign in</Button>

                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-4">
                <form onSubmit={signUp} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-up">Email</Label>
                    <Input id="email-up" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pw-up">Password</Label>
                    <Input id="pw-up" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full rounded-xl h-11" disabled={busy}>Create account</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Reset your password</DialogTitle>
            <DialogDescription>
              Enter your registered email and we'll send you a secure link to set a new password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={sendReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="rounded-xl"
                placeholder="you@example.com"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" className="rounded-xl press" onClick={() => setForgotOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl press" disabled={resetBusy}>
                {resetBusy ? "Sending…" : "Send reset link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
