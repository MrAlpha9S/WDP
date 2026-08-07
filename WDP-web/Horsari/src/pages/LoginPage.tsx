import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { PdfUploadField } from "../components/FilesUploadProps";
import { RoleSelector, type Role } from "../components/RoleSelectionProps";

type Tab = "login" | "signup";

interface InputFieldProps {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  rightElement?: React.ReactNode;
  required?: boolean;
}

function InputField({ label, type = "text", placeholder, value, onChange, icon, rightElement, required }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-text-muted tracking-wider uppercase">{label}</label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-text-muted pointer-events-none flex items-center">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full bg-surface border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm text-text placeholder-text-muted/50 outline-none focus:border-red/60 focus:bg-surface-raised focus:ring-1 focus:ring-red/40 transition-all duration-150"
        />
        {rightElement && <span className="absolute right-3 flex items-center">{rightElement}</span>}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [pwFocused, setPwFocused] = useState(false);

  // Password strength rules
  const pwRules = [
    { label: "At least 8 characters",        test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter (A–Z)",   test: (p: string) => /[A-Z]/.test(p) },
    { label: "One lowercase letter (a–z)",   test: (p: string) => /[a-z]/.test(p) },
    { label: "One number (0–9)",              test: (p: string) => /[0-9]/.test(p) },
    { label: "One special character (!@#…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];
  const allRulesPassed = pwRules.every(r => r.test(password));

  const ROLES: Role[] = [
    { role: "referee", label: "Referee" },
    { role: "horseowner", label: "Horse Owner" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user?.role === "referee") {
        navigate("/referee/dashboard", { replace: true });
      } else if (user?.role === "horseowner") {
        navigate("/owner", { replace: true });
      } else if (user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      setError(err?.message ?? "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!allRulesPassed) {
      setError("Please meet all password requirements before continuing.");
      return;
    }
    if (password !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }
    if (!pdfFile) {
      setError("Certification must be submitted for this role");
      return;
    }
    if (!selectedRole) {
      setError("You must select a role");
      return;
    }
    if (pdfFile && pdfFile.size > 5 * 1024 * 1024) {
      setError("PDF must be under 5 MB.");
      return;
    }
    setSubmitting(true);
    try {
      await signup(name, email, password, selectedRole?.role, pdfFile);
      if (selectedRole.role == "referee") {
        navigate("/referee/dashboard", { replace: true });
      } else if (selectedRole?.role === 'horseowner') {
        navigate("/owner", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      setError(err?.message ?? "Sign up failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const EyeToggle = (
    <button type="button" onClick={() => setShowPw((p) => !p)}
      className="text-text-muted hover:text-text transition-colors cursor-pointer"
      aria-label={showPw ? "Hide password" : "Show password"}>
      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  const switchTab = (t: Tab) => { setTab(t); setError(""); };

  return (
    <div
      className="min-h-screen bg-bg flex items-center justify-center px-4 py-10 font-sans"
    >
      {/* Subtle red glow behind card */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-105 h-105 rounded-full opacity-10 blur-[100px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #7f1d1d 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-[420px] bg-surface border border-border rounded-2xl shadow-2xl shadow-black/60 px-8 pt-8 pb-9">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/horsari_logo_full.png" alt="Horsari" className="h-16 object-contain" />
        </div>

        {/* Tabs */}
        <div className="flex bg-surface rounded-xl p-1 mb-7 gap-1">
          {(["login", "signup"] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => switchTab(t)}
              className={[
                "flex-1 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 cursor-pointer",
                tab === t
                  ? "bg-surface-raised text-text shadow-sm"
                  : "text-text-muted hover:text-text",
              ].join(" ")}>
              {t === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Heading */}
        <h1
          className="text-[24px] font-semibold text-text text-center tracking-tight mb-1"
        >
          {tab === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-[13px] text-text-muted text-center mb-6">
          {tab === "login" ? "Sign in to your Horsari account" : "Join and start your journey"}
        </p>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-2.5 bg-error-bg border border-error-border rounded-lg text-[12.5px] text-red">
            {error}
          </div>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <InputField label="Email Address" type="email" placeholder="you@example.com"
              value={email} onChange={setEmail} icon={<Mail size={15} />} required />
            <InputField label="Password" type={showPw ? "text" : "password"} placeholder="••••••••••••"
              value={password} onChange={setPassword} icon={<Lock size={15} />} rightElement={EyeToggle} required />

            <div className="flex justify-end -mt-1">
              <a href="/forgot-password" className="text-[12px] text-text-muted hover:text-text transition-colors">
                Forgot password?
              </a>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-red hover:bg-red/85 disabled:opacity-50 text-white font-semibold text-[13px] tracking-widest uppercase py-3 rounded-xl transition-all duration-150 hover:shadow-lg hover:shadow-red-900/40 active:scale-[0.99] mt-1 cursor-pointer">
              {submitting ? "Signing in…" : "Sign In"}
            </button>

            <p className="text-center text-[12.5px] text-text-muted/70 mt-1">
              Don't have an account?{" "}
              <button type="button" onClick={() => switchTab("signup")} className="text-red font-semibold hover:text-red/80 transition-colors cursor-pointer">
                Sign up
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <InputField label="Full Name" placeholder="Your full name"
              value={name} onChange={setName} icon={<User size={15} />} required />
            <InputField label="Email Address" type="email" placeholder="you@example.com"
              value={email} onChange={setEmail} icon={<Mail size={15} />} required />

            <div className="flex flex-col gap-1.5">
              <InputField label="Password" type={showPw ? "text" : "password"} placeholder="Create a strong password"
                value={password}
                onChange={(v) => { setPassword(v); }}
                icon={<Lock size={15} />}
                rightElement={
                  <button type="button" onClick={() => setShowPw((p) => !p)}
                    onFocus={() => setPwFocused(true)}
                    className="text-text-muted hover:text-text transition-colors cursor-pointer"
                    aria-label={showPw ? "Hide password" : "Show password"}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                required />
              {/* Password strength feedback — dots use currentColor so they inherit
                  the wrapping text-green/text-text-muted color instead of hardcoded hex. */}
              {(pwFocused || password.length > 0) && (
                allRulesPassed ? (
                  <p className="flex items-center gap-1.5 text-[11.5px] text-green mt-1">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="6" fill="currentColor" opacity="0.15" />
                      <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Password looks good!
                  </p>
                ) : (
                  <ul className="mt-1 flex flex-col gap-1">
                    {pwRules.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <li key={rule.label} className={`flex items-center gap-1.5 text-[11.5px] transition-colors duration-150 ${ok ? "text-green" : "text-text-muted/70"}`}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            {ok ? (
                              <>
                                <circle cx="6" cy="6" r="6" fill="currentColor" opacity="0.15" />
                                <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </>
                            ) : (
                              <>
                                <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                                <path d="M6 3.5v3M6 8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                              </>
                            )}
                          </svg>
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                )
              )}
            </div>

            <InputField label="Confirm Password" type="password" placeholder="Repeat your password"
              value={confirmPw} onChange={setConfirmPw} icon={<Lock size={15} />} required />

            <RoleSelector roles={ROLES} selected={selectedRole} onChange={setSelectedRole} />

            <PdfUploadField
              label="License Document"
              hint="PDF only · Max 5 MB"
              file={pdfFile}
              onChange={setPdfFile}
            />

            <button type="submit" disabled={submitting}
              className="w-full bg-red hover:bg-red/85 disabled:opacity-50 text-white font-semibold text-[13px] tracking-widest uppercase py-3 rounded-xl transition-all duration-150 hover:shadow-lg hover:shadow-red-900/40 active:scale-[0.99] mt-1 cursor-pointer">
              {submitting ? "Creating…" : "Create Account"}
            </button>

            <p className="text-center text-[12.5px] text-text-muted/70 mt-1">
              Already have an account?{" "}
              <button type="button" onClick={() => switchTab("login")} className="text-red font-semibold hover:text-red/80 transition-colors cursor-pointer">
                Log in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}