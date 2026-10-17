import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Booking, Equipment } from "./types";

/* ---------- dates (all local, stored as yyyy-MM-dd strings) ---------- */

export const toISO = (d: Date) => format(d, "yyyy-MM-dd");
export const todayISO = (now: Date = new Date()) => toISO(now);
export const nowStamp = (now: Date = new Date()) => format(now, "yyyy-MM-dd'T'HH:mm");
export const fromISO = (iso: string) => parseISO(iso);
export const shiftISO = (iso: string, days: number) => toISO(addDays(parseISO(iso), days));

/** Inclusive number of days between two ISO dates. */
export const dayCount = (start: string, end: string) =>
  differenceInCalendarDays(parseISO(end), parseISO(start)) + 1;

export function eachDay(start: string, end: string): string[] {
  const n = dayCount(start, end);
  return Array.from({ length: Math.max(n, 0) }, (_, i) => shiftISO(start, i));
}

export const fmtDate = (iso: string) => format(parseISO(iso), "EEE d MMM");
export const fmtStamp = (stamp: string) => format(parseISO(stamp), "d MMM, h:mm a");

/* ---------- lifecycle ---------- */

export type Phase =
  | "upcoming"
  | "pickup_due"
  | "on_loan"
  | "due_today"
  | "overdue"
  | "returned"
  | "returned_late"
  | "cancelled"
  | "expired";

export type Tone = "info" | "warn" | "danger" | "success" | "muted";

export const PHASE_META: Record<Phase, { label: string; tone: Tone }> = {
  upcoming: { label: "Upcoming", tone: "info" },
  pickup_due: { label: "Ready for pickup", tone: "warn" },
  on_loan: { label: "On loan", tone: "warn" },
  due_today: { label: "Due today", tone: "warn" },
  overdue: { label: "Overdue", tone: "danger" },
  returned: { label: "Returned", tone: "success" },
  returned_late: { label: "Returned late", tone: "muted" },
  cancelled: { label: "Cancelled", tone: "muted" },
  expired: { label: "Missed pickup", tone: "muted" },
};

export function bookingPhase(b: Booking, today: string): Phase {
  if (b.status === "cancelled") return "cancelled";
  if (b.status === "returned") {
    return b.returnedAt && b.returnedAt.slice(0, 10) > b.endDate ? "returned_late" : "returned";
  }
  if (b.status === "checked_out") {
    if (b.endDate < today) return "overdue";
    if (b.endDate === today) return "due_today";
    return "on_loan";
  }
  if (b.endDate < today) return "expired";
  if (b.startDate <= today) return "pickup_due";
  return "upcoming";
}

export const overdueDays = (b: Booking, today: string) =>
  b.status === "checked_out" && b.endDate < today
    ? differenceInCalendarDays(parseISO(today), parseISO(b.endDate))
    : 0;

/** Does this booking still reserve physical units? */
export function holdsUnits(b: Booking, today: string): boolean {
  if (b.status === "checked_out") return true;
  if (b.status === "booked") return b.endDate >= today;
  return false;
}

/** Does this booking occupy its units on the given day? */
function coversDay(b: Booking, day: string, today: string): boolean {
  if (!holdsUnits(b, today)) return false;
  // An overdue item is still out of the shelf until someone returns it.
  if (b.status === "checked_out" && b.endDate < today) return day >= b.startDate;
  return day >= b.startDate && day <= b.endDate;
}

/* ---------- availability ---------- */

export function unitsFreeOnDay(
  eq: Equipment,
  bookings: Booking[],
  day: string,
  today: string,
): number {
  let taken = 0;
  for (const b of bookings) {
    if (b.equipmentId === eq.id && coversDay(b, day, today)) taken += b.units;
  }
  return Math.max(0, eq.units - eq.unavailableUnits - taken);
}

/** Units guaranteed free on every day of the range. */
export function unitsFreeForRange(
  eq: Equipment,
  bookings: Booking[],
  start: string,
  end: string,
  today: string,
): number {
  const days = eachDay(start, end);
  if (days.length === 0) return 0;
  return Math.min(...days.map((d) => unitsFreeOnDay(eq, bookings, d, today)));
}

export interface BookingInput {
  equipmentId: string;
  borrower: string;
  units: number;
  startDate: string;
  endDate: string;
}

/** Returns a human-readable error, or null when the booking is valid. */
export function validateBooking(
  eq: Equipment | undefined,
  bookings: Booking[],
  input: BookingInput,
  today: string,
): string | null {
  if (!eq) return "This equipment no longer exists.";
  if (input.borrower.trim().length < 2)
    return "Enter your name so the owner knows who is borrowing.";
  if (!input.startDate || !input.endDate) return "Pick the dates you need the gear.";
  if (input.startDate < today) return "Start date can't be in the past.";
  if (input.endDate < input.startDate) return "Return date must be on or after the start date.";
  const days = dayCount(input.startDate, input.endDate);
  if (days > eq.maxDays)
    return `This gear can be borrowed for at most ${eq.maxDays} days at a time.`;
  if (!Number.isInteger(input.units) || input.units < 1) return "Choose at least 1 unit.";
  const free = unitsFreeForRange(eq, bookings, input.startDate, input.endDate, today);
  if (free < 1) return "Nothing is free on all of those dates. Try different days.";
  if (input.units > free)
    return `Only ${free} ${free === 1 ? "unit is" : "units are"} free for those dates.`;
  return null;
}
