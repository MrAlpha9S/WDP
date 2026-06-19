import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { adminService } from "../../../api/adminService";
import CreateRaceBasicInfo from "../AdminComponents/CreateRaceBasicInfo";
import CreateRacePrizes from "../AdminComponents/CreateRacePrizes";
import CreateRaceParticipants from "../AdminComponents/CreateRaceParticipants";
import CreateRaceSummary from "../AdminComponents/CreateRaceSummary";

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
    const [firstPlacePrize, setFirstPlacePrize] = useState<number | "">("");
    const [secondPlacePrize, setSecondPlacePrize] = useState<number | "">("");
    const [thirdPlacePrize, setThirdPlacePrize] = useState<number | "">("");
    const [currencyType, setCurrencyType] = useState<string>("USD");
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
                        setFirstPlacePrize(raceToEdit.firstPlacePrize ?? "");
                        setSecondPlacePrize(raceToEdit.secondPlacePrize ?? "");
                        setThirdPlacePrize(raceToEdit.thirdPlacePrize ?? "");
                        setCurrencyType(raceToEdit.currencyType ?? "USD");
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
            setFirstPlacePrize("");
            setSecondPlacePrize("");
            setThirdPlacePrize("");
            setCurrencyType("USD");
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

        const selectedTournament = metadata?.tournaments?.find((t: any) => t._id === tournamentId);
        if (selectedTournament) {
            if (selectedTournament.startDate) {
                const tStart = new Date(selectedTournament.startDate);
                tStart.setHours(0, 0, 0, 0);
                if (selectedDate < tStart) {
                    setError(`Race date cannot be earlier than tournament start date (${tStart.toLocaleDateString()}).`);
                    return;
                }
            }
            if (selectedTournament.endDate) {
                const tEnd = new Date(selectedTournament.endDate);
                tEnd.setHours(23, 59, 59, 999);
                if (selectedDate > tEnd) {
                    setError(`Race date cannot be later than tournament end date (${tEnd.toLocaleDateString()}).`);
                    return;
                }
            }
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
                firstPlacePrize: firstPlacePrize ? Number(firstPlacePrize) : 0,
                secondPlacePrize: secondPlacePrize ? Number(secondPlacePrize) : 0,
                thirdPlacePrize: thirdPlacePrize ? Number(thirdPlacePrize) : 0,
                currencyType: currencyType,
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

    const selectedTournamentUI = metadata?.tournaments?.find((t: any) => t._id === tournamentId);
    let minDateUI: string | undefined = undefined;
    let maxDateUI: string | undefined = undefined;

    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(new Date().getDate() + 14);
    const twoWeeksStr = twoWeeksFromNow.toISOString().split('T')[0];

    if (!raceToEdit) {
        minDateUI = twoWeeksStr;
    }
    
    if (selectedTournamentUI) {
        if (selectedTournamentUI.startDate) {
            const tournamentStartStr = new Date(selectedTournamentUI.startDate).toISOString().split('T')[0];
            if (!minDateUI || tournamentStartStr > minDateUI) {
                minDateUI = tournamentStartStr;
            }
        }
        if (selectedTournamentUI.endDate) {
            maxDateUI = new Date(selectedTournamentUI.endDate).toISOString().split('T')[0];
        }
    }

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
                            <CreateRaceBasicInfo
                                raceTitle={raceTitle}
                                setRaceTitle={setRaceTitle}
                                tournamentId={tournamentId}
                                setTournamentId={setTournamentId}
                                metadata={metadata}
                                createRaceType={createRaceType}
                                setCreateRaceType={setCreateRaceType}
                                setSelectedOwners={setSelectedOwners}
                                location={location}
                                setLocation={setLocation}
                                raceGround={raceGround}
                                setRaceGround={setRaceGround}
                                address={address}
                                setAddress={setAddress}
                                raceDate={raceDate}
                                setRaceDate={setRaceDate}
                                minDateUI={minDateUI}
                                maxDateUI={maxDateUI}
                                raceTime={raceTime}
                                setRaceTime={setRaceTime}
                                trackLength={trackLength}
                                setTrackLength={setTrackLength}
                                maxParticipants={maxParticipants}
                                setMaxParticipants={setMaxParticipants}
                            />

                            <CreateRacePrizes
                                requireEntranceFees={requireEntranceFees}
                                setRequireEntranceFees={setRequireEntranceFees}
                                minimalRidingFees={minimalRidingFees}
                                setMinimalRidingFees={setMinimalRidingFees}
                                currencyType={currencyType}
                                setCurrencyType={setCurrencyType}
                                firstPlacePrize={firstPlacePrize}
                                setFirstPlacePrize={setFirstPlacePrize}
                                secondPlacePrize={secondPlacePrize}
                                setSecondPlacePrize={setSecondPlacePrize}
                                thirdPlacePrize={thirdPlacePrize}
                                setThirdPlacePrize={setThirdPlacePrize}
                            />

                            <CreateRaceParticipants
                                metadata={metadata}
                                createRaceType={createRaceType}
                                selectedOwners={selectedOwners}
                                setSelectedOwners={setSelectedOwners}
                                checkEligibility={checkEligibility}
                                refereeSearchQuery={refereeSearchQuery}
                                setRefereeSearchQuery={setRefereeSearchQuery}
                                selectedReferees={selectedReferees}
                                setSelectedReferees={setSelectedReferees}
                                refereeFees={refereeFees}
                                setRefereeFees={setRefereeFees}
                            />
                        </>
                    ) : (
                        <CreateRaceSummary
                            raceTitle={raceTitle}
                            tournamentId={tournamentId}
                            metadata={metadata}
                            raceDate={raceDate}
                            raceTime={raceTime}
                            location={location}
                            raceGround={raceGround}
                            trackLength={trackLength}
                            createRaceType={createRaceType}
                            currencyType={currencyType}
                            firstPlacePrize={firstPlacePrize}
                            secondPlacePrize={secondPlacePrize}
                            thirdPlacePrize={thirdPlacePrize}
                            selectedOwners={selectedOwners}
                            selectedReferees={selectedReferees}
                            raceToEdit={raceToEdit}
                        />
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
