import {BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer} from 'recharts';
import "../css/ScoreGraph.css";

function ScoreGraph({
    title,
    data,
    height = 250,
    onOpen,
    showTip = false,
}) {
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
                <BarChart data={data}>
                    <XAxis dataKey="score" />
                    <YAxis domain={[0, 100]}  allowDecimals={false} />
                    {showTip && <Tooltip />}
                    <Bar dataKey="students" fill="#aaa6ff" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default ScoreGraph;
