import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Activity } from "lucide-react";
import { NavLink } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-background via-background to-muted/30",
        className,
      )}
    >
      <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold leading-tight">
                ServiceNow Incident Dashboard
              </div>
              <div className="text-xs text-muted-foreground">
                Realtime status overview
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            {[
              { label: "Dashboard", to: "/" },
              { label: "API Console", to: "/puseapi" },
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="container py-8">{children}</main>
      <Separator className="my-8" />
      <footer className="container pb-8 text-xs text-muted-foreground">
        Built for vflixprime@gmail.com • {new Date().getFullYear()}
      </footer>
    </div>
  );
}
