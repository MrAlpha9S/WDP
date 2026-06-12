import { Search } from "lucide-react";

interface ParticipantsProps {
    metadata: any;
    createRaceType: string;
    selectedOwners: string[];
    setSelectedOwners: (v: string[]) => void;
    checkEligibility: (horse: any, selectedRaceType: string) => boolean;
    refereeSearchQuery: string;
    setRefereeSearchQuery: (v: string) => void;
    selectedReferees: string[];
    setSelectedReferees: (v: string[]) => void;
    refereeFees: Record<string, number>;
    setRefereeFees: (v: Record<string, number>) => void;
}

export default function CreateRaceParticipants(props: ParticipantsProps) {
    const { metadata, createRaceType, checkEligibility } = props;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Invite Horse Owners <span className="text-gray-500 normal-case ml-1 font-normal">(Auto-filtered for {createRaceType} eligibility)</span>
                </label>
                <div className="p-3 bg-[#111] border border-white/10 rounded flex flex-col gap-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                    {metadata?.owners?.filter((owner: any) => owner.horses.some((h: any) => checkEligibility(h, createRaceType))).map((owner: any) => {
                        const ownerId = owner._id?._id ?? owner._id;
                        const ownerName = owner.user?.fullName ?? owner._id?.fullName ?? 'Unknown Owner';
                        const eligibleHorses = owner.horses.filter((h: any) => checkEligibility(h, createRaceType));
                        return (
                            <label key={String(ownerId)} className="flex items-start gap-3 p-2 cursor-pointer group hover:bg-white/5 rounded transition-colors">
                                <input
                                    type="checkbox"
                                    checked={props.selectedOwners.includes(String(ownerId))}
                                    onChange={(e) => {
                                        const id = String(ownerId);
                                        if (e.target.checked) {
                                            props.setSelectedOwners([...props.selectedOwners, id]);
                                        } else {
                                            props.setSelectedOwners(props.selectedOwners.filter(sid => sid !== id));
                                        }
                                    }}
                                    className="w-3.5 h-3.5 mt-1 accent-red-600 rounded bg-black border-white/20"
                                />
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-semibold text-white group-hover:text-red-400 transition-colors">{ownerName}</span>
                                    <span className="text-[11px] text-gray-500">
                                        Eligible: {eligibleHorses.map((h: any) => {
                                            const wins = h.raceResults ? h.raceResults.filter((r: any) => r.finishPosition === 1).length : 0;
                                            return `${h.horseName} (${wins}w)`;
                                        }).join(", ")}
                                    </span>
                                </div>
                            </label>
                        );
                    })}
                    {(!metadata?.owners || metadata.owners.filter((owner: any) => owner.horses.some((h: any) => checkEligibility(h, createRaceType))).length === 0) && (
                        <div className="text-[12px] text-gray-500 p-2 italic text-center">No eligible horse owners found for this race type.</div>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Assign Referee <span className="text-gray-500 normal-case ml-1 font-normal">(Optional)</span>
                </label>
                <div className="p-3 bg-[#111] border border-white/10 rounded flex flex-col gap-2">
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input
                            type="text"
                            placeholder="Search referee by name..."
                            value={props.refereeSearchQuery}
                            onChange={(e) => props.setRefereeSearchQuery(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded py-1.5 pl-9 pr-3 text-[12px] text-white focus:outline-none focus:border-red-500/50"
                        />
                    </div>
                    <div className="max-h-[120px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
                        {metadata?.referees?.filter((r: any) => (r._id?.fullName || "").toLowerCase().includes(props.refereeSearchQuery.toLowerCase())).map((referee: any) => {
                            const refereeId = referee._id?._id ?? referee._id;
                            const refName = referee._id?.fullName ?? 'Unknown Referee';
                            return (
                                <label key={String(refereeId)} className="flex items-center gap-3 p-2 cursor-pointer group hover:bg-white/5 rounded transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={props.selectedReferees.includes(String(refereeId))}
                                        onChange={(e) => {
                                            const id = String(refereeId);
                                            if (e.target.checked) {
                                                props.setSelectedReferees([...props.selectedReferees, id]);
                                            } else {
                                                props.setSelectedReferees(props.selectedReferees.filter(sid => sid !== id));
                                                const newFees = { ...props.refereeFees };
                                                delete newFees[id];
                                                props.setRefereeFees(newFees);
                                            }
                                        }}
                                        className="w-3.5 h-3.5 accent-red-600 rounded bg-black border-white/20"
                                    />
                                    <span className="text-[13px] font-semibold text-white group-hover:text-red-400 transition-colors flex-1 truncate">{refName}</span>
                                    {props.selectedReferees.includes(String(refereeId)) && (
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Fee ($)"
                                            value={props.refereeFees[String(refereeId)] || ""}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                                const val = e.target.value ? Number(e.target.value) : 0;
                                                props.setRefereeFees({ ...props.refereeFees, [String(refereeId)]: val });
                                            }}
                                            className="w-[80px] bg-[#161616] border border-white/10 rounded p-1 text-[11px] text-white focus:outline-none focus:border-red-500/50"
                                        />
                                    )}
                                </label>
                            );
                        })}
                        {(!metadata?.referees || metadata.referees.length === 0) && (
                            <div className="text-[12px] text-gray-500 p-2 italic text-center">No referees available.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
