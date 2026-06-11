import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { difficultyLabel } from "@/lib/utils";

interface Stats {
  total: number;
  avgDifficulty: number;
  avgRounds: number;
  outcomes: { Selected: number; Rejected: number; Pending: number };
}

export function StatsOverview({ stats }: { stats: Stats }) {
  const totalOutcomes =
    stats.outcomes.Selected + stats.outcomes.Rejected + stats.outcomes.Pending || 1;
  const pct = (n: number) => Math.round((n / totalOutcomes) * 100);

  const cards = [
    { label: "Experiences", value: stats.total },
    {
      label: "Avg difficulty",
      value: `${stats.avgDifficulty}/10`,
      sub: difficultyLabel(stats.avgDifficulty),
    },
    { label: "Avg rounds", value: stats.avgRounds },
    {
      label: "Success rate",
      value: `${pct(stats.outcomes.Selected)}%`,
      sub: "selected",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              {c.sub && (
                <p className="text-[11px] text-muted-foreground">{c.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-medium">Interview outcomes</p>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="bg-emerald-500"
              style={{ width: `${pct(stats.outcomes.Selected)}%` }}
            />
            <div
              className="bg-red-500"
              style={{ width: `${pct(stats.outcomes.Rejected)}%` }}
            />
            <div
              className="bg-amber-500"
              style={{ width: `${pct(stats.outcomes.Pending)}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Selected (
              {stats.outcomes.Selected})
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Rejected (
              {stats.outcomes.Rejected})
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Pending (
              {stats.outcomes.Pending})
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TopQuestions({
  questions,
}: {
  questions: { question: string; count: number }[];
}) {
  if (!questions.length) return null;
  return (
    <Card>
      <CardContent className="p-4">
        <p className="mb-3 text-sm font-medium">Most common questions</p>
        <ol className="space-y-2 text-sm">
          {questions.map((q, i) => (
            <li key={i} className="flex items-start justify-between gap-2">
              <span>
                <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                {q.question}
              </span>
              <Badge variant="secondary">{q.count}×</Badge>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
