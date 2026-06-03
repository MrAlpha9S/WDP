import { UPCOMING, INVITES } from "../../shared/data/HomepageData";
import HomeCalendar from "./RefereeComponents/HomeCalendar";
import InviteSidebar from "./RefereeComponents/InviteSidebar";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="mb-7">
                    <h1
                        className="text-[26px] font-bold text-white tracking-tight"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Dashboard
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        Your upcoming race schedule and recent invitations.
                    </p>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
                    <HomeCalendar races={UPCOMING} />
                    <InviteSidebar invites={INVITES} />
                </div>
            </div>
        </div>
    );
}