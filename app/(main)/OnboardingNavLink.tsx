"use client";
import React from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";

export default function OnboardingNavLink({
  slug,
  children,
}: {
  slug?: string;
  children: React.ReactNode;
}) {
  const pathname = useSelectedLayoutSegment();
  const selected = (slug == null && pathname == null) || pathname === slug;

  return (
    <Link
      href={`/onboarding/${slug ?? ""}`}
      className={clsx(
        selected && "text-stone-50",
        !selected && "text-stone-400 hover:text-stone-50",
      )}
      children={children}
    />
  );
}