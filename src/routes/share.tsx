import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader, SportTile } from "@/components/gear";
import { COMMUNITIES, CONDITIONS, SPORTS } from "@/lib/catalog";
import { actions, useGear } from "@/lib/store";
import type { SportId } from "@/lib/types";

export const Route = createFileRoute("/share")({
  ssr: false,
  head: () => ({ meta: [{ title: "Share gear — GearLoop" }] }),
  component: ShareGear,
});

const schema = z.object({
  name: z.string().trim().min(3, "Give it a clear name (3+ characters)").max(70),
  sport: z.enum(SPORTS.map((s) => s.id) as [SportId, ...SportId[]]),
  communityId: z.string().min(1),
  owner: z.string().trim().min(2, "Who is sharing this?").max(40),
  units: z.number().int("Whole numbers only").min(1, "At least 1").max(50, "Max 50"),
  condition: z.enum(["excellent", "good", "fair"]),
  maxDays: z.number().int("Whole numbers only").min(1, "At least 1 day").max(30, "Max 30 days"),
  pickupPoint: z.string().trim().min(3, "Where should people collect it?").max(70),
  description: z
    .string()
    .trim()
    .min(10, "A sentence or two helps borrowers (10+ characters)")
    .max(280),
});

type FormState = {
  name: string;
  sport: SportId;
  communityId: string;
  owner: string;
  units: number;
  condition: "excellent" | "good" | "fair";
  maxDays: number;
  pickupPoint: string;
  description: string;
};

function ShareGear() {
  const { profileName } = useGear();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    name: "",
    sport: "cricket",
    communityId: COMMUNITIES[0]!.id,
    owner: profileName,
    units: 1,
    condition: "good",
    maxDays: 3,
    pickupPoint: "",
    description: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    const item = actions.addEquipment(parsed.data);
    toast.success("Your gear is in the loop", { description: `${item.name} is now bookable.` });
    void navigate({ to: "/equipment/$id", params: { id: item.id } });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PageHeader eyebrow="Share" title="Put your gear in the loop">
        List something your community can borrow. Set how many units there are, how long people can
        keep it and where to collect it.
      </PageHeader>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={submit} className="sticker grid gap-5 p-6 sm:grid-cols-2" noValidate>
          <Field
            label="What are you sharing?"
            htmlFor="name"
            error={errors.name}
            className="sm:col-span-2"
          >
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Yonex badminton racket pair"
              aria-invalid={!!errors.name}
            />
          </Field>

          <Field label="Sport" htmlFor="sport">
            <Select
              id="sport"
              value={form.sport}
              onChange={(e) => set("sport", e.target.value as SportId)}
            >
              {SPORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Community" htmlFor="community">
            <Select
              id="community"
              value={form.communityId}
              onChange={(e) => set("communityId", e.target.value)}
            >
              {COMMUNITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Shared by" htmlFor="owner" error={errors.owner}>
            <Input
              id="owner"
              value={form.owner}
              onChange={(e) => set("owner", e.target.value)}
              aria-invalid={!!errors.owner}
            />
          </Field>

          <Field label="Condition" htmlFor="condition">
            <Select
              id="condition"
              value={form.condition}
              onChange={(e) => set("condition", e.target.value as FormState["condition"])}
            >
              {CONDITIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Units available"
            htmlFor="units"
            error={errors.units}
            hint="How many can be out at the same time?"
          >
            <Input
              id="units"
              type="number"
              min={1}
              value={form.units}
              onChange={(e) => set("units", Number(e.target.value))}
              aria-invalid={!!errors.units}
            />
          </Field>

          <Field label="Max days per booking" htmlFor="maxDays" error={errors.maxDays}>
            <Input
              id="maxDays"
              type="number"
              min={1}
              value={form.maxDays}
              onChange={(e) => set("maxDays", Number(e.target.value))}
              aria-invalid={!!errors.maxDays}
            />
          </Field>

          <Field
            label="Pickup point"
            htmlFor="pickup"
            error={errors.pickupPoint}
            className="sm:col-span-2"
          >
            <Input
              id="pickup"
              value={form.pickupPoint}
              onChange={(e) => set("pickupPoint", e.target.value)}
              placeholder="e.g. Clubhouse locker 4"
              aria-invalid={!!errors.pickupPoint}
            />
          </Field>

          <Field
            label="Description"
            htmlFor="description"
            error={errors.description}
            className="sm:col-span-2"
          >
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What's included? Any care instructions?"
              aria-invalid={!!errors.description}
            />
          </Field>

          <div className="sm:col-span-2">
            <Button type="submit" variant="accent" size="lg">
              <Share2 /> Publish to the community
            </Button>
          </div>
        </form>

        <aside className="space-y-3 lg:sticky lg:top-24" aria-label="Preview">
          <p className="eyebrow">Live preview</p>
          <div className="sticker space-y-3 p-3">
            <SportTile sport={form.sport} />
            <div className="space-y-1 px-1 pb-1">
              <p className="eyebrow">{SPORTS.find((s) => s.id === form.sport)?.label}</p>
              <p className="font-display text-lg leading-tight font-bold">
                {form.name || "Your gear name"}
              </p>
              <p className="text-muted-foreground text-xs">
                {form.units || 1} {Number(form.units) === 1 ? "unit" : "units"} · up to{" "}
                {form.maxDays || 1} days · {form.pickupPoint || "pickup point"}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
