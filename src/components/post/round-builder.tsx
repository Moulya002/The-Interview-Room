"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ListInput } from "@/components/ui/list-input";
import type { RoundDTO } from "@/types";

interface RoundBuilderProps {
  value: RoundDTO[];
  onChange: (rounds: RoundDTO[]) => void;
}

export function RoundBuilder({ value, onChange }: RoundBuilderProps) {
  const update = (i: number, patch: Partial<RoundDTO>) =>
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const add = () =>
    onChange([...value, { title: "", type: "", description: "", questions: [] }]);

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {value.map((round, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Round {i + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(i)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={round.title}
                placeholder="e.g. Technical Screen"
                onChange={(e) => update(i, { title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Input
                value={round.type}
                placeholder="e.g. Coding / System Design"
                onChange={(e) => update(i, { type: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>What happened?</Label>
            <Textarea
              value={round.description}
              placeholder="Describe the round, the format, and how it went..."
              onChange={(e) => update(i, { description: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Questions asked in this round</Label>
            <ListInput
              variant="list"
              value={round.questions ?? []}
              onChange={(questions) => update(i, { questions })}
              placeholder="Add a question..."
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={add} className="w-full">
        <Plus className="h-4 w-4" /> Add round
      </Button>
    </div>
  );
}
