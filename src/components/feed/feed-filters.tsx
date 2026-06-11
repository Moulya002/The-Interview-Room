"use client";

import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useFilterStore } from "@/store/ui-store";
import { INTERVIEW_TYPES, OUTCOMES } from "@/lib/constants";

const difficultyRanges = [
  { label: "Easy (1-3)", value: "1-3" },
  { label: "Medium (4-6)", value: "4-6" },
  { label: "Hard (7-8)", value: "7-8" },
  { label: "Very Hard (9-10)", value: "9-10" },
];

function FilterSelect({
  placeholder,
  value,
  options,
  onChange,
}: {
  placeholder: string;
  value?: string;
  options: readonly string[] | { label: string; value: string }[];
  onChange: (v?: string) => void;
}) {
  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v || undefined)}>
      <SelectTrigger className="h-9 w-auto min-w-[140px] text-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => {
          const opt = typeof o === "string" ? { label: o, value: o } : o;
          return (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export function FeedFilters() {
  const { filters, setFilter, resetFilters } = useFilterStore();
  const activeCount = Object.keys(filters).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Company..."
          defaultValue={filters.company ?? ""}
          onBlur={(e) => setFilter("company", e.target.value || undefined)}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            setFilter("company", (e.target as HTMLInputElement).value || undefined)
          }
          className="h-9 w-[150px]"
        />
        <Input
          placeholder="Role..."
          defaultValue={filters.role ?? ""}
          onBlur={(e) => setFilter("role", e.target.value || undefined)}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            setFilter("role", (e.target as HTMLInputElement).value || undefined)
          }
          className="h-9 w-[150px]"
        />
        <FilterSelect
          placeholder="Difficulty"
          value={filters.difficulty}
          options={difficultyRanges}
          onChange={(v) => setFilter("difficulty", v)}
        />
        <FilterSelect
          placeholder="Interview type"
          value={filters.interviewType}
          options={INTERVIEW_TYPES}
          onChange={(v) => setFilter("interviewType", v)}
        />
        <FilterSelect
          placeholder="Outcome"
          value={filters.outcome}
          options={OUTCOMES}
          onChange={(v) => setFilter("outcome", v)}
        />
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(filters).map(([k, v]) => (
            <Badge
              key={k}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setFilter(k as keyof typeof filters, undefined)}
            >
              {k}: {v} <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
