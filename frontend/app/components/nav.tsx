"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/cn";

const links = [
  { href: "/", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/working-hours", label: "Working Hours" },
];

// Tab-style navigation with a clearly raised active state.
export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 rounded-lg bg-surface-2 p-1">
      {links.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-surface text-ink shadow-sm dark:bg-white/10 dark:shadow-none"
                : "text-ink-2 hover:text-ink",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
