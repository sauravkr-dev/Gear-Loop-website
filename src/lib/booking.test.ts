import { describe, expect, it } from "vitest";
import {
  bookingPhase,
  dayCount,
  overdueDays,
  unitsFreeForRange,
  unitsFreeOnDay,
  validateBooking,
} from "./booking";
import type { Booking, Equipment } from "./types";

const TODAY = "2026-10-17";

const eq: Equipment = {
  id: "e1",
  name: "Cricket kit",
  sport: "cricket",
  description: "",
  communityId: "greenfield",
  owner: "Rohan",
  units: 3,
  unavailableUnits: 0,
  condition: "good",
  maxDays: 3,
  pickupPoint: "Locker",
  createdAt: "2026-09-01T10:00",
};

const booking = (over: Partial<Booking>): Booking => ({
  id: "b",
  equipmentId: "e1",
  borrower: "Test",
  units: 1,
  startDate: TODAY,
  endDate: TODAY,
  status: "booked",
  createdAt: "2026-10-10T10:00",
  pickedUpAt: null,
  returnedAt: null,
  returnCondition: null,
  returnNote: "",
  ...over,
});

describe("dayCount", () => {
  it("is inclusive", () => {
    expect(dayCount("2026-10-17", "2026-10-17")).toBe(1);
    expect(dayCount("2026-10-17", "2026-10-19")).toBe(3);
  });
});

describe("bookingPhase", () => {
  it("walks through the lifecycle", () => {
    expect(bookingPhase(booking({ startDate: "2026-10-20", endDate: "2026-10-21" }), TODAY)).toBe(
      "upcoming",
    );
    expect(bookingPhase(booking({}), TODAY)).toBe("pickup_due");
    expect(bookingPhase(booking({ status: "checked_out", endDate: "2026-10-19" }), TODAY)).toBe(
      "on_loan",
    );
    expect(bookingPhase(booking({ status: "checked_out" }), TODAY)).toBe("due_today");
    expect(
      bookingPhase(
        booking({ status: "checked_out", startDate: "2026-10-12", endDate: "2026-10-14" }),
        TODAY,
      ),
    ).toBe("overdue");
    expect(bookingPhase(booking({ startDate: "2026-10-10", endDate: "2026-10-11" }), TODAY)).toBe(
      "expired",
    );
    expect(bookingPhase(booking({ status: "cancelled" }), TODAY)).toBe("cancelled");
  });

  it("flags late returns", () => {
    const onTime = booking({
      status: "returned",
      endDate: "2026-10-12",
      returnedAt: "2026-10-12T09:00",
    });
    const late = booking({
      status: "returned",
      endDate: "2026-10-12",
      returnedAt: "2026-10-14T09:00",
    });
    expect(bookingPhase(onTime, TODAY)).toBe("returned");
    expect(bookingPhase(late, TODAY)).toBe("returned_late");
  });

  it("counts overdue days", () => {
    const b = booking({ status: "checked_out", startDate: "2026-10-12", endDate: "2026-10-14" });
    expect(overdueDays(b, TODAY)).toBe(3);
  });
});

describe("availability", () => {
  it("subtracts overlapping bookings per day", () => {
    const bookings = [
      booking({ id: "a", units: 2, startDate: "2026-10-18", endDate: "2026-10-19" }),
      booking({ id: "b", units: 1, startDate: "2026-10-19", endDate: "2026-10-20" }),
    ];
    expect(unitsFreeOnDay(eq, bookings, "2026-10-18", TODAY)).toBe(1);
    expect(unitsFreeOnDay(eq, bookings, "2026-10-19", TODAY)).toBe(0);
    expect(unitsFreeOnDay(eq, bookings, "2026-10-20", TODAY)).toBe(2);
    expect(unitsFreeForRange(eq, bookings, "2026-10-18", "2026-10-20", TODAY)).toBe(0);
  });

  it("does not double count bookings that never overlap in time", () => {
    const bookings = [
      booking({ id: "a", units: 2, startDate: "2026-10-18", endDate: "2026-10-18" }),
      booking({ id: "b", units: 2, startDate: "2026-10-19", endDate: "2026-10-19" }),
    ];
    expect(unitsFreeForRange(eq, bookings, "2026-10-18", "2026-10-19", TODAY)).toBe(1);
  });

  it("ignores cancelled, returned and expired bookings", () => {
    const bookings = [
      booking({ id: "a", status: "cancelled" }),
      booking({ id: "b", status: "returned" }),
      booking({ id: "c", startDate: "2026-10-01", endDate: "2026-10-02" }),
    ];
    expect(unitsFreeOnDay(eq, bookings, TODAY, TODAY)).toBe(3);
  });

  it("keeps an overdue item off the shelf until it is returned", () => {
    const overdue = booking({
      status: "checked_out",
      startDate: "2026-10-12",
      endDate: "2026-10-14",
    });
    expect(unitsFreeOnDay(eq, [overdue], "2026-10-25", TODAY)).toBe(2);
  });

  it("removes damaged units from circulation", () => {
    expect(unitsFreeOnDay({ ...eq, unavailableUnits: 1 }, [], TODAY, TODAY)).toBe(2);
  });
});

describe("validateBooking", () => {
  const input = {
    equipmentId: "e1",
    borrower: "Aarav",
    units: 1,
    startDate: "2026-10-18",
    endDate: "2026-10-19",
  };

  it("accepts a valid booking", () => {
    expect(validateBooking(eq, [], input, TODAY)).toBeNull();
  });

  it("rejects bad input", () => {
    expect(validateBooking(eq, [], { ...input, borrower: " " }, TODAY)).toMatch(/name/);
    expect(validateBooking(eq, [], { ...input, startDate: "2026-10-16" }, TODAY)).toMatch(/past/);
    expect(validateBooking(eq, [], { ...input, endDate: "2026-10-17" }, TODAY)).toMatch(
      /on or after/,
    );
    expect(validateBooking(eq, [], { ...input, endDate: "2026-10-25" }, TODAY)).toMatch(
      /at most 3 days/,
    );
    expect(validateBooking(eq, [], { ...input, units: 0 }, TODAY)).toMatch(/at least 1/);
  });

  it("rejects over-booking", () => {
    const taken = [booking({ units: 2, startDate: "2026-10-18", endDate: "2026-10-18" })];
    expect(validateBooking(eq, taken, { ...input, units: 2 }, TODAY)).toMatch(
      /Only 1 unit is free/,
    );
  });
});
