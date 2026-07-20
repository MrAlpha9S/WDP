import { useEffect, useState } from "react";
import ProfileForm from "../../components/ProfileForm";
import { refereeService } from "../../api/refereeService";
import { authService } from "../../api/loginService";
import { useAuth } from "../../providers/AuthProvider";
import type { SelfProfileData, UpdateSelfProfilePayload } from "../../api/profileTypes";

export default function RefereeProfilePage() {
    const { updateUser } = useAuth();
    const [profile, setProfile] = useState<SelfProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const res = await refereeService.getMyProfile();
            if (res.code === 200) setProfile(res.data);
        } catch {
            // leave profile as-is; ProfileForm shows a "could not load" state
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleSave = async (payload: UpdateSelfProfilePayload) => {
        try {
            const res = await refereeService.updateMyProfile(payload);
            if (res.code === 200) {
                setProfile(res.data);
                return { ok: true, message: "Profile updated successfully." };
            }
            return { ok: false, message: res.msg || "Failed to update profile." };
        } catch (err: any) {
            return { ok: false, message: err?.msg || "Failed to update profile." };
        }
    };

    const handleAvatarUpload = async (file: File) => {
        try {
            const res = await authService.uploadAvatar(file);
            if (res.code === 200) {
                setProfile((prev) => (prev ? { ...prev, image: res.data.image } : prev));
                updateUser({ image: res.data.image });
                return { ok: true, message: "Avatar updated." };
            }
            return { ok: false, message: res.msg || "Failed to upload avatar." };
        } catch (err: any) {
            return { ok: false, message: err?.msg || "Failed to upload avatar." };
        }
    };

    const handleLicenseReupload = async (file: File) => {
        try {
            const res = await refereeService.updateMyLicense(file);
            if (res.code === 200) {
                setProfile(res.data);
                return { ok: true, message: "License re-uploaded — pending review." };
            }
            return { ok: false, message: res.msg || "Failed to update license." };
        } catch (err: any) {
            return { ok: false, message: err?.msg || "Failed to update license." };
        }
    };

    return (
        <div className="min-h-screen font-sans">
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="mb-7">
                    <h1 className="text-[26px] font-bold text-white tracking-tight font-serif">
                        My Profile
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        Manage your account details.
                    </p>
                </div>

                <ProfileForm
                    profile={profile}
                    loading={loading}
                    onSave={handleSave}
                    onAvatarUpload={handleAvatarUpload}
                    license={
                        profile
                            ? {
                                  status: profile.licenseStatus ?? "pending",
                                  link: profile.licenseLink,
                                  onReupload: handleLicenseReupload,
                              }
                            : undefined
                    }
                />
            </div>
        </div>
    );
}
