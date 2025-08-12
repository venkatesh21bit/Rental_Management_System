"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Anchor from "@/components/retailer/anchor";
import { API_URL } from "@/utils/auth_fn";

export const NAVLINKS = [
  { title: "Dashboard", href: "/end-user" },
  { title: "My Products", href: "/end-user/products" },
  { title: "Add Product", href: "/end-user/add-product" },
  { title: "Orders", href: "/end-user/orders" },
  { title: "Analytics", href: "/end-user/analytics" },
  { title: "Profile", href: "/end-user/profile" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout/`, {
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
      localStorage.removeItem("user_role");
      router.replace("/authentication");
    }
  };

  return (
    <nav className="bg-black border-b border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
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
            <Link href="/end-user" className="flex shrink-0 items-center">
              <div className="bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg mr-3">
                V
              </div>
              <span className="text-xl font-bold text-white">Vendor Portal</span>
            </Link>
            <div className="hidden sm:ml-8 sm:block">
              <div className="flex space-x-1">
                {NAVLINKS.map((item) => (
                  <Anchor
                    key={item.title}
                    href={item.href}
                    activeClassName="bg-gray-800 text-white border-b-2 border-blue-500"
                    className="rounded-md px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
                  >
                    {item.title}
                  </Anchor>
                ))}
              </div>
            </div>
          </div>
          {/* Right section: Log out button */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors duration-200"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className={`sm:hidden ${mobileOpen ? "block" : "hidden"} bg-gray-800`} id="mobile-menu">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {NAVLINKS.map((item) => (
            <Anchor
              key={item.title}
              href={item.href}
              activeClassName="bg-gray-700 text-white border-l-4 border-blue-500"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              {item.title}
            </Anchor>
          ))}
        </div>
      </div>
    </nav>
  );
}
