import { useState, useEffect } from "react";
import { X, Calendar, MapPin, Search, Loader2 } from "lucide-react";
import { adminService } from "../../../api/adminService";

interface CreateRaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (updateInfo?: { type: 'CREATE' | 'UPDATE'; tournament_id?: string; raceRound_id?: string }) => void;
    raceToEdit?: any;
}

export default function CreateRaceModal({ isOpen, onClose, onSuccess, raceToEdit }: CreateRaceModalProps) {
    const [createRaceType, setCreateRaceType] = useState<string>("Stakes");
    const [refereeSearchQuery, setRefereeSearchQuery] = useState("");

    // Form States
    const [trackLength, setTrackLength] = useState<number | "">("");
    const [minimalRidingFees, setMinimalRidingFees] = useState<number | "">("");
    const [requireEntranceFees, setRequireEntranceFees] = useState<boolean>(false);
    const [maxParticipants, setMaxParticipants] = useState<number>(18);
    const [raceTitle, setRaceTitle] = useState("");
    const [tournamentId, setTournamentId] = useState("");
    const [location, setLocation] = useState("");
    const [raceGround, setRaceGround] = useState("");
    const [address, setAddress] = useState("");
    const [raceDate, setRaceDate] = useState("");
    const [raceTime, setRaceTime] = useState("09:00");
    const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
    const [selectedReferees, setSelectedReferees] = useState<string[]>([]);
    const [refereeFees, setRefereeFees] = useState<Record<string, number>>({});
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const [metadata, setMetadata] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            adminService.getCreateRaceMetadata()
                .then(data => {
                    setMetadata(data.data);

                    if (raceToEdit) {
                        setRaceTitle(raceToEdit.roundName || "");
                        setTournamentId(raceToEdit.tournamentId || (data.data?.tournaments?.length > 0 ? data.data.tournaments[0]._id : ""));
                        setLocation(raceToEdit.location || "");
                        setRaceGround(raceToEdit.raceGround || "");
                        setAddress(raceToEdit.address || "");
                        if (raceToEdit.raceDate) {
                            const d = new Date(raceToEdit.raceDate);
                            if (!isNaN(d.getTime())) {
                                setRaceDate(d.toISOString().split('T')[0]);
                                setRaceTime(d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
                            }
                        }
                        setTrackLength(raceToEdit.trackLength || "");
                        setMinimalRidingFees(raceToEdit.minimalRidingFees || "");
                        setMaxParticipants(raceToEdit.maxParticipants || 18);
                        setCreateRaceType(raceToEdit.raceType || (data.data?.eligibilityRules?.length > 0 ? data.data.eligibilityRules[0].raceType : "Stakes"));

                        const owners = raceToEdit.Registration?.filter((r: any) => r.registrationStatus !== 'cancelled').map((r: any) => r.Owner?._id || r.horseOwnerId).filter(Boolean) || [];
                        const referees = raceToEdit.Referee?.filter((r: any) => r.assignmentStatus !== 'cancelled') || [];

                        setSelectedOwners(owners.map((id: any) => typeof id === 'object' ? id._id : id));
                        setSelectedReferees(referees.map((r: any) => typeof r.refereeId === 'object' ? r.refereeId._id : r.refereeId).filter(Boolean));

                        const fees: Record<string, number> = {};
                        referees.forEach((r: any) => {
                            const id = typeof r.refereeId === 'object' ? r.refereeId._id : r.refereeId;
                            if (id && r.fee !== undefined) {
                                fees[id] = r.fee;
                            }
                        });
                        setRefereeFees(fees);
                    } else {
                        if (data.data?.eligibilityRules?.length > 0) {
                            setCreateRaceType(data.data.eligibilityRules[0].raceType);
                        }
                        if (data.data?.tournaments?.length > 0) {
                            setTournamentId(data.data.tournaments[0]._id);
                        }
                    }
                })
                .catch(err => console.error("Failed to load metadata", err))
                .finally(() => setLoading(false));
        } else {
            // Reset when closed
            setMetadata(null);
            setRefereeSearchQuery("");
            setRaceTitle("");
            setLocation("");
            setRaceGround("");
            setAddress("");
            setRaceDate("");
            setRaceTime("09:00");
            setSelectedOwners([]);
            setSelectedReferees([]);
            setRefereeFees({});
            setShowConfirm(false);
            setMinimalRidingFees("");
            setRequireEntranceFees(false);
            setMaxParticipants(18);
            setError(null);
            setShowConfirm(false);
        }
    }, [isOpen]);

    // Auto-fill address and track length when a known location is selected
    useEffect(() => {
        if (location && metadata?.previousRaceTracks) {
            const matchedTrack = metadata.previousRaceTracks.find((t: any) => t.location === location);
            if (matchedTrack) {
                if (matchedTrack.address) setAddress(matchedTrack.address);
                if (matchedTrack.trackLength) setTrackLength(matchedTrack.trackLength);
            }
        }
    }, [location, metadata]);

    const checkEligibility = (horse: any, selectedRaceType: string) => {
        if (!metadata || !metadata.eligibilityRules) return false;

        const rule = metadata.eligibilityRules.find((r: any) => r.raceType === selectedRaceType);
        if (!rule) return false;

        const wins = horse.raceResults ? horse.raceResults.filter((r: any) => r.finishPosition === 1).length : 0;

        if (rule.minWins !== undefined && rule.minWins !== null && wins < rule.minWins) return false;
        if (rule.maxWins !== undefined && rule.maxWins !== null && wins > rule.maxWins) return false;

        const currentYear = new Date().getFullYear();
        const horseAge = horse.dateOfBirth ? (currentYear - new Date(horse.dateOfBirth).getFullYear()) : 0;

        if (rule.minAge !== undefined && rule.minAge !== null && horseAge < rule.minAge) return false;
        if (rule.maxAge !== undefined && rule.maxAge !== null && horseAge > rule.maxAge) return false;

        if (rule.requiredGender && rule.requiredGender !== 'both' && rule.requiredGender !== horse.gender) {
            return false;
        }

        return true;
    };

    const validateAndConfirm = () => {
        setError(null);
        if (!raceTitle || !tournamentId || !raceDate || !trackLength || !location) {
            setError("Please fill in all required fields (Title, Tournament, Date, Track Length, Location).");
            return;
        }

        // Validate Time is between 09:00 and 17:00
        const [hours, minutes] = raceTime.split(':').map(Number);
        const timeInMinutes = hours * 60 + (minutes || 0);
        if (timeInMinutes < 9 * 60 || timeInMinutes > 17 * 60) {
            setError("Race start time must be between 09:00 AM and 05:00 PM.");
            return;
        }

        // Date Validation
        const selectedDate = new Date(`${raceDate}T${raceTime}:00`);
        const now = new Date();
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(now.getDate() + 14);

        if (selectedDate < now) {
            setError("Race date cannot be in the past.");
            return;
        }

        if (selectedDate < twoWeeksFromNow && !raceToEdit) {
            setError("Race date must be at least 14 days from today to allow for preparations.");
            return;
        }

        const rule = metadata?.eligibilityRules?.find((r: any) => r.raceType === createRaceType);
        if (!rule) {
            setError("Invalid race type selected.");
            return;
        }

        setShowConfirm(true);
    };

    const executeCreateRace = async () => {
        setError(null);
        const rule = metadata?.eligibilityRules?.find((r: any) => r.raceType === createRaceType);
        if (!rule) return;

        // Create a local datetime and convert to ISO
        const combinedDateTime = new Date(`${raceDate}T${raceTime}:00`).toISOString();

        const payload = {
            TournamentId: tournamentId,
            RaceRound: {
                roundName: raceTitle,
                raceDate: combinedDateTime,
                trackLength: Number(trackLength),
                maxParticipants: Number(maxParticipants),
                minimalRidingFees: requireEntranceFees ? Number(minimalRidingFees) : 0,
                requireEntranceFees: requireEntranceFees,
                location: location,
                raceGround: raceGround,
                address: address,
                eligibilityRuleId: rule._id,
                status: "scheduled"
            },
            HorseOwnerInvitation: selectedOwners,
            RefereeInvitation: selectedReferees.map(id => {
                const fee = refereeFees[id];
                return fee !== undefined ? { refereeId: id, fee } : { refereeId: id };
            })
        };

        setSubmitLoading(true);
        try {
            if (raceToEdit) {
                await adminService.updateRaceRound(raceToEdit._id, payload);
                if (onSuccess) onSuccess({ type: 'UPDATE', raceRound_id: raceToEdit._id, tournament_id: tournamentId });
            } else {
                await adminService.createRaceRound(payload);
                if (onSuccess) onSuccess({ type: 'CREATE', tournament_id: tournamentId });
            }
            onClose();
        } catch (err: any) {
            console.error("Failed to create race", err);
            setError(`Failed to create race: ${err.message || err.msg || 'Unknown error'}`);
            setShowConfirm(false);
        } finally {
            setSubmitLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-[600px] bg-[#161616] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]">
                    <h2 className="text-[18px] font-bold text-white tracking-tight leading-tight">
                        {showConfirm ? (raceToEdit ? "Confirm Race Update" : "Confirm Race Creation") : (raceToEdit ? "Edit Race Round" : "Create New Race")}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[60vh] custom-scrollbar relative">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#161616]/80 backdrop-blur-sm">
                            <Loader2 className="animate-spin text-red-500" size={32} />
                        </div>
                    )}

                    {!showConfirm ? (
                        <>
                            {/* Form Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Race Title</label>
                                    <input
                                        type="text"
                                        value={raceTitle}
                                        onChange={(e) => setRaceTitle(e.target.value)}
                                        placeholder="e.g. Royal Ascot Gold Cup"
                                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Tournament</label>
                                    <select
                                        value={tournamentId}
                                        onChange={(e) => setTournamentId(e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none"
                                    >
                                        {metadata?.tournaments?.map((t: any) => (
                                            <option key={t._id} value={t._id}>{t.tournamentName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Race Type</label>
                                    <select
                                        value={createRaceType}
                                        onChange={(e) => {
                                            setCreateRaceType(e.target.value);
                                            setSelectedOwners([]);
                                        }}
                                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none"
                                    >
                                        {metadata?.eligibilityRules?.map((rule: any) => (
                                            <option key={rule._id} value={rule.raceType}>{rule.raceType}</option>
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
                                            value={location}
                                            onChange={(e) => {
                                                const loc = e.target.value;
                                                setLocation(loc);
                                                const match = metadata?.previousRaceTracks?.find((t: any) => t.location === loc);
                                                if (match) {
                                                    if (match.raceGround) setRaceGround(match.raceGround);
                                                    if (match.address) setAddress(match.address);
                                                }
                                            }}
                                            placeholder="Select or enter custom..."
                                            className="w-full bg-[#111] border border-white/10 rounded p-2.5 pl-9 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                                        />
                                        <datalist id="tracks-list">
                                            {metadata?.previousRaceTracks?.map((t: any) => <option key={t.location} value={t.location} />)}
                                        </datalist>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Race Ground</label>
                                    <input
                                        type="text"
                                        value={raceGround}
                                        onChange={(e) => setRaceGround(e.target.value)}
                                        placeholder="e.g. Dirt, Turf"
                                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Address</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
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
                                            value={raceDate}
                                            onChange={(e) => setRaceDate(e.target.value)}
                                            className="w-full bg-[#111] border border-white/10 rounded p-2.5 pl-9 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Start Time</label>
                                    <input
                                        type="time"
                                        value={raceTime}
                                        onChange={(e) => setRaceTime(e.target.value)}
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
                                        value={trackLength}
                                        onChange={(e) => setTrackLength(e.target.value ? Number(e.target.value) : "")}
                                        onBlur={() => {
                                            if (typeof trackLength === 'number' && trackLength < 200) {
                                                setTrackLength(200);
                                            }
                                        }}
                                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Max Participants</label>
                                    <input
                                        type="number"
                                        value={maxParticipants}
                                        onChange={(e) => setMaxParticipants(Number(e.target.value))}
                                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Minimal Riding Fees ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 500"
                                        disabled={!requireEntranceFees}
                                        value={minimalRidingFees}
                                        onChange={(e) => setMinimalRidingFees(e.target.value ? Number(e.target.value) : "")}
                                        onBlur={() => {
                                            if (typeof minimalRidingFees === 'number' && minimalRidingFees < 0) {
                                                setMinimalRidingFees(0);
                                            }
                                        }}
                                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-3 p-2.5 cursor-pointer group hover:bg-white/5 rounded border border-transparent hover:border-white/10 transition-colors h-[42px]">
                                        <input
                                            type="checkbox"
                                            checked={requireEntranceFees}
                                            onChange={(e) => {
                                                setRequireEntranceFees(e.target.checked);
                                                if (!e.target.checked) {
                                                    setMinimalRidingFees(0);
                                                }
                                            }}
                                            className="w-4 h-4 accent-red-600 rounded bg-black border-white/20 cursor-pointer"
                                        />
                                        <span className="text-[13px] font-semibold text-white group-hover:text-red-400 transition-colors">Require Entrance Fees</span>
                                    </label>
                                </div>
                            </div>

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
                                                    checked={selectedOwners.includes(String(ownerId))}
                                                    onChange={(e) => {
                                                        const id = String(ownerId);
                                                        if (e.target.checked) {
                                                            setSelectedOwners([...selectedOwners, id]);
                                                        } else {
                                                            setSelectedOwners(selectedOwners.filter(sid => sid !== id));
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
                                            value={refereeSearchQuery}
                                            onChange={(e) => setRefereeSearchQuery(e.target.value)}
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded py-1.5 pl-9 pr-3 text-[12px] text-white focus:outline-none focus:border-red-500/50"
                                        />
                                    </div>
                                    <div className="max-h-[120px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
                                        {metadata?.referees?.filter((r: any) => (r._id?.fullName || "").toLowerCase().includes(refereeSearchQuery.toLowerCase())).map((referee: any) => {
                                            const refereeId = referee._id?._id ?? referee._id;
                                            const refName = referee._id?.fullName ?? 'Unknown Referee';
                                            return (
                                                <label key={String(refereeId)} className="flex items-center gap-3 p-2 cursor-pointer group hover:bg-white/5 rounded transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedReferees.includes(String(refereeId))}
                                                        onChange={(e) => {
                                                            const id = String(refereeId);
                                                            if (e.target.checked) {
                                                                setSelectedReferees([...selectedReferees, id]);
                                                            } else {
                                                                setSelectedReferees(selectedReferees.filter(sid => sid !== id));
                                                            }
                                                        }}
                                                        className="w-3.5 h-3.5 accent-red-600 rounded bg-black border-white/20"
                                                    />
                                                    <div className="flex flex-col flex-1">
                                                        <span className="text-[13px] font-semibold text-white group-hover:text-red-400 transition-colors">{refName}</span>
                                                        <span className="text-[11px] text-gray-500">Active</span>
                                                    </div>
                                                    {selectedReferees.includes(String(refereeId)) && (
                                                        <input
                                                            type="number"
                                                            placeholder="Fee"
                                                            value={refereeFees[String(refereeId)] ?? ""}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => {
                                                                const val = e.target.value ? Number(e.target.value) : undefined;
                                                                setRefereeFees(prev => {
                                                                    const next = { ...prev };
                                                                    if (val !== undefined) next[String(refereeId)] = val;
                                                                    else delete next[String(refereeId)];
                                                                    return next;
                                                                });
                                                            }}
                                                            className="w-20 bg-[#111] border border-white/10 rounded px-2 py-1 text-[12px] text-white focus:outline-none focus:border-red-500/50"
                                                        />
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col gap-4 text-white">
                            <div className="p-4 bg-[#111] border border-white/10 rounded">
                                <h3 className="text-[14px] font-semibold mb-4 text-gray-300">Race Summary</h3>
                                <div className="grid grid-cols-2 gap-y-3 text-[13px]">
                                    <div className="text-gray-500">Title</div>
                                    <div className="font-medium">{raceTitle}</div>

                                    <div className="text-gray-500">Tournament</div>
                                    <div className="font-medium">
                                        {metadata?.tournaments?.find((t: any) => t._id === tournamentId)?.tournamentName || "Unknown"}
                                    </div>

                                    <div className="text-gray-500">Date & Time</div>
                                    <div className="font-medium">{raceDate} at {raceTime}</div>

                                    <div className="text-gray-500">Track & Ground</div>
                                    <div className="font-medium">{location} ({raceGround || "N/A"})</div>

                                    <div className="text-gray-500">Track Length</div>
                                    <div className="font-medium">{trackLength}m</div>

                                    <div className="text-gray-500">Race Type</div>
                                    <div className="font-medium">{createRaceType}</div>

                                    <div className="text-gray-500">Owners Invited</div>
                                    <div className="font-medium">{selectedOwners.length}</div>

                                    <div className="text-gray-500">Referees Invited</div>
                                    <div className="font-medium">{selectedReferees.length}</div>
                                </div>
                            </div>
                            <div className="text-[12px] text-gray-400">
                                Please review the details above. Click Confirm to {raceToEdit ? "save changes" : "create the race round"}.
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-950/50 border border-red-500/50 rounded flex items-start gap-2 text-[13px] text-red-200">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-[#1a1a1a]">
                    {showConfirm ? (
                        <>
                            <button onClick={() => setShowConfirm(false)} className="px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-white/5 rounded transition-colors" disabled={submitLoading}>
                                Back
                            </button>
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold py-2.5 px-6 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                onClick={executeCreateRace}
                                disabled={submitLoading}
                            >
                                {submitLoading ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    raceToEdit ? "Confirm & Save Changes" : "Confirm & Create"
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={onClose} className="px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-white/5 rounded transition-colors" disabled={submitLoading}>
                                Cancel
                            </button>
                            <button
                                className="bg-white hover:bg-gray-200 text-black text-[13px] font-semibold py-2.5 px-6 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                onClick={validateAndConfirm}
                                disabled={submitLoading}
                            >
                                Review
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
