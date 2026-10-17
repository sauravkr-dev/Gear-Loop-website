import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!border-2 !border-foreground !bg-card !text-foreground !shadow-[3px_3px_0_0_var(--foreground)] !rounded-lg !font-sans",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
