import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  BellRing,
  CalendarX2,
  Check,
  HandHelping,
  PackageCheck,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";
import { PhaseBadge, SportTile } from "@/components/gear";
import {
  bookingPhase,
  dayCount,
  fmtDate,
  fmtStamp,
  overdueDays,
  todayISO,
  type Phase,
} from "@/lib/booking";
import { RETURN_CONDITIONS, communityName } from "@/lib/catalog";
import { actions } from "@/lib/store";
import { cn, plural } from "@/lib/utils";
import type { Booking, Equipment, ReturnCondition } from "@/lib/types";

/** Three-step tracker: Booked → Picked up → Returned. */
export function BookingTimeline({ booking, phase }: { booking: Booking; phase: Phase }) {
  const cancelled = phase === "cancelled" || phase === "expired";
  const steps = [
    { label: "Booked", detail: fmtStamp(booking.createdAt), done: true },
    {
      label: "Picked up",
      detail: booking.pickedUpAt
        ? fmtStamp(booking.pickedUpAt)
        : `Planned ${fmtDate(booking.startDate)}`,
      done: booking.pickedUpAt !== null,
    },
    {
      label: phase === "returned_late" ? "Returned late" : "Returned",
      detail: booking.returnedAt ? fmtStamp(booking.returnedAt) : `Due ${fmtDate(booking.endDate)}`,
      done: booking.returnedAt !== null,
    },
  ];
  if (cancelled) return null;
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Booking progress">
      {steps.map((s, i) => (
        <li key={s.label} className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "border-foreground flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px]",
                s.done ? "bg-accent" : "bg-card",
                !s.done && phase === "overdue" && i === 2 && "border-danger bg-danger-soft",
              )}
            >
              {s.done ? <Check className="size-3" strokeWidth={3} /> : null}
            </span>
            <span
              className={cn(
                "h-0.5 flex-1",
                i === steps.length - 1 && "hidden",
                s.done ? "bg-foreground" : "bg-border",
              )}
            />
          </div>
          <p className="mt-1 text-xs font-bold">{s.label}</p>
          <p className="text-muted-foreground truncate text-[11px]">{s.detail}</p>
        </li>
      ))}
    </ol>
  );
}

export function ReturnDialog({
  booking,
  equipment,
  open,
  onOpenChange,
}: {
  booking: Booking;
  equipment: Equipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [condition, setCondition] = useState<ReturnCondition>("good");
  const [note, setNote] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.returnBooking(booking.id, condition, note);
    onOpenChange(false);
    setNote("");
    setCondition("good");
    if (condition === "damaged" || condition === "missing") {
      toast.warning("Returned & flagged", {
        description: `${plural(booking.units, "unit")} of ${equipment.name} pulled from circulation until restored.`,
      });
    } else {
      toast.success("Marked as returned", {
        description: `${equipment.name} is back on the shelf.`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Log the return</DialogTitle>
        <DialogDescription>
          {plural(booking.units, "unit")} of {equipment.name} from {booking.borrower}.
        </DialogDescription>
        <form onSubmit={submit} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">Condition on return</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {RETURN_CONDITIONS.map((c) => (
                <label
                  key={c.id}
                  className={cn(
                    "flex cursor-pointer flex-col rounded-lg border-2 p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                    condition === c.id
                      ? "border-foreground bg-accent shadow-[3px_3px_0_0_var(--foreground)]"
                      : "border-border bg-card hover:border-foreground/50",
                  )}
                >
                  <input
                    type="radio"
                    name="condition"
                    value={c.id}
                    checked={condition === c.id}
                    onChange={() => setCondition(c.id)}
                    className="sr-only"
                  />
                  <span className="text-sm font-bold">{c.label}</span>
                  <span className="text-muted-foreground text-xs">{c.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Note (optional)" htmlFor={`note-${booking.id}`}>
            <Textarea
              id={`note-${booking.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything the next borrower or the owner should know?"
              maxLength={240}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent">
              <PackageCheck /> Confirm return
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BookingCard({
  booking,
  equipment,
  showTimeline = true,
  showBorrower = true,
}: {
  booking: Booking;
  equipment: Equipment | undefined;
  showTimeline?: boolean;
  showBorrower?: boolean;
}) {
  const [returning, setReturning] = useState(false);
  const today = todayISO();
  const phase = bookingPhase(booking, today);
  const late = overdueDays(booking, today);

  if (!equipment) return null;

  const canPickUp = phase === "pickup_due";
  const canReturn = phase === "on_loan" || phase === "due_today" || phase === "overdue";
  const canCancel = phase === "upcoming" || phase === "pickup_due";

  return (
    <article
      className={cn(
        "sticker flex flex-col gap-4 p-4",
        phase === "overdue" && "border-danger shadow-[4px_4px_0_0_var(--danger)]",
      )}
    >
      <div className="flex gap-3">
        <SportTile sport={equipment.sport} size="sm" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              to="/equipment/$id"
              params={{ id: equipment.id }}
              className="font-display text-lg leading-tight font-bold hover:underline"
            >
              {equipment.name}
            </Link>
            <PhaseBadge phase={phase} />
          </div>
          <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm">
            {showBorrower ? (
              <span className="text-foreground font-semibold">{booking.borrower}</span>
            ) : null}
            {showBorrower ? <span aria-hidden>·</span> : null}
            <span>{plural(booking.units, "unit")}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              {fmtDate(booking.startDate)} <ArrowRight className="size-3" />{" "}
              {fmtDate(booking.endDate)}
            </span>
            <span className="text-xs">
              ({plural(dayCount(booking.startDate, booking.endDate), "day")})
            </span>
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Pickup: {equipment.pickupPoint} · {communityName(equipment.communityId)}
          </p>
        </div>
      </div>

      {late > 0 ? (
        <p className="bg-danger-soft text-danger rounded-lg px-3 py-2 text-sm font-semibold">
          {plural(late, "day")} overdue — the {plural(booking.units, "unit")} can't be booked by
          others until it's back.
        </p>
      ) : null}

      {booking.status === "returned" && booking.returnCondition ? (
        <p className="bg-muted rounded-lg px-3 py-2 text-sm">
          <span className="font-semibold capitalize">Returned {booking.returnCondition}.</span>{" "}
          {booking.returnNote || null}
        </p>
      ) : null}

      {showTimeline ? <BookingTimeline booking={booking} phase={phase} /> : null}

      {canPickUp || canReturn || canCancel ? (
        <div className="flex flex-wrap items-center gap-2">
          {canPickUp ? (
            <Button
              size="sm"
              variant="accent"
              onClick={() => {
                actions.pickUp(booking.id);
                toast.success("Marked as picked up", {
                  description: `Due back ${fmtDate(booking.endDate)}.`,
                });
              }}
            >
              <HandHelping /> Mark picked up
            </Button>
          ) : null}
          {canReturn ? (
            <Button size="sm" variant="accent" onClick={() => setReturning(true)}>
              <Undo2 /> Log return
            </Button>
          ) : null}
          {phase === "overdue" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast.info(`Reminder sent to ${booking.borrower}`, {
                  description:
                    "In this demo reminders are simulated — connect email/SMS to make it real.",
                })
              }
            >
              <BellRing /> Send reminder
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                actions.cancelBooking(booking.id);
                toast("Booking cancelled", { description: "Those dates are free again." });
              }}
            >
              <CalendarX2 /> Cancel
            </Button>
          ) : null}
        </div>
      ) : null}

      <ReturnDialog
        booking={booking}
        equipment={equipment}
        open={returning}
        onOpenChange={setReturning}
      />
    </article>
  );
}
