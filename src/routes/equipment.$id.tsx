import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarPlus,
  Hammer,
  Info,
  MapPin,
  Timer,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, Input } from "@/components/ui/form";
import { AvailabilityPill, EmptyState, PhaseBadge, SportTile } from "@/components/gear";
import { CONDITIONS, communityName, sportMeta } from "@/lib/catalog";
import {
  bookingPhase,
  dayCount,
  fmtDate,
  fromISO,
  todayISO,
  toISO,
  unitsFreeForRange,
  unitsFreeOnDay,
  validateBooking,
} from "@/lib/booking";
import { actions, useGear } from "@/lib/store";
import { plural } from "@/lib/utils";
import type { Booking, Equipment } from "@/lib/types";

export const Route = createFileRoute("/equipment/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "Gear details — GearLoop" }] }),
  component: EquipmentDetail,
});

function EquipmentDetail() {
  const { id } = Route.useParams();
  const { equipment, bookings, profileName } = useGear();
  const item = equipment.find((e) => e.id === id);

  if (!item) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          title="We couldn't find that item"
          action={
            <Button asChild variant="accent">
              <Link to="/equipment">Back to all gear</Link>
            </Button>
          }
        >
          It may have been removed, or the link is out of date.
        </EmptyState>
      </div>
    );
  }

  const sport = sportMeta(item.sport);
  const mine = bookings.filter((b) => b.equipmentId === item.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-3">
        <Link to="/equipment">
          <ArrowLeft /> All gear
        </Link>
      </Button>

      <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-8">
          <SportTile sport={item.sport} size="lg" />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="eyebrow">{sport.label}</p>
              <AvailabilityPill equipment={item} bookings={bookings} />
            </div>
            <h1 className="text-4xl leading-tight font-extrabold sm:text-5xl">{item.name}</h1>
            <p className="text-muted-foreground text-lg">{item.description}</p>
          </div>

          <dl className="sticker grid grid-cols-2 gap-px overflow-hidden bg-foreground sm:grid-cols-3 [&>div]:bg-card [&>div]:p-4">
            <Fact icon={User} label="Shared by" value={item.owner} />
            <Fact icon={Users} label="Community" value={communityName(item.communityId)} />
            <Fact icon={MapPin} label="Pickup point" value={item.pickupPoint} />
            <Fact icon={Timer} label="Max loan" value={plural(item.maxDays, "day")} />
            <Fact
              icon={Wrench}
              label="Condition"
              value={
                CONDITIONS.find((c) => c.id === item.condition)?.label.split(" — ")[0] ??
                item.condition
              }
            />
            <Fact
              icon={Hammer}
              label="Units"
              value={`${item.units - item.unavailableUnits} in service of ${item.units}`}
            />
          </dl>

          {item.unavailableUnits > 0 ? (
            <div className="bg-warn-soft border-warn/50 flex flex-col gap-3 rounded-xl border-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium">
                <strong>{plural(item.unavailableUnits, "unit")}</strong> pulled from circulation
                after a damaged or incomplete return.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  actions.restoreUnits(item.id, item.unavailableUnits);
                  toast.success("Back in circulation", {
                    description: "All units are bookable again.",
                  });
                }}
              >
                <Wrench /> Mark repaired
              </Button>
            </div>
          ) : null}

          <Reservations bookings={mine} />
        </div>

        <BookingPanel equipment={item} bookings={bookings} profileName={profileName} />
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
        <Icon className="size-3.5" /> {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}

function Reservations({ bookings }: { bookings: Booking[] }) {
  const today = todayISO();
  const active = bookings
    .filter((b) =>
      ["upcoming", "pickup_due", "on_loan", "due_today", "overdue"].includes(
        bookingPhase(b, today),
      ),
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <section aria-labelledby="reservations-title" className="space-y-3">
      <h2 id="reservations-title" className="text-2xl font-bold">
        Who has it, and when
      </h2>
      {active.length === 0 ? (
        <p className="text-muted-foreground text-sm">No active bookings — it's all yours.</p>
      ) : (
        <ul className="space-y-2">
          {active.map((b) => (
            <li
              key={b.id}
              className="sticker-sm flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div>
                <p className="text-sm font-bold">
                  {b.borrower} · {plural(b.units, "unit")}
                </p>
                <p className="text-muted-foreground text-xs">
                  {fmtDate(b.startDate)} → {fmtDate(b.endDate)}
                </p>
              </div>
              <PhaseBadge phase={bookingPhase(b, today)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BookingPanel({
  equipment,
  bookings,
  profileName,
}: {
  equipment: Equipment;
  bookings: Booking[];
  profileName: string;
}) {
  const navigate = useNavigate();
  const today = todayISO();
  const [range, setRange] = useState<DateRange | undefined>();
  const [name, setName] = useState(profileName);
  const [units, setUnits] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const startDate = range?.from ? toISO(range.from) : "";
  const endDate = range?.to ? toISO(range.to) : startDate;
  const days = startDate ? dayCount(startDate, endDate) : 0;
  const free = startDate ? unitsFreeForRange(equipment, bookings, startDate, endDate, today) : null;
  const inService = equipment.units - equipment.unavailableUnits;

  const isFull = (date: Date) => unitsFreeOnDay(equipment, bookings, toISO(date), today) <= 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = { equipmentId: equipment.id, borrower: name, units, startDate, endDate };
    const problem = validateBooking(equipment, bookings, input, today);
    if (problem) {
      setError(problem);
      return;
    }
    const result = actions.createBooking(input);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (name.trim() !== profileName) actions.setProfileName(name);
    toast.success("Booked!", {
      description: `${equipment.name} · ${fmtDate(startDate)} → ${fmtDate(endDate)}. Pick it up at ${equipment.pickupPoint}.`,
    });
    void navigate({ to: "/bookings" });
  };

  return (
    <form onSubmit={submit} className="sticker space-y-5 p-5 lg:sticky lg:top-24" noValidate>
      <div>
        <h2 className="text-2xl font-bold">Book this gear</h2>
        <p className="text-muted-foreground text-sm">
          Tap a day to start, tap another to set the return date. Crossed-out days are fully booked.
        </p>
      </div>

      {inService === 0 ? (
        <div className="bg-muted flex items-start gap-2 rounded-lg p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" />
          All units are out of service right now. Mark them repaired to reopen bookings.
        </div>
      ) : (
        <>
          <Calendar
            mode="range"
            selected={range}
            onSelect={(r) => {
              setRange(r);
              setError(null);
            }}
            disabled={[{ before: fromISO(today) }, isFull]}
            excludeDisabled
            modifiers={{ full: (d) => toISO(d) >= today && isFull(d) }}
            modifiersClassNames={{ full: "rdp-full" }}
            defaultMonth={fromISO(today)}
          />

          <div className="bg-muted rounded-lg px-3 py-2 text-sm" aria-live="polite">
            {startDate ? (
              <>
                <strong>{fmtDate(startDate)}</strong>
                {endDate !== startDate ? (
                  <>
                    {" "}
                    → <strong>{fmtDate(endDate)}</strong>
                  </>
                ) : null}{" "}
                · {plural(days, "day")}
                {days > equipment.maxDays ? (
                  <span className="text-danger block font-semibold">
                    Max {plural(equipment.maxDays, "day")} per booking.
                  </span>
                ) : free !== null ? (
                  <span className="text-muted-foreground block">
                    {free} of {inService} free for these dates
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-muted-foreground">No dates selected yet.</span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <Field label="Your name" htmlFor="borrower">
              <Input
                id="borrower"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                autoComplete="name"
              />
            </Field>
            <Field label="Units" htmlFor="units">
              <Input
                id="units"
                type="number"
                min={1}
                max={Math.max(1, free ?? inService)}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
              />
            </Field>
          </div>

          {error ? (
            <p
              role="alert"
              className="bg-danger-soft text-danger rounded-lg px-3 py-2 text-sm font-semibold"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="accent" size="lg" className="w-full">
            <CalendarPlus /> Confirm booking
          </Button>
        </>
      )}
    </form>
  );
}
