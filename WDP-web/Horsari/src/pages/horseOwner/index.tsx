import { useState } from "react";
import NavBar, { type Tab } from "../../components/ownerComponents/Navbar";
import HomePage from "./HomePage";
import ManagementPage from "./Management";

// ── Placeholder pages for non-Dashboard tabs ──────────────────────────────────
// function ComingSoon({ title }: { title: string }) {
//   return (
//     <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
//       <p
//         className="text-[32px] font-bold text-white"
//         style={{ fontFamily: "'Playfair Display', serif" }}
//       >
//         {title}
//       </p>
//       <p className="text-[14px] text-gray-500">This section is coming soon.</p>
//     </div>
//   );
// }

// ── Tab → component map ───────────────────────────────────────────────────────
function ActiveView({ tab }: { tab: Tab }) {
  switch (tab) {
    case "Dashboard":
      return <HomePage />;
    case "Management":
      return <ManagementPage />;
  }
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");

  return (
    <div
      className="min-h-screen bg-[#111111] text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
      <ActiveView tab={activeTab} />
    </div>
  );
}