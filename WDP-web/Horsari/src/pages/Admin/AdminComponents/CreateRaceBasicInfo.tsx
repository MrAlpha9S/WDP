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
    housingFeePercentage: number | "";
    setHousingFeePercentage: (v: number | "") => void;
    overrideScheduleConflict: boolean;
    setOverrideScheduleConflict: (v: boolean) => void;
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
                        className="w-full bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Tournament</label>
                    <select
                        value={props.tournamentId}
                        onChange={(e) => props.setTournamentId(e.target.value)}
                        className="w-full bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none"
                    >
                        {metadata?.tournaments?.map((t: any) => (
                            <option className="bg-surface text-white" key={t._id} value={t._id}>{t.tournamentName}</option>
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
                        className="w-full bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none"
                    >
                        {metadata?.eligibilityRules?.map((rule: any) => (
                            <option className="bg-surface text-white" key={rule._id} value={rule._id}>{rule.raceType}</option>
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
                            className="w-full bg-bg border border-border rounded p-2.5 pl-9 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                        />
                        <datalist id="tracks-list">
                            {metadata?.previousRaceTracks?.map((t: any) => <option className="bg-surface text-white" key={t.location} value={t.location} />)}
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
                        className="w-full bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
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
                    className="w-full bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
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
                            className="w-full bg-bg border border-border rounded p-2.5 pl-9 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]"
                        />
                    </div>
                    <label className="flex items-center gap-2 mt-2 text-[11.5px] text-gray-500 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={props.overrideScheduleConflict}
                            onChange={(e) => props.setOverrideScheduleConflict(e.target.checked)}
                            className="accent-amber-500"
                        />
                        <span>Override scheduling restrictions (same-day, &lt;2-week lead time, 90-min location conflicts)</span>
                    </label>
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Start Time</label>
                    <div className="flex gap-2 items-center">
                        <select
                            value={props.raceTime.split(':')[0] ?? '09'}
                            onChange={(e) => props.setRaceTime(`${e.target.value}:${props.raceTime.split(':')[1] ?? '00'}`)}
                            className="flex-1 bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                        >
                            {Array.from({ length: 9 }, (_, i) => i + 9).map(h => {
                                const hh = String(h).padStart(2, '0');
                                return <option key={hh} value={hh}>{hh}</option>;
                            })}
                        </select>
                        <span className="text-white font-bold">:</span>
                        <select
                            value={props.raceTime.split(':')[1] ?? '00'}
                            onChange={(e) => props.setRaceTime(`${props.raceTime.split(':')[0] ?? '09'}:${e.target.value}`)}
                            className="flex-1 bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                        >
                            <option value="00">00</option>
                            <option value="30">30</option>
                        </select>
                    </div>
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
                        className="w-full bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Max Participants</label>
                    <input
                        type="number"
                        value={props.maxParticipants}
                        onChange={(e) => props.setMaxParticipants(Number(e.target.value))}
                        className="w-full bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                    />
                </div>
            </div>

            <div>
                <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Housing Fee %</label>
                <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Defaults to platform rate (17%)"
                    value={props.housingFeePercentage}
                    onChange={(e) => props.setHousingFeePercentage(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                />
            </div>
        </div>
    );
}
