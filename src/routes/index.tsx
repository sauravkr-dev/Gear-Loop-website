import { ClientOnly, Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck2,
  Gauge,
  HeartHandshake,
  PackageCheck,
  Repeat2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EquipmentCard } from "@/components/gear";
import { COMMUNITIES, SPORTS } from "@/lib/catalog";
import { bookingPhase, todayISO, unitsFreeOnDay } from "@/lib/booking";
import { useGear } from "@/lib/store";
import { plural } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <>
      <Hero />
      <ClientOnly fallback={<div className="h-28" />}>
        <LiveStats />
      </ClientOnly>
      <HowItWorks />
      <ClientOnly fallback={<div className="h-96" />}>
        <Featured />
      </ClientOnly>
      <Sports />
      <ClientOnly fallback={null}>
        <Communities />
      </ClientOnly>
      <ShareCta />
    </>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 lg:grid-cols-[1.2fr_1fr] lg:pt-20">
      <div className="space-y-6">
        <p className="eyebrow flex items-center gap-2">
          <Sparkles className="size-4" /> Sports &amp; fitness · community sharing
        </p>
        <h1 className="text-5xl leading-[0.98] font-extrabold sm:text-7xl">
          Don't buy it.
          <br />
          <span className="bg-accent border-foreground -ml-1 inline-block -rotate-1 rounded-lg border-2 px-2 shadow-[4px_4px_0_0_var(--foreground)]">
            Borrow it
          </span>{" "}
          from your block.
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          One cricket kit, a pile of yoga mats, a bicycle that sits idle on weekdays. GearLoop lets
          your community share sports equipment through{" "}
          <strong className="text-foreground">bookings</strong>,{" "}
          <strong className="text-foreground">live availability</strong> and{" "}
          <strong className="text-foreground">return tracking</strong> — so everything finds its way
          back.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="accent">
            <Link to="/equipment">
              Browse gear <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/share">Share your gear</Link>
          </Button>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-sm lg:max-w-none" aria-hidden>
        <div className="sticker bg-accent relative z-10 rotate-2 p-6 pb-24">
          <p className="font-display text-5xl font-extrabold">03</p>
          <p className="eyebrow mt-1 !text-foreground">Sports &amp; fitness</p>
          <p className="font-display mt-3 text-2xl leading-tight font-bold">
            Let communities share sports equipment through bookings, availability and return
            tracking.
          </p>
        </div>
        <div className="sticker absolute -bottom-10 -left-4 z-20 w-60 -rotate-3 space-y-2 p-4 sm:-left-10">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🏏</span>
            <span className="bg-success-soft text-success border-success/40 rounded-full border px-2.5 py-0.5 text-xs font-bold">
              2 of 3 free today
            </span>
          </div>
          <p className="font-display leading-tight font-bold">
            Cricket kit — bat, ball &amp; stumps
          </p>
          <div className="grid grid-cols-7 gap-1">
            {[0, 0, 1, 1, 0, 2, 0].map((s, i) => (
              <span
                key={i}
                className={
                  "h-5 rounded " +
                  (s === 0 ? "bg-success-soft" : s === 1 ? "bg-accent" : "bg-danger-soft")
                }
              />
            ))}
          </div>
        </div>
        <div className="sticker-sm bg-card absolute -top-6 -right-2 z-20 -rotate-6 px-3 py-2 text-sm font-bold sm:-right-6">
          ⏰ Due back today
        </div>
      </div>
    </section>
  );
}

function LiveStats() {
  const { equipment, bookings } = useGear();
  const today = todayISO();
  const phases = bookings.map((b) => bookingPhase(b, today));
  const stats = [
    {
      label: "Items to borrow",
      value: equipment.reduce((n, e) => n + e.units - e.unavailableUnits, 0),
    },
    {
      label: "Out on loan now",
      value: phases.filter((p) => p === "on_loan" || p === "due_today" || p === "overdue").length,
    },
    {
      label: "Returned safely",
      value: phases.filter((p) => p === "returned" || p === "returned_late").length,
    },
    { label: "Overdue", value: phases.filter((p) => p === "overdue").length },
  ];
  return (
    <section aria-label="Live numbers" className="mx-auto max-w-6xl px-4">
      <dl className="sticker grid grid-cols-2 divide-x-2 divide-y-2 divide-foreground overflow-hidden sm:grid-cols-4 sm:divide-y-0">
        {stats.map((s) => (
          <div key={s.label} className="px-5 py-5">
            <dd className="font-display text-4xl font-extrabold">{s.value}</dd>
            <dt className="text-muted-foreground text-sm font-medium">{s.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: CalendarCheck2,
      title: "Book it",
      body: "Pick the days you need on a calendar. Fully booked days are crossed out, so you never turn up to an empty locker.",
    },
    {
      icon: Gauge,
      title: "See availability, live",
      body: "Every item shows how many units are free today and on every upcoming day — including what's still out on loan.",
    },
    {
      icon: PackageCheck,
      title: "Track the return",
      body: "Booked → picked up → returned. Overdue gear is flagged, condition is logged, and damaged units are pulled until repaired.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 pt-20">
      <p className="eyebrow">How it works</p>
      <h2 className="mt-2 max-w-2xl text-3xl font-extrabold sm:text-4xl">
        One loop. Three steps. Nothing goes missing.
      </h2>
      <ol className="mt-8 grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="sticker flex flex-col gap-3 p-6">
            <div className="flex items-center justify-between">
              <span className="bg-accent border-foreground flex size-11 items-center justify-center rounded-lg border-2">
                <s.icon className="size-5" />
              </span>
              <span className="font-display text-4xl font-extrabold opacity-20">0{i + 1}</span>
            </div>
            <h3 className="text-xl font-bold">{s.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Featured() {
  const { equipment, bookings } = useGear();
  const today = todayISO();
  const picks = [...equipment]
    .sort(
      (a, b) =>
        unitsFreeOnDay(b, bookings, today, today) - unitsFreeOnDay(a, bookings, today, today),
    )
    .slice(0, 6);
  return (
    <section className="mx-auto max-w-6xl px-4 pt-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Ready right now</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Most available today</h2>
        </div>
        <Button asChild variant="outline">
          <Link to="/equipment">
            See all {equipment.length} <ArrowRight />
          </Link>
        </Button>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {picks.map((e) => (
          <EquipmentCard key={e.id} equipment={e} bookings={bookings} />
        ))}
      </div>
    </section>
  );
}

function Sports() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-20">
      <p className="eyebrow">Every game</p>
      <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Find gear by sport</h2>
      <ul className="mt-6 flex flex-wrap gap-3">
        {SPORTS.map((s) => (
          <li key={s.id}>
            <Link
              to="/equipment"
              search={{ sport: s.id }}
              className="sticker-sm hover:bg-accent flex items-center gap-2 px-4 py-2 text-sm font-bold transition-colors"
            >
              <span className="text-lg">{s.emoji}</span> {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Communities() {
  const { equipment } = useGear();
  return (
    <section className="mx-auto max-w-6xl px-4 pt-20">
      <p className="eyebrow">Neighbourhoods on GearLoop</p>
      <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Shared by communities like yours</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {COMMUNITIES.map((c) => {
          const items = equipment.filter((e) => e.communityId === c.id);
          return (
            <Link
              key={c.id}
              to="/equipment"
              search={{ community: c.id }}
              className="sticker group flex flex-col gap-2 p-5 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              <HeartHandshake className="size-6" />
              <h3 className="text-xl font-bold group-hover:underline">{c.name}</h3>
              <p className="text-muted-foreground text-sm">
                {c.area} · {plural(items.length, "listing")}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ShareCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-20">
      <div className="sticker bg-accent flex flex-col items-start gap-5 p-8 sm:p-12">
        <Repeat2 className="size-10" />
        <h2 className="max-w-2xl text-3xl font-extrabold sm:text-5xl">
          Got a racket gathering dust? Put it in the loop.
        </h2>
        <p className="max-w-xl text-lg">
          List it in a minute, set how long people can keep it, and let the tracker handle the rest.
        </p>
        <Button asChild size="lg">
          <Link to="/share">
            Share your gear <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
