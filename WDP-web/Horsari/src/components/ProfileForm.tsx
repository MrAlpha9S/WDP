import { useEffect, useRef, useState } from "react";
import { Camera, FileText, Loader2, UploadCloud } from "lucide-react";
import type { SelfProfileData, UpdateSelfProfilePayload } from "../api/profileTypes";

interface ActionResult {
  ok: boolean;
  message: string;
}

interface LicenseSectionProps {
  status: "pending" | "approved" | "rejected";
  link?: string | null;
  onReupload: (file: File) => Promise<ActionResult>;
}

interface ExtraInfoRow {
  label: string;
  value: string;
}

interface ProfileFormProps {
  profile: SelfProfileData | null;
  loading: boolean;
  onSave: (payload: UpdateSelfProfilePayload) => Promise<ActionResult>;
  onAvatarUpload: (file: File) => Promise<ActionResult>;
  license?: LicenseSectionProps;
  extraInfo?: ExtraInfoRow[];
}

const LICENSE_BADGE: Record<LicenseSectionProps["status"], string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-700/40",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-700/40",
  rejected: "bg-red-500/10 text-red-400 border-red-700/40",
};

function getInitials(name: string | null, fallback: string) {
  const source = name?.trim() || fallback;
  return source
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Date input wants YYYY-MM-DD; backend returns a full ISO timestamp.
function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function ProfileForm({ profile, loading, onSave, onAvatarUpload, license, extraInfo }: ProfileFormProps) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName ?? "");
    setPhoneNumber(profile.phoneNumber ?? "");
    setAddress(profile.address ?? "");
    setDateOfBirth(toDateInputValue(profile.dateOfBirth));
    setAvatarPreview(profile.image ?? null);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const result = await onSave({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
      dateOfBirth: dateOfBirth || undefined,
    });
    setSaving(false);
    setMessage({ type: result.ok ? "success" : "error", text: result.message });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setMessage(null);
    const previousPreview = avatarPreview;
    setAvatarPreview(URL.createObjectURL(file));
    const result = await onAvatarUpload(file);
    setUploadingAvatar(false);
    if (!result.ok) setAvatarPreview(previousPreview);
    setMessage({ type: result.ok ? "success" : "error", text: result.message });
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleLicenseChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !license) return;
    setUploadingLicense(true);
    setMessage(null);
    const result = await license.onReupload(file);
    setUploadingLicense(false);
    setMessage({ type: result.ok ? "success" : "error", text: result.message });
    if (licenseInputRef.current) licenseInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="text-gray-600 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-[13px] text-gray-500 py-12 text-center">Could not load your profile.</p>;
  }

  return (
    <div className="max-w-2xl">
      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8">
        <div className="relative w-20 h-20 shrink-0">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-700 to-red-900 text-white flex items-center justify-center text-[22px] font-bold border border-white/10">
              {getInitials(profile.fullName, profile.username)}
            </div>
          )}
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1a1a1a] border border-white/15 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {uploadingAvatar ? <Loader2 size={12} className="animate-spin text-gray-300" /> : <Camera size={12} className="text-gray-300" />}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-white">{profile.fullName || profile.username}</p>
          <p className="text-[12px] text-gray-500">{profile.email}</p>
        </div>
      </div>

      {/* Read-only identity fields */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Username</label>
          <p className="text-[13px] text-gray-400 bg-[#111] border border-white/5 rounded-lg px-3 py-2 h-[38px] flex items-center">{profile.username}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Email</label>
          <p className="text-[13px] text-gray-400 bg-[#111] border border-white/5 rounded-lg px-3 py-2 h-[38px] flex items-center truncate">{profile.email}</p>
        </div>
      </div>

      {/* Editable form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/25 h-[38px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0901234567"
              className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/25 h-[38px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/25 h-[38px]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Your address"
            className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/25 h-[38px]"
          />
        </div>

        {message && (
          <p
            className={`text-[12px] rounded-lg px-3 py-2 border ${
              message.type === "success"
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                : "text-red-400 bg-red-500/10 border-red-500/20"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="self-start px-5 py-2.5 rounded-lg bg-[#ab3030] hover:bg-[#8f2828] text-[12px] font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>

      {/* Read-only extras (wallet, isMainAdmin, etc.) */}
      {extraInfo && extraInfo.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/5">
          <h3 className="text-[13px] font-semibold text-white mb-3">Account Info</h3>
          <div className="flex flex-col gap-2">
            {extraInfo.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-[13px]">
                <span className="text-gray-500">{row.label}</span>
                <span className="text-gray-300 font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* License (Referee / HorseOwner only) */}
      {license && (
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-white">License</h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${LICENSE_BADGE[license.status]}`}>
              {license.status}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {license.link && (
              <a
                href={license.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-white transition-colors"
              >
                <FileText size={13} /> View current license
              </a>
            )}
            <button
              type="button"
              onClick={() => licenseInputRef.current?.click()}
              disabled={uploadingLicense}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {uploadingLicense ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
              Re-upload License (PDF)
            </button>
            <input ref={licenseInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleLicenseChange} />
          </div>
          <p className="text-[11px] text-gray-600 mt-2">Re-uploading resets your license status to pending until reviewed.</p>
        </div>
      )}
    </div>
  );
}
