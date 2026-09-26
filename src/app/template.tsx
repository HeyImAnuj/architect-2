"use client";

import { ViewTransition, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const pageMotion = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "fade-page",
} as const;

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ViewTransition key={pathname} enter={pageMotion} exit={pageMotion}>
      <div className="flex min-h-[calc(100dvh-2.75rem)] w-full flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
