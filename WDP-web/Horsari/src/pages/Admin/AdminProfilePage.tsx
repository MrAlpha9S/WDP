import { useEffect, useState } from "react";
import ProfileForm from "../../components/ProfileForm";
import { adminService } from "../../api/adminService";
import { authService } from "../../api/loginService";
import { useAuth } from "../../providers/AuthProvider";
import type { SelfProfileData, UpdateSelfProfilePayload } from "../../api/profileTypes";

export default function AdminProfilePage() {
    const { updateUser } = useAuth();
    const [profile, setProfile] = useState<SelfProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const res = await adminService.getMyProfile();
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
            const res = await adminService.updateMyProfile(payload);
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

    return (
        <div className="px-8 py-8 font-sans">
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
                extraInfo={
                    profile
                        ? [
                              { label: "Role", value: "Admin" + (profile.isMainAdmin ? " (Main)" : "") },
                              { label: "Wallet", value: `${(profile.wallet ?? 0).toLocaleString("vi-VN")} ₫` },
                          ]
                        : undefined
                }
            />
        </div>
    );
}
