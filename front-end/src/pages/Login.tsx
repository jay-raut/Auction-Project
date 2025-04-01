import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const resetSchema = z.object({
  username: z.string().min(1, "Username is required"),
  new_password: z.string().min(1, "Password must be at least 1 character"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      username: "",
      new_password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);

      console.log("Login data:", data);

      const login_status = await loginUser(data);

      if (login_status.ok) {
        localStorage.setItem("isAuthenticated", "true");
        toast.success("Successfully logged in");

        navigate("/");
        window.location.reload();
      } else {
        setError("Could not login check username or password");
        console.log(`Could not login ${await login_status.json()}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid username or password");
    }
  };

  async function loginUser(data: { username: any; password: any }) {
    const { username, password } = data;
    const response = await fetch("http://localhost:3000/api/authentication/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return response;
  }

  const onResetSubmit = async (data: ResetFormValues) => {
    try {
      const response = await fetch("http://localhost:3000/api/authentication/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username,
          new_password: data.new_password,
        }),
      });

      if (response.ok) {
        setResetSent(true);
        toast.success("Password reset successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to reset password");
      }
    } catch (err) {
      toast.error("Failed to reset password");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/10 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" placeholder="Enter your username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="p-0 h-auto font-normal text-xs">
                            Forgot password?
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reset your password</DialogTitle>
                            <DialogDescription>Enter your username and new password to reset your credentials.</DialogDescription>
                          </DialogHeader>
                          {resetSent ? (
                            <div className="space-y-4 py-4">
                              <Alert className="bg-primary/10 border-primary/20">
                                <AlertDescription>If an account exists with that username, the password will be updated.</AlertDescription>
                              </Alert>
                              <Button className="w-full" onClick={() => setResetSent(false)}>
                                Back to login
                              </Button>
                            </div>
                          ) : (
                            <Form {...resetForm}>
                              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                                <FormField
                                  control={resetForm.control}
                                  name="username"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Username</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="text" placeholder="Enter your username" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={resetForm.control}
                                  name="new_password"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>New Password</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="password" placeholder="Enter new password" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter>
                                  <Button type="submit" className="w-full">
                                    Reset password
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Enter your password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
