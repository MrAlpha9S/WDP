import { formatWithDots, parseDottedNumber } from "../../../utils/numberFormat";

interface PrizesProps {
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
                            <option className="bg-[#1a1a1a] text-white" value="VND">VND (₫)</option>
                            <option className="bg-[#1a1a1a] text-white" value="USD">USD ($)</option>
                            <option className="bg-[#1a1a1a] text-white" value="EUR">EUR (€)</option>
                            <option className="bg-[#1a1a1a] text-white" value="GBP">GBP (£)</option>
                            <option className="bg-[#1a1a1a] text-white" value="AUD">AUD ($)</option>
                            <option className="bg-[#1a1a1a] text-white" value="JPY">JPY (¥)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-4 bg-[#1a1a1a] border border-white/10 rounded p-2.5 focus-within:border-red-500/50">
                        <label className="text-[12px] font-medium text-gray-400 w-24">1st Place</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={formatWithDots(props.firstPlacePrize)}
                            onChange={(e) => props.setFirstPlacePrize(parseDottedNumber(e.target.value))}
                            className="flex-1 bg-transparent text-[13px] text-white focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-4 bg-[#1a1a1a] border border-white/10 rounded p-2.5 focus-within:border-red-500/50">
                        <label className="text-[12px] font-medium text-gray-400 w-24">2nd Place</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={formatWithDots(props.secondPlacePrize)}
                            onChange={(e) => props.setSecondPlacePrize(parseDottedNumber(e.target.value))}
                            className="flex-1 bg-transparent text-[13px] text-white focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-4 bg-[#1a1a1a] border border-white/10 rounded p-2.5 focus-within:border-red-500/50">
                        <label className="text-[12px] font-medium text-gray-400 w-24">3rd Place</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={formatWithDots(props.thirdPlacePrize)}
                            onChange={(e) => props.setThirdPlacePrize(parseDottedNumber(e.target.value))}
                            className="flex-1 bg-transparent text-[13px] text-white focus:outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
