"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "@/components/ui/Container";

const navLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#examples", label: "Examples" },
  { href: "/pricing", label: "Pricing" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#fcf9f8]/80 border-b border-[#f3eae7]">
      <Container className="flex h-20 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M12 2a7 7 0 0 1 7 7c0 2.02-.85 3.85-2.22 5.15l.01.02L12 20l-4.79-5.83A7 7 0 0 1 12 2Zm0 2a5 5 0 0 0-5 5 5 5 0 0 0 1.17 3.24L12 17.2l3.83-4.96A5 5 0 0 0 17 9a5 5 0 0 0-5-5Zm0 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1b110e]">
            Supriseal
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => {
            const isActive =
              href === "/pricing"
                ? pathname === "/pricing"
                : false;
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm font-semibold transition-colors ${
                  isActive
                    ? "text-primary border-b-2 border-primary pb-0.5"
                    : "text-[#1b110e] hover:text-primary"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden md:block text-sm font-semibold text-[#1b110e] hover:text-primary transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/create"
            className="flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-[0_4px_20px_-2px_rgba(230,76,25,0.2)] hover:shadow-[0_8px_25px_-2px_rgba(230,76,25,0.35)]"
          >
            Create Your Moment
          </Link>
        </div>
      </Container>
    </header>
  );
}
