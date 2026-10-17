export type Condition = "excellent" | "good" | "fair";
export type ReturnCondition = "good" | "worn" | "damaged" | "missing";
export type BookingStatus = "booked" | "checked_out" | "returned" | "cancelled";

export type SportId =
  | "cricket"
  | "badminton"
  | "football"
  | "basketball"
  | "tennis"
  | "table-tennis"
  | "volleyball"
  | "fitness"
  | "yoga"
  | "cycling"
  | "swimming"
  | "indoor"
  | "outdoor";

export interface Community {
  id: string;
  name: string;
  area: string;
}

export interface Equipment {
  id: string;
  name: string;
  sport: SportId;
  description: string;
  communityId: string;
  owner: string;
  /** Total units the community owns. */
  units: number;
  /** Units taken out of circulation (damaged / missing) until restored. */
  unavailableUnits: number;
  condition: Condition;
  /** Longest single booking allowed, in days. */
  maxDays: number;
  pickupPoint: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  equipmentId: string;
  borrower: string;
  units: number;
  /** yyyy-MM-dd (local) */
  startDate: string;
  /** yyyy-MM-dd (local), inclusive */
  endDate: string;
  status: BookingStatus;
  createdAt: string;
  /** yyyy-MM-ddTHH:mm (local) */
  pickedUpAt: string | null;
  returnedAt: string | null;
  returnCondition: ReturnCondition | null;
  returnNote: string;
}

export interface GearState {
  profileName: string;
  equipment: Equipment[];
  bookings: Booking[];
}
