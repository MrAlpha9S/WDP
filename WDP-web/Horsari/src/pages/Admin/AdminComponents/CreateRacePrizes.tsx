interface PrizesProps {
    requireEntranceFees: boolean;
    setRequireEntranceFees: (v: boolean) => void;
    minimalRidingFees: number | "";
    setMinimalRidingFees: (v: number | "") => void;
    currencyType: string;
    setCurrencyType: (v: string) => void;
    firstPlacePrize: number | "";
    setFirstPlacePrize: (v: number | "") => void;
    secondPlacePrize: number | "";
    setSecondPlacePrize: (v: number | "") => void;
    thirdPlacePrize: number | "";
    setThirdPlacePrize: (v: number | "") => void;
}

export default function CreateRacePrizes(props: PrizesProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Minimal Riding Fees</label>
                    <input
                        type="number"
                        min="0"
                        placeholder="e.g. 500"
                        disabled={!props.requireEntranceFees}
                        value={props.minimalRidingFees}
                        onChange={(e) => props.setMinimalRidingFees(e.target.value ? Number(e.target.value) : "")}
                        onBlur={() => {
                            if (typeof props.minimalRidingFees === 'number' && props.minimalRidingFees < 0) {
                                props.setMinimalRidingFees(0);
                            }
                        }}
                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
                <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-3 p-2.5 cursor-pointer group hover:bg-white/5 rounded border border-transparent hover:border-white/10 transition-colors h-[42px]">
                        <input
                            type="checkbox"
                            checked={props.requireEntranceFees}
                            onChange={(e) => {
                                props.setRequireEntranceFees(e.target.checked);
                                if (!e.target.checked) {
                                    props.setMinimalRidingFees(0);
                                }
                            }}
                            className="w-4 h-4 accent-red-600 rounded bg-black border-white/20 cursor-pointer"
                        />
                        <span className="text-[13px] font-semibold text-white group-hover:text-red-400 transition-colors">Require Entrance Fees</span>
                    </label>
                </div>
            </div>

            <div className="p-4 bg-[#111] border border-white/10 rounded flex flex-col gap-4">
                <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest">Prize Pool Distribution</label>
                
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4 bg-[#1a1a1a] border border-white/10 rounded p-2.5">
                        <label className="text-[12px] font-medium text-gray-400 w-24">Currency</label>
                        <select
                            value={props.currencyType}
                            onChange={(e) => props.setCurrencyType(e.target.value)}
                            className="flex-1 bg-transparent text-[13px] text-white focus:outline-none appearance-none"
                        >
                            <option className="bg-[#1a1a1a] text-white" value="USD">USD ($)</option>
                            <option className="bg-[#1a1a1a] text-white" value="EUR">EUR (€)</option>
                            <option className="bg-[#1a1a1a] text-white" value="GBP">GBP (£)</option>
                            <option className="bg-[#1a1a1a] text-white" value="AUD">AUD ($)</option>
                            <option className="bg-[#1a1a1a] text-white" value="JPY">JPY (¥)</option>
                            <option className="bg-[#1a1a1a] text-white" value="VND">VND (₫)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-4 bg-[#1a1a1a] border border-white/10 rounded p-2.5 focus-within:border-red-500/50">
                        <label className="text-[12px] font-medium text-gray-400 w-24">1st Place</label>
                        <input
                            type="number"
                            min="0"
                            value={props.firstPlacePrize}
                            onChange={(e) => props.setFirstPlacePrize(e.target.value ? Number(e.target.value) : "")}
                            className="flex-1 bg-transparent text-[13px] text-white focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-4 bg-[#1a1a1a] border border-white/10 rounded p-2.5 focus-within:border-red-500/50">
                        <label className="text-[12px] font-medium text-gray-400 w-24">2nd Place</label>
                        <input
                            type="number"
                            min="0"
                            value={props.secondPlacePrize}
                            onChange={(e) => props.setSecondPlacePrize(e.target.value ? Number(e.target.value) : "")}
                            className="flex-1 bg-transparent text-[13px] text-white focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-4 bg-[#1a1a1a] border border-white/10 rounded p-2.5 focus-within:border-red-500/50">
                        <label className="text-[12px] font-medium text-gray-400 w-24">3rd Place</label>
                        <input
                            type="number"
                            min="0"
                            value={props.thirdPlacePrize}
                            onChange={(e) => props.setThirdPlacePrize(e.target.value ? Number(e.target.value) : "")}
                            className="flex-1 bg-transparent text-[13px] text-white focus:outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
