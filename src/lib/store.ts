import { useSyncExternalStore } from "react";
import { nowStamp, todayISO, validateBooking, type BookingInput } from "./booking";
import { createSeed, DEMO_USER } from "./seed";
import type { Booking, Equipment, GearState, ReturnCondition } from "./types";

/**
 * Tiny external store backed by localStorage, so the whole app works without a
 * backend. Swap the `commit` function for API calls when you add a server.
 */

const KEY = "gearloop:v1";

const serverState: GearState = createSeed("2000-01-01");
let state: GearState = serverState;
let loaded = false;
const listeners = new Set<() => void>();

function isGearState(value: unknown): value is GearState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["profileName"] === "string" &&
    Array.isArray(v["equipment"]) &&
    Array.isArray(v["bookings"])
  );
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isGearState(parsed)) {
        state = parsed;
        return;
      }
    }
  } catch {
    /* storage blocked or corrupted — fall through to the demo data */
  }
  state = createSeed(todayISO());
}

function commit(next: GearState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode — keep working in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  ensureLoaded();
  return state;
}

function getServerSnapshot() {
  return serverState;
}

export function useGear(): GearState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const uid = (prefix: string) =>
  `${prefix}${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

export type BookingResult = { ok: true; booking: Booking } | { ok: false; error: string };

export interface NewEquipment {
  name: string;
  sport: Equipment["sport"];
  description: string;
  communityId: string;
  owner: string;
  units: number;
  condition: Equipment["condition"];
  maxDays: number;
  pickupPoint: string;
}

export const actions = {
  setProfileName(name: string) {
    ensureLoaded();
    commit({ ...state, profileName: name.trim() || DEMO_USER });
  },

  addEquipment(input: NewEquipment): Equipment {
    ensureLoaded();
    const item: Equipment = {
      ...input,
      id: uid("e"),
      unavailableUnits: 0,
      createdAt: nowStamp(),
    };
    commit({ ...state, equipment: [item, ...state.equipment] });
    return item;
  },

  createBooking(input: BookingInput): BookingResult {
    ensureLoaded();
    const eq = state.equipment.find((e) => e.id === input.equipmentId);
    const error = validateBooking(eq, state.bookings, input, todayISO());
    if (error) return { ok: false, error };
    const booking: Booking = {
      id: uid("b"),
      equipmentId: input.equipmentId,
      borrower: input.borrower.trim(),
      units: input.units,
      startDate: input.startDate,
      endDate: input.endDate,
      status: "booked",
      createdAt: nowStamp(),
      pickedUpAt: null,
      returnedAt: null,
      returnCondition: null,
      returnNote: "",
    };
    commit({ ...state, bookings: [booking, ...state.bookings] });
    return { ok: true, booking };
  },

  pickUp(bookingId: string) {
    ensureLoaded();
    commit({
      ...state,
      bookings: state.bookings.map((b) =>
        b.id === bookingId && b.status === "booked"
          ? { ...b, status: "checked_out", pickedUpAt: nowStamp() }
          : b,
      ),
    });
  },

  returnBooking(bookingId: string, condition: ReturnCondition, note: string) {
    ensureLoaded();
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status !== "checked_out") return;
    const bookings = state.bookings.map((b) =>
      b.id === bookingId
        ? {
            ...b,
            status: "returned" as const,
            returnedAt: nowStamp(),
            returnCondition: condition,
            returnNote: note.trim(),
          }
        : b,
    );
    const equipment = state.equipment.map((e) => {
      if (e.id !== booking.equipmentId) return e;
      if (condition === "damaged" || condition === "missing") {
        return { ...e, unavailableUnits: Math.min(e.units, e.unavailableUnits + booking.units) };
      }
      if (condition === "worn" && e.condition !== "fair")
        return { ...e, condition: "fair" as const };
      return e;
    });
    commit({ ...state, bookings, equipment });
  },

  cancelBooking(bookingId: string) {
    ensureLoaded();
    commit({
      ...state,
      bookings: state.bookings.map((b) =>
        b.id === bookingId && b.status === "booked" ? { ...b, status: "cancelled" } : b,
      ),
    });
  },

  /** Put repaired / found units back into circulation. */
  restoreUnits(equipmentId: string, count: number) {
    ensureLoaded();
    commit({
      ...state,
      equipment: state.equipment.map((e) =>
        e.id === equipmentId
          ? { ...e, unavailableUnits: Math.max(0, e.unavailableUnits - count) }
          : e,
      ),
    });
  },

  resetDemo() {
    ensureLoaded();
    commit(createSeed(todayISO()));
  },
};
