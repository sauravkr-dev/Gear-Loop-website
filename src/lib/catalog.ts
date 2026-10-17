import type { Community, Condition, ReturnCondition, SportId } from "./types";

export interface SportMeta {
  id: SportId;
  label: string;
  emoji: string;
  /** OKLCH hue used to tint the equipment tile. */
  hue: number;
}

export const SPORTS: SportMeta[] = [
  { id: "cricket", label: "Cricket", emoji: "🏏", hue: 150 },
  { id: "badminton", label: "Badminton", emoji: "🏸", hue: 95 },
  { id: "football", label: "Football", emoji: "⚽", hue: 250 },
  { id: "basketball", label: "Basketball", emoji: "🏀", hue: 50 },
  { id: "tennis", label: "Tennis", emoji: "🎾", hue: 120 },
  { id: "table-tennis", label: "Table tennis", emoji: "🏓", hue: 20 },
  { id: "volleyball", label: "Volleyball", emoji: "🏐", hue: 80 },
  { id: "fitness", label: "Gym & fitness", emoji: "🏋️", hue: 300 },
  { id: "yoga", label: "Yoga", emoji: "🧘", hue: 335 },
  { id: "cycling", label: "Cycling", emoji: "🚴", hue: 205 },
  { id: "swimming", label: "Swimming", emoji: "🏊", hue: 225 },
  { id: "indoor", label: "Indoor games", emoji: "🎯", hue: 10 },
  { id: "outdoor", label: "Hiking & camping", emoji: "⛺", hue: 175 },
];

export function sportMeta(id: SportId): SportMeta {
  return SPORTS.find((s) => s.id === id) ?? SPORTS[0]!;
}

export const COMMUNITIES: Community[] = [
  { id: "greenfield", name: "Greenfield Heights", area: "Residential society" },
  { id: "riverside", name: "Riverside Sports Club", area: "Neighbourhood club" },
  { id: "campus", name: "City Campus Hub", area: "College campus" },
];

export function communityName(id: string): string {
  return COMMUNITIES.find((c) => c.id === id)?.name ?? "Community";
}

export const CONDITIONS: { id: Condition; label: string }[] = [
  { id: "excellent", label: "Excellent — like new" },
  { id: "good", label: "Good — normal wear" },
  { id: "fair", label: "Fair — still playable" },
];

export const RETURN_CONDITIONS: { id: ReturnCondition; label: string; hint: string }[] = [
  { id: "good", label: "Good", hint: "Returned as it was" },
  { id: "worn", label: "Worn", hint: "Playable, shows wear" },
  { id: "damaged", label: "Damaged", hint: "Needs repair — pulled from circulation" },
  { id: "missing", label: "Missing parts", hint: "Incomplete — pulled from circulation" },
];
