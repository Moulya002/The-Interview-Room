"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ListInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  variant?: "tags" | "list";
}

export function ListInput({
  value,
  onChange,
  placeholder = "Add item...",
  variant = "tags",
}: ListInputProps) {
  const [draft, setDraft] = React.useState("");

  const add = () => {
    const v = draft.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setDraft("");
  };

  const remove = (item: string) => onChange(value.filter((v) => v !== item));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {value.length > 0 &&
        (variant === "tags" ? (
          <div className="flex flex-wrap gap-1.5">
            {value.map((item) => (
              <Badge key={item} variant="secondary" className="gap-1">
                {item}
                <button type="button" onClick={() => remove(item)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <ul className="space-y-1">
            {value.map((item, i) => (
              <li
                key={item}
                className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-1.5 text-sm"
              >
                <span>
                  <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                  {item}
                </span>
                <button type="button" onClick={() => remove(item)}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
