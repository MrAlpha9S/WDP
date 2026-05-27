import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { PdfUploadField } from "../components/FilesUploadProps";
import { RoleSelector, type Role } from "../components/RoleSelectionProps";

type Tab = "login" | "signup";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

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
      <label className="text-[13px] font-medium text-gray-700">{label}</label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-gray-400 pointer-events-none flex items-center">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all duration-150"
        />
        {rightElement && <span className="absolute right-3 flex items-center">{rightElement}</span>}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login, loginWithGoogle, signup } = useAuth();
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

  const ROLES: Role[] = [
    { role: "referee", label: "Referee" },
    { role: "owner", label: "Horse Owner" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      if(selectedRole?.role === 'owner') {
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

  const handleGoogle = async () => {
    setError("");
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Google login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const EyeToggle = (
    <button type="button" onClick={() => setShowPw((p) => !p)}
      className="text-gray-400 hover:text-gray-600 transition-colors"
      aria-label={showPw ? "Hide password" : "Show password"}>
      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  const switchTab = (t: Tab) => { setTab(t); setError(""); };

  return (
    <div className="min-h-screen bg-[#f0f0ef] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-100 bg-white rounded-2xl shadow-lg shadow-black/8 px-9 pt-8 pb-9">

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-7">
          {(["login", "signup"] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => switchTab(t)}
              className={[
                "flex-1 pb-3 text-[15px] font-medium capitalize border-b-[2.5px] -mb-px transition-colors duration-150",
                tab === t ? "text-gray-900 border-blue-700" : "text-gray-400 border-transparent hover:text-gray-600",
              ].join(" ")}>
              {t === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Heading */}
        <h1 className="text-[26px] font-semibold text-gray-900 text-center tracking-tight mb-1"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          {tab === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-[13.5px] text-gray-500 text-center mb-6">
          {tab === "login" ? "Predict your winning horses today" : "Join Velosteed and start predicting"}
        </p>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
            {error}
          </div>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <InputField label="Email Address" type="email" placeholder="example@email.com"
              value={email} onChange={setEmail} icon={<Mail size={15} />} required />
            <InputField label="Password" type={showPw ? "text" : "password"} placeholder="••••••••••••••"
              value={password} onChange={setPassword} icon={<Lock size={15} />} rightElement={EyeToggle} required />

            <div className="flex justify-end -mt-1">
              <a href="/forgot-password" className="text-[12.5px] text-gray-500 hover:text-gray-700 transition-colors">
                Forgot password?
              </a>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white font-bold text-sm tracking-widest uppercase py-3 rounded-xl transition-all duration-150 hover:shadow-lg hover:shadow-red-900/30 active:scale-[0.99]">
              {submitting ? "Logging in…" : "Login"}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[12px] text-gray-400 whitespace-nowrap">Or login with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button type="button" onClick={handleGoogle} disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm disabled:opacity-60 transition-all duration-150">
              <GoogleIcon /> Google
            </button>

            <p className="text-center text-[13px] text-gray-500 mt-1">
              Don't have an account?{" "}
              <button type="button" onClick={() => switchTab("signup")} className="text-red-800 font-semibold hover:underline">
                Sign up
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <InputField label="Full Name" placeholder="Your full name"
              value={name} onChange={setName} icon={<User size={15} />} required />
            <InputField label="Email Address" type="email" placeholder="example@email.com"
              value={email} onChange={setEmail} icon={<Mail size={15} />} required />
            <InputField label="Password" type={showPw ? "text" : "password"} placeholder="Create a password"
              value={password} onChange={setPassword} icon={<Lock size={15} />} rightElement={EyeToggle} required />
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
              className="w-full bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white font-bold text-sm tracking-widest uppercase py-3 rounded-xl transition-all duration-150 hover:shadow-lg hover:shadow-red-900/30 active:scale-[0.99] mt-1">
              {submitting ? "Creating…" : "Create Account"}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[12px] text-gray-400 whitespace-nowrap">Or sign up with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button type="button" onClick={handleGoogle} disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm disabled:opacity-60 transition-all duration-150">
              <GoogleIcon /> Google
            </button>

            <p className="text-center text-[13px] text-gray-500 mt-1">
              Already have an account?{" "}
              <button type="button" onClick={() => switchTab("login")} className="text-red-800 font-semibold hover:underline">
                Log in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}