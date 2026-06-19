import { MapPin, Calendar } from "lucide-react";

interface BasicInfoProps {
    raceTitle: string;
    setRaceTitle: (v: string) => void;
    tournamentId: string;
    setTournamentId: (v: string) => void;
    metadata: any;
    createRaceType: string;
    setCreateRaceType: (v: string) => void;
    setSelectedOwners: (v: string[]) => void;
    location: string;
    setLocation: (v: string) => void;
    raceGround: string;
    setRaceGround: (v: string) => void;
    address: string;
    setAddress: (v: string) => void;
    raceDate: string;
    setRaceDate: (v: string) => void;
    minDateUI?: string;
    maxDateUI?: string;
    raceTime: string;
    setRaceTime: (v: string) => void;
    trackLength: number | "";
    setTrackLength: (v: number | "") => void;
    maxParticipants: number;
    setMaxParticipants: (v: number) => void;
}

export default function CreateRaceBasicInfo(props: BasicInfoProps) {
    const { metadata } = props;

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Race Title</label>
                    <input
                        type="text"
                        value={props.raceTitle}
                        onChange={(e) => props.setRaceTitle(e.target.value)}
                        placeholder="e.g. Royal Ascot Gold Cup"
                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Tournament</label>
                    <select
                        value={props.tournamentId}
                        onChange={(e) => props.setTournamentId(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none"
                    >
                        {metadata?.tournaments?.map((t: any) => (
                            <option className="bg-[#1a1a1a] text-white" key={t._id} value={t._id}>{t.tournamentName}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Race Type</label>
                    <select
                        value={props.createRaceType}
                        onChange={(e) => {
                            props.setCreateRaceType(e.target.value);
                            props.setSelectedOwners([]);
                        }}
                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none"
                    >
                        {metadata?.eligibilityRules?.map((rule: any) => (
                            <option className="bg-[#1a1a1a] text-white" key={rule._id} value={rule.raceType}>{rule.raceType}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Track Location</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input
                            type="text"
                            list="tracks-list"
                            value={props.location}
                            onChange={(e) => {
                                const loc = e.target.value;
                                props.setLocation(loc);
                                const match = metadata?.previousRaceTracks?.find((t: any) => t.location === loc);
                                if (match) {
                                    if (match.raceGround) props.setRaceGround(match.raceGround);
                                    if (match.address) props.setAddress(match.address);
                                }
                            }}
                            placeholder="Select or enter custom..."
                            className="w-full bg-[#111] border border-white/10 rounded p-2.5 pl-9 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                        />
                        <datalist id="tracks-list">
                            {metadata?.previousRaceTracks?.map((t: any) => <option className="bg-[#1a1a1a] text-white" key={t.location} value={t.location} />)}
                        </datalist>
                    </div>
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Race Ground</label>
                    <input
                        type="text"
                        value={props.raceGround}
                        onChange={(e) => props.setRaceGround(e.target.value)}
                        placeholder="e.g. Dirt, Turf"
                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                    />
                </div>
            </div>

            <div>
                <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Address</label>
                <input
                    type="text"
                    value={props.address}
                    onChange={(e) => props.setAddress(e.target.value)}
                    placeholder="e.g. 123 Racing Blvd, City"
                    className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input
                            type="date"
                            value={props.raceDate}
                            min={props.minDateUI}
                            max={props.maxDateUI}
                            onChange={(e) => props.setRaceDate(e.target.value)}
                            className="w-full bg-[#111] border border-white/10 rounded p-2.5 pl-9 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Start Time</label>
                    <input
                        type="time"
                        value={props.raceTime}
                        onChange={(e) => props.setRaceTime(e.target.value)}
                        min="09:00"
                        max="17:00"
                        step="1800"
                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Track Length (m)</label>
                    <input
                        type="number"
                        min="200"
                        placeholder="e.g. 1200"
                        value={props.trackLength}
                        onChange={(e) => props.setTrackLength(e.target.value ? Number(e.target.value) : "")}
                        onBlur={() => {
                            if (typeof props.trackLength === 'number' && props.trackLength < 200) {
                                props.setTrackLength(200);
                            }
                        }}
                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Max Participants</label>
                    <input
                        type="number"
                        value={props.maxParticipants}
                        onChange={(e) => props.setMaxParticipants(Number(e.target.value))}
                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                    />
                </div>
            </div>
        </div>
    );
}
