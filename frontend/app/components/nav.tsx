"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/projects", label: "Projects" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-4 text-zinc-800">
      {links.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`font-medium hover:underline ${
              active ? "underline underline-offset-4" : ""
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
