import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: { username: string; password: string }) => {
    try {
      setError(null);
      const login_status = await loginUser(data);

      toast("User successfully logged in");
    } catch (err) {
      setError(err instanceof Error ? err.message : "User failed to login");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <Card className="w-full max-w-md border-primary/10 shadow-lg backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center tracking-tight">Welcome Back</CardTitle>
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
                    <FormLabel className="text-foreground/70">Username</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" className="bg-background/50 border-primary/10 transition-colors hover:border-primary/30 focus:border-primary" placeholder="Enter your username" />
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
                    <FormLabel className="text-foreground/70">Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        className="bg-background/50 border-primary/10 transition-colors hover:border-primary/30 focus:border-primary"
                        placeholder="Enter your password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-primary/90 hover:bg-primary transition-colors" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
