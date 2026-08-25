import {BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer} from 'recharts';
import "../css/ScoreGraph.css";

function ScoreGraph({
    title,
    data,
    height = 250,
    onOpen,
    showTip = false,
}) {
    const top = Math.max(
        50,
        ...(data ?? []).map((item) => Number(item.students) || 0)
    );
    const ticks = top === 50
        ? [0, 10, 20, 30, 40, 50]
        : [0, 0.25, 0.5, 0.75, 1].map((value) =>
            Math.round(top * value)
        );

    return (
        <div
            className={`scoregraph${onOpen ? " scoregraphclick" : ""}`}
            onClick={onOpen}
            onKeyDown={(event) => {
                if (onOpen && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onOpen();
                }
            }}
            role={onOpen ? "button" : undefined}
            tabIndex={onOpen ? 0 : undefined}
        >
            <h3>{title}</h3>

            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={data}
                    margin={{top: 0, right: 10, bottom: 10, left: 12}}
                >
                    <XAxis
                        dataKey="score"
                        height={42}
                        label={{
                            value: "Scores",
                            position: "insideBottom",
                            offset: 0,
                            style: {
                                fill: "#00bf6f",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                            },
                        }}
                    />
                    <YAxis
                        width={68}
                        domain={[0, top]}
                        ticks={ticks}
                        allowDecimals={false}
                        label={{
                            value: "No. of Students",
                            angle: -90,
                            position: "insideLeft",
                            style: {
                                fill: "#00bf6f",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                textAnchor: "middle",
                            },
                        }}
                    />
                    {showTip && <Tooltip />}
                    <Bar dataKey="students" fill="#aaa6ff" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default ScoreGraph;
