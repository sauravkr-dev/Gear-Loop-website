import { useMemo } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCard } from "@/components/booking-card";
import { EmptyState, PageHeader } from "@/components/gear";
import { bookingPhase, todayISO } from "@/lib/booking";
import { useGear } from "@/lib/store";

export const Route = createFileRoute("/bookings")({
  ssr: false,
  head: () => ({ meta: [{ title: "My bookings — GearLoop" }] }),
  component: MyBookings,
});

function MyBookings() {
  const { bookings, equipment, profileName } = useGear();
  const today = todayISO();

  const { active, past } = useMemo(() => {
    const mine = bookings.filter(
      (b) => b.borrower.trim().toLowerCase() === profileName.trim().toLowerCase(),
    );
    const isActive = (b: (typeof mine)[number]) =>
      ["upcoming", "pickup_due", "on_loan", "due_today", "overdue"].includes(
        bookingPhase(b, today),
      );
    return {
      active: mine.filter(isActive).sort((a, b) => a.startDate.localeCompare(b.startDate)),
      past: mine.filter((b) => !isActive(b)).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    };
  }, [bookings, profileName, today]);

  const find = (id: string) => equipment.find((e) => e.id === id);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <PageHeader eyebrow="Your gear" title="My bookings">
        Booked as <strong className="text-foreground">{profileName}</strong>. Pick up, return and
        track everything you've borrowed.
      </PageHeader>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="past">History ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-5">
          {active.length === 0 ? (
            <EmptyState
              title="Nothing booked"
              action={
                <Button asChild variant="accent">
                  <Link to="/equipment">Find something to borrow</Link>
                </Button>
              }
            >
              Your upcoming and in-hand gear will show up here.
            </EmptyState>
          ) : (
            active.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                equipment={find(b.equipmentId)}
                showBorrower={false}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-5">
          {past.length === 0 ? (
            <EmptyState title="No history yet">
              Returned and cancelled bookings land here.
            </EmptyState>
          ) : (
            past.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                equipment={find(b.equipmentId)}
                showBorrower={false}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
