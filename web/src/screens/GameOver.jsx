import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Crown, LogOut, RotateCcw } from "lucide-react";
import { Screen, Brand, Button, Avatar } from "../components/ui.jsx";

const BAR_COLORS = ["#a78bfa", "#f0abfc", "#38bdf8", "#34d399", "#fbbf24", "#fb7185"];

// GameOver shows the final leaderboard with the winner highlighted and a chart
// of everyone's totals. The host can play again (starts another round in the
// same room; running totals carry over) and anyone can leave.
export default function GameOver({ state, myId, isHost, nextRound, onLeave }) {
  const ranked = useMemo(
    () =>
      [...(state.players || [])].sort(
        (a, b) => b.score - a.score || a.name.localeCompare(b.name)
      ),
    [state.players]
  );

  const winner = ranked[0];
  const topScore = winner?.score ?? 0;
  const chartData = ranked.map((p) => ({ name: p.name, score: p.score }));

  return (
    <Screen>
      <div className="mb-4 text-center">
        <Brand small />
        <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-slate-500">
          Final results · {state.round} rounds
        </p>
      </div>

      {winner && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-5 rounded-3xl bg-gradient-to-br from-amber-500/20 to-fuchsia-600/10 p-6 text-center ring-1 ring-amber-500/30"
        >
          <Crown className="mx-auto mb-2 h-10 w-10 text-amber-400" />
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-300">
            Most kindred
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <Avatar name={winner.name} id={winner.id} size="lg" />
            <div className="text-left">
              <p className="text-2xl font-black">{winner.name}</p>
              <p className="text-sm text-amber-200">{winner.score} points</p>
            </div>
          </div>
        </motion.div>
      )}

      {chartData.length > 0 && (
        <div className="mb-5 h-40 w-full rounded-3xl bg-slate-900 p-3 ring-1 ring-slate-800">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
            >
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis
                type="category"
                dataKey="name"
                width={70}
                tick={{ fill: "#cbd5e1", fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Bar dataKey="score" radius={[0, 8, 8, 0]} label={{ fill: "#e2e8f0", fontSize: 12 }}>
                {chartData.map((entry, i) => (
                  <Cell key={entry.name} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex-1">
        <ul className="flex flex-col gap-2">
          {ranked.map((p, i) => {
            const isWinner = p.score === topScore && topScore > 0;
            return (
              <li
                key={p.id}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 ${
                  isWinner
                    ? "bg-amber-500/10 ring-amber-500/30"
                    : "bg-slate-900 ring-slate-800"
                }`}
              >
                <span className="w-5 text-center text-sm font-black text-slate-500">
                  {i + 1}
                </span>
                <Avatar name={p.name} id={p.id} size="sm" />
                <span className="flex-1 truncate font-semibold">
                  {p.name}
                  {p.id === myId && <span className="text-slate-500"> (you)</span>}
                </span>
                <span className="text-lg font-black text-violet-300">
                  {p.score}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {isHost && (
          <Button onClick={nextRound}>
            <RotateCcw className="h-5 w-5" /> Play Again
          </Button>
        )}
        <Button variant="ghost" onClick={onLeave}>
          <LogOut className="h-5 w-5" /> Leave Room
        </Button>
      </div>
    </Screen>
  );
}
