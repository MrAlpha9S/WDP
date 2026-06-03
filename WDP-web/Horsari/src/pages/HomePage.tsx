import { MapPin, Clock, ChevronRight } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Race {
  id: number;
  title: string;
  venue: string;
  date: string;
  time: string;
  image: string;
}

// ── Mock data (swap with real API) ───────────────────────────────────────────
const FEATURED = {
  title: "The Run for the Roses",
  venue: "Churchill Downs",
  date: "May 2, 2026",
  time: "6:57 PM ET",
  description: "14 Elite Thoroughbreds Competing Live Odds Updated Every Minute",
  image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=80",
};

const UPCOMING: Race[] = [
  {
    id: 1,
    title: "Kentucky Derby",
    venue: "Churchill Downs",
    date: "Today",
    time: "8:30 AM",
    image: "https://images.unsplash.com/photo-1567163437983-b0d9a2b5b369?w=400&q=80",
  },
  {
    id: 2,
    title: "Dubai World Cup",
    venue: "Meydan Racecourse",
    date: "Today",
    time: "8:30 PM",
    image: "https://images.unsplash.com/photo-1525543907410-b2562b6796b6?w=400&q=80",
  },
  {
    id: 3,
    title: "Royal Ascot Championship",
    venue: "Ascot Racecourse",
    date: "Tomorrow",
    time: "3:15 PM",
    image: "https://images.unsplash.com/photo-1508817628294-5a453fa0b8fb?w=400&q=80",
  },
  {
    id: 4,
    title: "Breeders' Cup Classic",
    venue: "Santa Anita Park",
    date: "12/12",
    time: "4:30 PM",
    image: "https://images.unsplash.com/photo-1598901847919-b2a5e9e00f64?w=400&q=80",
  },
  {
    id: 5,
    title: "Breeders' Cup Classic",
    venue: "Santa Anita Park",
    date: "12/12",
    time: "4:30 PM",
    image: "https://images.unsplash.com/photo-1553284965-5dd67167ac2f?w=400&q=80",
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function RaceCard({ race }: { race: Race }) {
  return (
    <div className="group rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer">
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img
          src={race.image}
          alt={race.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <div className="px-4 py-3">
        <p className="text-[14px] font-semibold text-gray-900 leading-snug">{race.title}</p>
        <p className="text-[12.5px] text-gray-500 mt-0.5">{race.venue}</p>
        <p className="text-[12px] text-gray-400 mt-1 flex items-center gap-1">
          <Clock size={11} className="shrink-0" />
          {race.date} • {race.time}
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div
      className="min-h-screen bg-[#fdf5f5]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Subtle vertical stripe background — matches screenshot */}
      <div
        className="min-h-screen"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(220,38,38,0.06) 38px, rgba(220,38,38,0.06) 40px)",
        }}
      >
        <div className="max-w-3xl mx-auto px-5 py-8">

          {/* ── Featured Derby ─────────────────────────────────────────── */}
          <section className="mb-10">
            <h2
              className="text-xl font-semibold text-gray-900 mb-4 tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Featured Derby
            </h2>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col sm:flex-row">
              {/* Race image */}
              <div className="sm:w-[300px] shrink-0 h-52 sm:h-auto overflow-hidden bg-gray-100">
                <img
                  src={FEATURED.image}
                  alt={FEATURED.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="p-6 flex flex-col justify-center gap-3">
                <p
                  className="text-[15px] text-gray-500 italic"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  "{FEATURED.title}"
                </p>

                <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
                  <MapPin size={13} className="text-red-700 shrink-0" />
                  <span>{FEATURED.venue}</span>
                  <span className="mx-1 text-gray-300">•</span>
                  <Clock size={13} className="text-red-700 shrink-0" />
                  <span>{FEATURED.date} • {FEATURED.time}</span>
                </div>

                <p className="text-[13.5px] text-gray-600 leading-relaxed">
                  {FEATURED.description}
                </p>

                <div className="flex items-center gap-3 mt-1">
                  <button className="px-5 py-2 rounded-lg border border-red-800 text-red-800 text-sm font-semibold hover:bg-red-50 transition-colors duration-150">
                    View Race Details
                  </button>
                  <button className="px-5 py-2 rounded-lg bg-red-800 text-white text-sm font-semibold hover:bg-red-900 shadow-sm hover:shadow-md hover:shadow-red-900/25 transition-all duration-150">
                    Bet Now
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Upcoming Races ─────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-xl font-semibold text-gray-900 tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Upcoming Races
              </h2>
              <button className="flex items-center gap-1 text-[13px] text-red-800 font-medium hover:underline">
                View all <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {UPCOMING.map((race) => (
                <RaceCard key={race.id} race={race} />
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}