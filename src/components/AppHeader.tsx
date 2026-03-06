"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/favorites", label: "Saved" },
  { href: "/in-progress", label: "Queue" },
  { href: "/map", label: "Map" },
  { href: "/add", label: "+ Activity" },
  { href: "/login", label: "Login" }
];

export function AppHeader() {
  const [showScrollTopBar, setShowScrollTopBar] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTopBar(window.scrollY > 140);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <header className="mx-auto w-full max-w-[420px] px-4 pb-3 pt-5">
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
          <span>🎲</span>
          <span>Get Out</span>
        </Link>
        <nav className="mt-3 grid grid-cols-3 gap-2 text-sm sm:grid-cols-5">
          {navItems.map((item) => (
            <Link key={item.href} className="nav-pill text-center" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {showScrollTopBar && (
        <button className="scroll-top-brandbar" onClick={toTop} aria-label="Return to top">
          <span>🎲</span>
          <span>Get Out</span>
        </button>
      )}
    </>
  );
}
