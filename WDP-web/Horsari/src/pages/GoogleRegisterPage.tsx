import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { PdfUploadField } from "../components/FilesUploadProps";
import { RoleSelector, type Role } from "../components/RoleSelectionProps";

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

export default function GoogleRegisterPage() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const ROLES: Role[] = [
    { role: "referee", label: "Referee" },
    { role: "owner", label: "Horse Owner" },
  ];

  const handleGoogleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedRole) {
      setError("You must select a role");
      return;
    }
    if (!pdfFile) {
      setError("Certification must be submitted for this role");
      return;
    }
    if (pdfFile.size > 5 * 1024 * 1024) {
      setError("PDF must be under 5 MB.");
      return;
    }

    setSubmitting(true);
    try {
      // In reality, you'd pass role & pdf to an API or attach to the user context
      await loginWithGoogle();
      if (selectedRole.role === "referee") {
        navigate("/referee/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      setError(err?.message ?? "Google sign up failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0ef] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg shadow-black/8 px-9 pt-8 pb-9">
        <h1 className="text-[26px] font-semibold text-gray-900 text-center tracking-tight mb-1"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          Google Sign Up
        </h1>
        <p className="text-[13.5px] text-gray-500 text-center mb-6">
          Complete your profile to join Velosteed
        </p>

        {error && (
          <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleGoogleSignup} className="flex flex-col gap-4">
          <RoleSelector roles={ROLES} selected={selectedRole} onChange={setSelectedRole} />

          <PdfUploadField
            label="License Document"
            hint="PDF only · Max 5 MB"
            file={pdfFile}
            onChange={setPdfFile}
          />

          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-200 rounded-xl py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm disabled:opacity-60 transition-all duration-150 mt-2">
            <GoogleIcon /> {submitting ? "Signing up…" : "Complete with Google"}
          </button>

          <p className="text-center text-[13px] text-gray-500 mt-2">
            Already have an account?{" "}
            <button type="button" onClick={() => navigate("/login")} className="text-red-800 font-semibold hover:underline">
              Log in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
