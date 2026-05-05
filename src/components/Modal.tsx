import type { Analysis } from "./dashboard";
import { useRef } from "react";
import { toPng } from "html-to-image";
import { FaTimes } from "react-icons/fa";
import { Doughnut } from "react-chartjs-2";
import { FiDownload } from "react-icons/fi";
import posthog from "posthog-js";

export default function Modal({ setModal, analysis }: { setModal: (modal: Boolean) => void, analysis: Analysis }) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!cardRef.current) return;

        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                style: {
                    transform: "none",
                }, // higher quality
            });

            const link = document.createElement("a");
            link.download = "summary.png";
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Download failed:", err);
        }
    }
    return (
        <section className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 w-full h-full bg-[#301014]/80 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setModal(false)}
            ></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="">
                    <div id="summaryreport" ref={cardRef} className="bg-[#51291E] max-w-[410px] md:min-w-[480px] md:max-w-[100vw] py-8 px-6  md:px-12 md:py-12 rounded-3xl shadow-2xl shadow-[#000000]/40 border border-[#EDF4ED]/10 text-[#EDF4ED] animate-[modalIn_0.25s_ease-out]">

                        {/* Top row */}
                        <div className="flex justify-around gap-6 items-baseline pb-7 mb-7 border-b border-[#EDF4ED]/15">
                            <div className="flex gap-2">
                                <span className="text-xl md:text-3xl font-bold text-[#79B791] tracking-wide max-w-[150px] md:max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap inline-block">{analysis.users[0]}</span>
                                <span className="text-[#ABD1B5]/60 mx-3 text-lg">×</span>
                                <span className="text-xl md:text-3xl font-bold text-[#79B791] tracking-wide max-w-[150px] md:max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap inline-block">{analysis.users[1]}</span>
                            </div>
                            <div className="flex flex-col md:flex-row items-baseline gap-2">
                                <span className="text-xl md:text-4xl font-extrabold text-[#EDF4ED]">{analysis.total_length}</span>
                                <span className="text-sm font-medium text-[#ABD1B5]/70 uppercase tracking-widest">msgs</span>
                            </div>
                        </div>

                        {/* bottom part with image */}
                        {(() => {
                            const score = analysis.final_score ?? 0;
                            const scoreColor = score <= 35 ? "#E8665D" : "#79B791";
                            const scoreBg = score <= 35 ? "rgba(232,102,93,0.12)" : "rgba(121,183,145,0.12)";
                            const scoreBorder = score <= 35 ? "rgba(232,102,93,0.3)" : "rgba(121,183,145,0.3)";
                            return (
                                <>
                                    <div className="flex flex-row items-center gap-10">
                                        <div className="flex flex-col gap-5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm md:text-lg font-medium text-[#ABD1B5]">Longest Streak</span>
                                                <span className="text-[#ABD1B5]/30">·</span>
                                                <span className="flex gap-1 text-sm md:text-xl font-bold text-[#79B791]"> <span className="text-[#ABD1B5] italic">{analysis.longest_streak["count"]}</span>  days</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm md:text-lg font-medium text-[#ABD1B5]">Average Messages</span>
                                                <span className="text-[#ABD1B5]/30">·</span>
                                                <span className="flex gap-1 text-sm md:text-xl font-bold text-[#79B791]"> <span className="text-[#ABD1B5] italic">{Math.round(analysis.average_messages_per_day)}</span> msgs</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm md:text-lg font-medium text-[#ABD1B5]">Most Active Day</span>
                                                <span className="text-[#ABD1B5]/30">·</span>
                                                <span className="flex gap-1 text-sm md:text-xl font-bold text-[#79B791]"> <span className="text-[#ABD1B5] italic">{analysis.message_stats.max_messages}</span> msgs</span>
                                            </div>
                                        </div>
                                        <div className="ml-auto relative w-20 h-20 md:w-28 md:h-28">
                                            <Doughnut
                                                data={{
                                                    labels: [],
                                                    datasets: [{
                                                        data: [score, 100 - Math.min(score, 100)],
                                                        backgroundColor: [scoreColor, "#3a1a1e"],
                                                        borderWidth: 0,
                                                        cutout: "75%",
                                                    } as any],
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: true,
                                                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                                    animation: false,
                                                }}
                                            />
                                            <span className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-lg md:text-2xl font-extrabold" style={{ color: scoreColor }}>{Math.round(score)}</span>
                                                <span className="text-[#ABD1B5] text-[8px] md:text-[10px]">/ 100</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Relationship Status */}
                                    <div className="flex flex-col items-center gap-1.5 pt-7 mt-7 border-t border-[#EDF4ED]/15">

                                        <div
                                            className="px-6 py-2.5 rounded-2xl text-base md:text-lg font-bold tracking-wide border-2"
                                            style={{
                                                color: scoreColor,
                                                backgroundColor: scoreBg,
                                                borderColor: scoreBorder,
                                                boxShadow: `0 0 16px ${scoreBg}, 0 0 32px ${score <= 35 ? "rgba(232,102,93,0.06)" : "rgba(121,183,145,0.06)"}`,
                                            }}
                                        >
                                            {analysis.relationship_status}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}

                    </div>
                    <div className="flex gap-2 justify-around mt-18">
                        <button
                            onClick={() => {
                                posthog.capture("dashboard_export_clicked")
                                handleDownload()
                            }}
                            className=" flex gap-1 items-center bg-[#51291E]  px-6 py-3  text-white rounded-xl font-semibold hover:bg-[#51291E]/90 transition-colors"
                        >
                            <FiDownload className="text-xl md:text-3xl text-[#79B791]" />
                            <span className="text-sm md:text-2xl">Download</span>
                        </button>
                        <a href="https://x.com/waynethefuture/status/2051678947994177665"></a>
                        <button
                            onClick={() => {
                                posthog.capture("dashboard_X_quote_clicked")
                                setModal(false)
                            }}
                            className=" flex gap-1 items-center bg-[#51291E]  px-6 py-3  text-white rounded-xl font-semibold hover:bg-[#51291E]/90 transition-colors"
                        >
                            <FaTimes className="text-xl md:text-3xl text-[#79B791]" />
                            <span className="text-sm md:text-2xl">
                                Quote
                            </span>
                        </button>
                    </div>
                </div>

            </div>
        </section>
    )
}