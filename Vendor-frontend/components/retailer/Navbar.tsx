import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Anchor from "@/components/retailer/anchor";

export const NAVLINKS = [
  { title: "Dashboard", href: "/retailer/dashboard" },
  { title: "Orders", href: "/retailer/orders" },
  { title: "Products", href: "/retailer/products" },
  { title: "Deliveries", href: "/retailer/deliveries" },
  { title: "Payments", href: "/retailer/payments" },
  { title: "Profile", href: "/retailer/profile" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
    } catch (e) {
      // Optionally handle error
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_id");
      router.replace("/authentication");
    }
  };

  return (
    <nav className="bg-neutral-900 border-b border-neutral-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-neutral-400 hover:bg-neutral-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`${mobileOpen ? "hidden" : "block"} h-6 w-6`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              {/* Close icon */}
              <svg
                className={`${mobileOpen ? "block" : "hidden"} h-6 w-6`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Logo and desktop nav */}
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <Link href="/retailer/dashboard" className="flex shrink-0 items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="ml-2 text-lg font-bold text-blue-400">Retailer Portal</span>
            </Link>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {NAVLINKS.map((item) => (
                  <Anchor
                    key={item.title}
                    href={item.href}
                    activeClassName="bg-neutral-800 text-white"
                    className="rounded-md px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                  >
                    {item.title}
                  </Anchor>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right section: User menu and logout */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <div className="relative ml-3">
              <button
                onClick={handleLogout}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`sm:hidden ${mobileOpen ? "block" : "hidden"}`} id="mobile-menu">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {NAVLINKS.map((item) => (
            <Anchor
              key={item.title}
              href={item.href}
              activeClassName="bg-neutral-800 text-white"
              className="block rounded-md px-3 py-2 text-base font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item.title}
            </Anchor>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function Logo() {
  return (
    <Link href="/retailer/dashboard" className="flex items-center gap-2.5">
      <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">R</span>
      </div>
      <h2 className="text-md font-bold font-code text-blue-400">Retailer</h2>
    </Link>
  );
}

export function NavMenu() {
  return (
    <>
      {NAVLINKS.map((item) => (
        <Anchor
          key={item.title + item.href}
          activeClassName="!text-blue-400 dark:font-medium font-semibold"
          absolute
          className="flex items-center gap-1 dark:text-neutral-300/85 text-neutral-800 hover:text-blue-400 transition-colors"
          href={item.href}
        >
          {item.title}
        </Anchor>
      ))}
    </>
  );
}