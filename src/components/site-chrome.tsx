import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Repeat2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import { actions, useGear } from "@/lib/store";

const NAV = [
  { to: "/equipment", label: "Browse gear" },
  { to: "/bookings", label: "My bookings" },
  { to: "/returns", label: "Return tracker" },
] as const;

function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { profileName } = useGear();
  const [name, setName] = useState(profileName);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setName(profileName);
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogTitle>Who's borrowing?</DialogTitle>
        <DialogDescription>
          Your name is used on bookings and to fill "My bookings". It's saved only in this browser.
        </DialogDescription>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            actions.setProfileName(name);
            onOpenChange(false);
            toast.success("Profile updated");
          }}
        >
          <Field label="Your name" htmlFor="profile-name">
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              autoComplete="name"
            />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                actions.resetDemo();
                onOpenChange(false);
                toast.success("Demo data reset");
              }}
            >
              Reset demo data
            </Button>
            <Button type="submit" variant="accent">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SiteHeader() {
  const { profileName } = useGear();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="bg-background/90 border-foreground sticky top-0 z-40 border-b-2 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2" aria-label="GearLoop home">
          <span className="bg-accent border-foreground flex size-9 items-center justify-center rounded-lg border-2 shadow-[2px_2px_0_0_var(--foreground)]">
            <Repeat2 className="size-5" strokeWidth={2.6} />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">GearLoop</span>
        </Link>

        <nav
          aria-label="Main"
          className="order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto"
        >
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="hover:bg-muted rounded-md px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors"
              activeProps={{ className: "bg-accent hover:bg-accent" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setProfileOpen(true)}
            aria-label="Edit profile"
          >
            <UserRound />
            <span className="max-w-28 truncate">{profileName}</span>
          </Button>
          <Button asChild size="sm" variant="accent">
            <Link to="/share">
              <Plus /> Share gear
            </Link>
          </Button>
        </div>
      </div>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-foreground mt-24 border-t-2 bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-display text-2xl font-extrabold">GearLoop</p>
          <p className="text-primary-foreground/70 max-w-sm text-sm">
            Community sports equipment sharing — bookings, live availability and return tracking in
            one loop.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          <Link to="/equipment" className="hover:text-accent">
            Browse gear
          </Link>
          <Link to="/bookings" className="hover:text-accent">
            My bookings
          </Link>
          <Link to="/returns" className="hover:text-accent">
            Return tracker
          </Link>
          <Link to="/share" className="hover:text-accent">
            Share gear
          </Link>
        </nav>
      </div>
    </footer>
  );
}
