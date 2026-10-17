import { Link } from "@tanstack/react-router";
import { MapPin, Users } from "lucide-react";
import { sportMeta, communityName } from "@/lib/catalog";
import { PHASE_META, todayISO, unitsFreeOnDay, type Phase, type Tone } from "@/lib/booking";
import { cn } from "@/lib/utils";
import type { Booking, Equipment, SportId } from "@/lib/types";

export function SportTile({
  sport,
  className,
  size = "md",
}: {
  sport: SportId;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const meta = sportMeta(sport);
  return (
    <div
      aria-hidden
      className={cn(
        "border-foreground relative flex items-center justify-center overflow-hidden border-2",
        size === "sm" && "size-12 rounded-lg text-2xl",
        size === "md" && "h-36 rounded-lg text-6xl",
        size === "lg" && "h-52 rounded-xl text-8xl sm:h-64",
        className,
      )}
      style={{
        backgroundColor: `oklch(0.9 0.09 ${meta.hue})`,
        backgroundImage: `repeating-linear-gradient(135deg, oklch(0.84 0.1 ${meta.hue} / 0.55) 0 2px, transparent 2px 14px)`,
      }}
    >
      <span className="drop-shadow-[2px_3px_0_oklch(0.21_0.04_165/0.25)]">{meta.emoji}</span>
    </div>
  );
}

const TONE: Record<Tone, string> = {
  info: "bg-info-soft text-info border-info/40",
  warn: "bg-warn-soft text-warn border-warn/40",
  danger: "bg-danger-soft text-danger border-danger/50",
  success: "bg-success-soft text-success border-success/40",
  muted: "bg-muted text-muted-foreground border-border",
};

export function Pill({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PhaseBadge({ phase }: { phase: Phase }) {
  const meta = PHASE_META[phase];
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

export function AvailabilityPill({
  equipment,
  bookings,
}: {
  equipment: Equipment;
  bookings: Booking[];
}) {
  const today = todayISO();
  const free = unitsFreeOnDay(equipment, bookings, today, today);
  const total = equipment.units - equipment.unavailableUnits;
  if (total <= 0) return <Pill tone="muted">Out of service</Pill>;
  if (free === 0) return <Pill tone="danger">All {total} out today</Pill>;
  return (
    <Pill tone="success">
      {free} of {total} free today
    </Pill>
  );
}

export function EquipmentCard({
  equipment,
  bookings,
}: {
  equipment: Equipment;
  bookings: Booking[];
}) {
  const sport = sportMeta(equipment.sport);
  return (
    <Link
      to="/equipment/$id"
      params={{ id: equipment.id }}
      className="sticker group flex flex-col gap-3 p-3 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
    >
      <SportTile sport={equipment.sport} />
      <div className="flex flex-1 flex-col gap-2 px-1 pb-1">
        <div className="flex items-start justify-between gap-2">
          <p className="eyebrow">{sport.label}</p>
          <AvailabilityPill equipment={equipment} bookings={bookings} />
        </div>
        <h3 className="text-lg leading-tight font-bold group-hover:underline">{equipment.name}</h3>
        <div className="text-muted-foreground mt-auto flex flex-col gap-1 pt-1 text-xs">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" /> {communityName(equipment.communityId)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {equipment.pickupPoint}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-foreground/40 bg-card/60 flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-14 text-center">
      <p className="font-display text-xl font-bold">{title}</p>
      {children ? <p className="text-muted-foreground max-w-md text-sm">{children}</p> : null}
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl space-y-2">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="text-4xl leading-[1.05] font-extrabold sm:text-5xl">{title}</h1>
        {children ? <p className="text-muted-foreground text-base">{children}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
