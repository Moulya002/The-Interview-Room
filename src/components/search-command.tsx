"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Building2, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/fetcher";
import { useUIStore } from "@/store/ui-store";

interface Suggestion {
  slug: string;
  title: string;
  company: string;
  role: string;
}

function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function SearchCommand() {
  const { searchOpen, setSearchOpen } = useUIStore();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const debounced = useDebounced(query);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [searchOpen, setSearchOpen]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () =>
      api.get<{ suggestions: Suggestion[]; engine: string }>(
        `/api/search?mode=autocomplete&q=${encodeURIComponent(debounced)}`,
      ),
    enabled: debounced.length > 1,
  });

  const go = (path: string) => {
    setSearchOpen(false);
    setQuery("");
    router.push(path);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="top-[20%] translate-y-0 gap-0 p-0">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <form onSubmit={submit} className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies, roles, questions..."
            className="border-0 focus-visible:ring-0"
          />
          {isFetching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </form>
        <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
          {debounced.length <= 1 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Type to search experiences, companies and roles.
            </p>
          )}
          {data?.suggestions?.length === 0 && debounced.length > 1 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No results for &ldquo;{debounced}&rdquo;.
            </p>
          )}
          {data?.suggestions?.map((s) => (
            <button
              key={s.slug}
              onClick={() => go(`/post/${s.slug}`)}
              className="flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left hover:bg-accent"
            >
              <span className="line-clamp-1 text-sm font-medium">{s.title}</span>
              <span className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {s.company}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> {s.role}
                </span>
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
