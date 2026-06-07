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

const CHART_COLORS = 6;

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
        <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-faint">
          Endergebnis · {state.round} Runden
        </p>
      </div>

      {winner && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-5 rounded-3xl bg-surface p-6 text-center ring-1 ring-border"
        >
          <Crown className="mx-auto mb-2 h-10 w-10 text-warning" />
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Am sympathischsten
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <Avatar name={winner.name} id={winner.id} size="lg" />
            <div className="text-left">
              <p className="text-2xl font-black text-primary">{winner.name}</p>
              <p className="text-sm text-warning">{winner.score} Punkte</p>
            </div>
          </div>
        </motion.div>
      )}

      {chartData.length > 0 && (
        <div className="mb-5 h-40 w-full rounded-3xl bg-surface p-3 ring-1 ring-border">
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
                tick={{
                  fill: "var(--color-text)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
                axisLine={false}
                tickLine={false}
              />
              <Bar
                dataKey="score"
                radius={[0, 8, 8, 0]}
                label={{ fill: "var(--color-text)", fontSize: 12 }}
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={`var(--color-chart-${i % CHART_COLORS})`}
                  />
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
                    ? "bg-warning-muted ring-warning-muted"
                    : "bg-surface ring-border"
                }`}
              >
                <span className="w-5 text-center text-sm font-black text-faint">
                  {i + 1}
                </span>
                <Avatar name={p.name} id={p.id} size="sm" />
                <span className="flex-1 truncate font-semibold text-primary">
                  {p.name}
                  {p.id === myId && <span className="text-faint"> (du)</span>}
                </span>
                <span className="text-lg font-black text-accent">
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
            <RotateCcw className="h-5 w-5" /> Nochmal spielen
          </Button>
        )}
        <Button variant="ghost" onClick={onLeave}>
          <LogOut className="h-5 w-5" /> Raum verlassen
        </Button>
      </div>
    </Screen>
  );
}
