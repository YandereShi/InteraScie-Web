import {BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer} from 'recharts';
import "../css/ScoreGraph.css";

function ScoreGraph({title, data}) {
    return (
        <div className="scoregraph">
            <h3>{title}</h3>

            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data}>
                    <XAxis dataKey="score" />
                    <YAxis domain={[0, 100]}  allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="students" fill="#aaa6ff" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default ScoreGraph;