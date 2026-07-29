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
    const [createRaceType, setCreateRaceType] = useState<string>("");
    const [refereeSearchQuery, setRefereeSearchQuery] = useState("");

    // Form States
    const [trackLength, setTrackLength] = useState<number | "">("");
    const [maxParticipants, setMaxParticipants] = useState<number>(18);
    const [housingFeePercentage, setHousingFeePercentage] = useState<number | "">("");
    const [firstPlacePrize, setFirstPlacePrize] = useState<number | "">("");
    const [secondPlacePrize, setSecondPlacePrize] = useState<number | "">("");
    const [thirdPlacePrize, setThirdPlacePrize] = useState<number | "">("");
    const [currencyType, setCurrencyType] = useState<string>("VND");
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
    const [overrideScheduleConflict, setOverrideScheduleConflict] = useState(false);

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
                        setMaxParticipants(raceToEdit.maxParticipants || 18);
                        setHousingFeePercentage(raceToEdit.housingFeePercentage != null ? raceToEdit.housingFeePercentage * 100 : "");
                        setFirstPlacePrize(raceToEdit.firstPlacePrize ?? "");
                        setSecondPlacePrize(raceToEdit.secondPlacePrize ?? "");
                        setThirdPlacePrize(raceToEdit.thirdPlacePrize ?? "");
                        setCurrencyType(raceToEdit.currencyType ?? "VND");
                        // Match the saved raceType string back to a rule _id
                        const matchedRule = data.data?.eligibilityRules?.find((r: any) => r.raceType === raceToEdit.raceType);
                        setCreateRaceType(matchedRule?._id || (data.data?.eligibilityRules?.length > 0 ? data.data.eligibilityRules[0]._id : ""));

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
                            setCreateRaceType(data.data.eligibilityRules[0]._id);
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
            setMaxParticipants(18);
            setHousingFeePercentage("");
            setFirstPlacePrize("");
            setSecondPlacePrize("");
            setThirdPlacePrize("");
            setCurrencyType("VND");
            setError(null);
            setShowConfirm(false);
            setOverrideScheduleConflict(false);
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

    // selectedRuleId is the rule._id (matches the selector value)
    // Backend schema fields: minRacesWon, minRacesRun, minAge, maxAge, requiredGender, requiredBreed
    const checkEligibility = (horse: any, selectedRuleId: string) => {
        if (!metadata || !metadata.eligibilityRules) return true;

        // Use String() coercion to safely compare ObjectId vs string
        const rule = metadata.eligibilityRules.find((r: any) => String(r._id) === String(selectedRuleId));
        if (!rule) return true;
        if (horse.status !== 'active' || horse.healthStatus !== 'healthy') return false;

        const wins = horse.raceResults ? horse.raceResults.filter((r: any) => r.finishPosition === 1).length : 0;
        const racesRun = horse.raceResults ? horse.raceResults.length : 0;

        // minRacesWon — replaces the old (wrong) minWins/maxWins field names
        if (rule.minRacesWon !== undefined && rule.minRacesWon !== null && wins < rule.minRacesWon) return false;
        // minRacesRun
        if (rule.minRacesRun !== undefined && rule.minRacesRun !== null && racesRun < rule.minRacesRun) return false;

        const currentYear = new Date().getFullYear();
        const horseAge = horse.dateOfBirth ? (currentYear - new Date(horse.dateOfBirth).getFullYear()) : 0;

        if (rule.minAge !== undefined && rule.minAge !== null && horseAge < rule.minAge) return false;
        if (rule.maxAge !== undefined && rule.maxAge !== null && horseAge > rule.maxAge) return false;

        if (rule.requiredGender && rule.requiredGender !== 'both' && rule.requiredGender !== horse.gender) {
            return false;
        }

        if (rule.requiredBreed && rule.requiredBreed !== horse.breed) {
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

        if (selectedDate < twoWeeksFromNow && !raceToEdit && !overrideScheduleConflict) {
            setError("Race date must be at least 14 days from today to allow for preparations.");
            return;
        }

        const selectedTournament = metadata?.tournaments?.find((t: any) => t._id === tournamentId);
        if (selectedTournament && !overrideScheduleConflict) {
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

        const rule = metadata?.eligibilityRules?.find((r: any) => r._id === createRaceType);
        if (!rule) {
            setError("Invalid race type selected.");
            return;
        }

        setShowConfirm(true);
    };

    const executeCreateRace = async () => {
        setError(null);
        const rule = metadata?.eligibilityRules?.find((r: any) => r._id === createRaceType);
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
                baseFee: 0,
                housingFeePercentage: housingFeePercentage ? Number(housingFeePercentage) / 100 : undefined,
                requireEntranceFees: false,
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
            }),
            overrideScheduleConflict,
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
            const message: string = err.message || err.msg || 'Unknown error';
            setError(`Failed to create race: ${message}`);
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

    if (!raceToEdit && !overrideScheduleConflict) {
        minDateUI = twoWeeksStr;
    }

    if (selectedTournamentUI) {
        if (selectedTournamentUI.startDate && !overrideScheduleConflict) {
            const tournamentStartStr = new Date(selectedTournamentUI.startDate).toISOString().split('T')[0];
            if (!minDateUI || tournamentStartStr > minDateUI) {
                minDateUI = tournamentStartStr;
            }
        }
        if (selectedTournamentUI.endDate && !overrideScheduleConflict) {
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
                                housingFeePercentage={housingFeePercentage}
                                setHousingFeePercentage={setHousingFeePercentage}
                            />

                            <label className="flex items-center gap-2 text-[11.5px] text-gray-500 cursor-pointer -mt-1">
                                <input
                                    type="checkbox"
                                    checked={overrideScheduleConflict}
                                    onChange={(e) => setOverrideScheduleConflict(e.target.checked)}
                                    className="accent-amber-500"
                                />
                                <span>Override scheduling restrictions (same-day, &lt;2-week lead time, 90-min location conflicts)</span>
                            </label>

                            <CreateRacePrizes
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
