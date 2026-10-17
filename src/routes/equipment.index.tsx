import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { EmptyState, EquipmentCard, PageHeader } from "@/components/gear";
import { COMMUNITIES, SPORTS } from "@/lib/catalog";
import { todayISO, unitsFreeOnDay } from "@/lib/booking";
import { useGear } from "@/lib/store";
import { cn, plural } from "@/lib/utils";

interface CatalogSearch {
  sport?: string;
  community?: string;
}

export const Route = createFileRoute("/equipment/")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): CatalogSearch => {
    const out: CatalogSearch = {};
    const sport = search["sport"];
    const community = search["community"];
    if (typeof sport === "string" && sport !== "all") out.sport = sport;
    if (typeof community === "string" && community !== "all") out.community = community;
    return out;
  },
  head: () => ({ meta: [{ title: "Browse gear — GearLoop" }] }),
  component: Catalog,
});

function Catalog() {
  const { equipment, bookings } = useGear();
  const search = Route.useSearch();
  const sport = search.sport ?? "all";
  const community = search.community ?? "all";
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const today = todayISO();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return equipment
      .filter((e) => sport === "all" || e.sport === sport)
      .filter((e) => community === "all" || e.communityId === community)
      .filter((e) => !q || `${e.name} ${e.description} ${e.owner}`.toLowerCase().includes(q))
      .filter((e) => !availableOnly || unitsFreeOnDay(e, bookings, today, today) > 0);
  }, [equipment, bookings, sport, community, query, availableOnly, today]);

  const setFilter = (next: { sport?: string; community?: string }) =>
    navigate({
      search: (prev) => {
        const merged = { ...prev, ...next };
        const out: CatalogSearch = {};
        if (merged.sport && merged.sport !== "all") out.sport = merged.sport;
        if (merged.community && merged.community !== "all") out.community = merged.community;
        return out;
      },
      replace: true,
    });

  const filtered = sport !== "all" || community !== "all" || query !== "" || availableOnly;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <PageHeader eyebrow="Browse" title="Find your gear">
        Everything your communities are sharing. Availability reflects bookings and what's still out
        on loan.
      </PageHeader>

      <div className="sticker space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_16rem]">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              type="search"
              aria-label="Search gear"
              placeholder="Search rackets, mats, bikes…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select
            aria-label="Community"
            value={community}
            onChange={(e) => setFilter({ community: e.target.value })}
          >
            <option value="all">All communities</option>
            {COMMUNITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sport">
          {[{ id: "all", label: "All sports", emoji: "✨" }, ...SPORTS].map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={sport === s.id}
              onClick={() => setFilter({ sport: s.id })}
              className={cn(
                "border-foreground flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors",
                sport === s.id
                  ? "bg-accent shadow-[2px_2px_0_0_var(--foreground)]"
                  : "bg-card hover:bg-muted",
              )}
            >
              <span aria-hidden>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="accent-foreground size-4"
          />
          Only show gear free today
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {plural(results.length, "item")} found
        </p>
        {filtered ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setAvailableOnly(false);
              setFilter({ sport: "all", community: "all" });
            }}
          >
            <SlidersHorizontal /> Clear filters
          </Button>
        ) : null}
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="Nothing matches yet"
          action={
            <Button asChild variant="accent">
              <Link to="/share">Share something</Link>
            </Button>
          }
        >
          Try a different sport or community — or be the first to list it.
        </EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((e) => (
            <EquipmentCard key={e.id} equipment={e} bookings={bookings} />
          ))}
        </div>
      )}
    </div>
  );
}
