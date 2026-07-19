import InvitationsSection from "./AdminComponents/InvitationsSection";

export default function AdminInvitationsPage() {
    return (
        <div className="px-8 py-8 font-sans">
            <div className="mb-7">
                <h1
                    className="text-[26px] font-bold text-white tracking-tight font-serif"
                >
                    Invitations
                </h1>
                <p className="text-[13px] text-gray-500 mt-0.5">
                    All horse owner, referee, and jockey invitations across the system.
                </p>
            </div>

            <InvitationsSection limit={10} />
        </div>
    );
}
