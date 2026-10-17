import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCard } from "@/components/booking-card";
import { EmptyState, PageHeader } from "@/components/gear";
import { bookingPhase, type Phase, todayISO } from "@/lib/booking";
import { useGear } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Booking } from "@/lib/types";

export const Route = createFileRoute("/returns")({
  ssr: false,
  head: () => ({ meta: [{ title: "Return tracker — GearLoop" }] }),
  component: ReturnTracker,
});

const ATTENTION: Phase[] = ["overdue", "due_today", "pickup_due"];
const OUT: Phase[] = ["on_loan", "due_today", "overdue"];
const HISTORY: Phase[] = ["returned", "returned_late", "cancelled", "expired"];

function ReturnTracker() {
  const { bookings, equipment } = useGear();
  const [query, setQuery] = useState("");
  const today = todayISO();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings
      .map((b) => ({
        booking: b,
        phase: bookingPhase(b, today),
        item: equipment.find((e) => e.id === b.equipmentId),
      }))
      .filter((r) => !q || `${r.booking.borrower} ${r.item?.name ?? ""}`.toLowerCase().includes(q));
  }, [bookings, equipment, query, today]);

  const pick = (phases: Phase[]) => rows.filter((r) => phases.includes(r.phase));
  const attention = pick(ATTENTION).sort((a, b) =>
    a.booking.endDate.localeCompare(b.booking.endDate),
  );
  const out = pick(OUT).sort((a, b) => a.booking.endDate.localeCompare(b.booking.endDate));
  const upcoming = pick(["upcoming"]).sort((a, b) =>
    a.booking.startDate.localeCompare(b.booking.startDate),
  );
  const history = pick(HISTORY).sort((a, b) =>
    (b.booking.returnedAt ?? b.booking.endDate).localeCompare(
      a.booking.returnedAt ?? a.booking.endDate,
    ),
  );

  const all = bookings.map((b) => bookingPhase(b, today));
  const count = (p: Phase[]) => all.filter((x) => p.includes(x)).length;
  const returned = count(["returned", "returned_late"]);
  const onTime = returned === 0 ? 100 : Math.round((count(["returned"]) / returned) * 100);

  const summary = [
    { label: "Out on loan", value: count(OUT), tone: "" },
    { label: "Due today", value: count(["due_today"]), tone: "" },
    {
      label: "Overdue",
      value: count(["overdue"]),
      tone: count(["overdue"]) > 0 ? "bg-danger-soft text-danger" : "",
    },
    { label: "On-time returns", value: `${onTime}%`, tone: "bg-success-soft text-success" },
  ];

  const list = (items: typeof rows, empty: string) =>
    items.length === 0 ? (
      <EmptyState title={empty} />
    ) : (
      <div className="grid gap-5 lg:grid-cols-2">
        {items.map((r) => (
          <BookingCard key={r.booking.id} booking={r.booking as Booking} equipment={r.item} />
        ))}
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <PageHeader eyebrow="Return tracking" title="Where is everything?">
        Every booking, from reservation to return. Hand out gear, log what comes back and how it
        looks, and chase anything overdue.
      </PageHeader>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className={cn("sticker p-4", s.tone)}>
            <dd className="font-display text-4xl font-extrabold">{s.value}</dd>
            <dt className="text-sm font-medium opacity-80">{s.label}</dt>
          </div>
        ))}
      </dl>

      <div className="relative max-w-md">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          aria-label="Search bookings"
          placeholder="Search by borrower or gear…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="attention">
        <TabsList>
          <TabsTrigger value="attention">Needs attention ({attention.length})</TabsTrigger>
          <TabsTrigger value="out">On loan ({out.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="history">History ({history.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="attention">
          {list(attention, "All clear — nothing needs chasing")}
        </TabsContent>
        <TabsContent value="out">{list(out, "Nothing is out on loan")}</TabsContent>
        <TabsContent value="upcoming">{list(upcoming, "No upcoming bookings")}</TabsContent>
        <TabsContent value="history">{list(history, "No history yet")}</TabsContent>
      </Tabs>
    </div>
  );
}
