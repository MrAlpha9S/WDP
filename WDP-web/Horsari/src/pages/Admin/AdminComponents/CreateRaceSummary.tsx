interface SummaryProps {
    raceTitle: string;
    tournamentId: string;
    metadata: any;
    raceDate: string;
    raceTime: string;
    location: string;
    raceGround: string;
    trackLength: number | "";
    createRaceType: string;
    currencyType: string;
    firstPlacePrize: number | "";
    secondPlacePrize: number | "";
    thirdPlacePrize: number | "";
    selectedOwners: string[];
    selectedReferees: string[];
    raceToEdit: any;
}

export default function CreateRaceSummary(props: SummaryProps) {
    const { metadata } = props;

    return (
        <div className="flex flex-col gap-4 text-white">
            <div className="p-4 bg-[#111] border border-white/10 rounded">
                <h3 className="text-[14px] font-semibold mb-4 text-gray-300">Race Summary</h3>
                <div className="grid grid-cols-2 gap-y-3 text-[13px]">
                    <div className="text-gray-500">Title</div>
                    <div className="font-medium">{props.raceTitle}</div>

                    <div className="text-gray-500">Tournament</div>
                    <div className="font-medium">
                        {metadata?.tournaments?.find((t: any) => t._id === props.tournamentId)?.tournamentName || "Unknown"}
                    </div>

                    <div className="text-gray-500">Date & Time</div>
                    <div className="font-medium">{props.raceDate} at {props.raceTime}</div>

                    <div className="text-gray-500">Track & Ground</div>
                    <div className="font-medium">{props.location} ({props.raceGround || "N/A"})</div>

                    <div className="text-gray-500">Track Length</div>
                    <div className="font-medium">{props.trackLength}m</div>

                    <div className="text-gray-500">Race Type</div>
                    <div className="font-medium">{props.createRaceType}</div>

                    <div className="text-gray-500">Prize Pool</div>
                    <div className="font-medium text-[#f3b2a5]">{props.currencyType} {props.firstPlacePrize || 0} / {props.secondPlacePrize || 0} / {props.thirdPlacePrize || 0}</div>

                    <div className="text-gray-500">Owners Invited</div>
                    <div className="font-medium">{props.selectedOwners.length}</div>

                    <div className="text-gray-500">Referees Invited</div>
                    <div className="font-medium">{props.selectedReferees.length}</div>
                </div>
            </div>
            <div className="text-[12px] text-gray-400">
                Please review the details above. Click Confirm to {props.raceToEdit ? "save changes" : "create the race round"}.
            </div>
        </div>
    );
}
