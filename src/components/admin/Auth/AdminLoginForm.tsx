import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type LoginState = {
  email: string;
  password: string;
};

const INITIAL_LOGIN_STATE: LoginState = {
  email: "",
  password: "",
};

export function AdminLoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signIn } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<LoginState>(INITIAL_LOGIN_STATE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectPath = useMemo(() => {
    const state = location.state as { from?: string } | null;
    if (state?.from && state.from.startsWith("/admin")) {
      return state.from;
    }

    return "/admin/dashboard";
  }, [location.state]);

  if (session) {
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    const { error } = await signIn(formState.email.trim(), formState.password);

    if (error) {
      setErrorMessage(error);
      toast.error("Login failed", { description: error });
      setIsSubmitting(false);
      return;
    }

    toast.success("Logged in", { description: "Welcome back to admin." });
    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-public-surface)] px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-lg border border-[#a4d473]/30 bg-[var(--app-public-paper)] p-6 shadow-lg">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mb-3 flex justify-center">
              <div className="rounded-lg bg-[#a4d473]/20 p-2">
                <Lock className="size-5 text-[#a4d473]" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-[var(--app-public-surface)]">
              Admin Access
            </h1>
            <p className="mt-1 text-xs text-[#383838]/70">
              Sign in to your admin account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              {/* Email Field */}
              <Field>
                <FieldLabel
                  htmlFor="admin-email"
                  className="text-sm text-[var(--app-public-surface)]"
                >
                  Email Address
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    value={formState.email}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="admin@example.com"
                    className="border-[#a4d473]/40 bg-white/60 text-[#383838] placeholder:text-[#383838]/50 focus:border-[#a4d473]/70 focus:ring-[#a4d473]/50"
                    required
                  />
                </FieldContent>
              </Field>

              {/* Password Field */}
              <Field>
                <FieldLabel
                  htmlFor="admin-password"
                  className="text-sm text-[var(--app-public-surface)]"
                >
                  Password
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    value={formState.password}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Enter your password"
                    className="border-[#a4d473]/40 bg-white/60 text-[#383838] placeholder:text-[#383838]/50 focus:border-[#a4d473]/70 focus:ring-[#a4d473]/50"
                    required
                  />
                </FieldContent>
              </Field>

              {/* Error Message */}
              {errorMessage ? (
                <div className="rounded-md border border-red-600/30 bg-red-500/10 px-3 py-2">
                  <FieldError className="text-xs text-red-600">
                    {errorMessage}
                  </FieldError>
                </div>
              ) : null}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#a4d473] text-sm text-[#383838] hover:bg-[#feb234]"
              >
                {isSubmitting ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </FieldGroup>
          </form>

          {/* Footer */}
          <div className="mt-4 border-t border-[#a4d473]/20 pt-4">
            <p className="text-center text-xs text-[#383838]/60">
              Questions? Contact your administrator for access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
