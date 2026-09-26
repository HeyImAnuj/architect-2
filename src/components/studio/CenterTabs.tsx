"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { centerTabLabel, isCenterTab, type CenterTab } from "@/lib/studio-catalog";

export function CenterTabs<T extends CenterTab>({
  tabs,
  active,
  onFocus,
  onClose,
}: {
  tabs: T[];
  active: T | null;
  onFocus: (id: T) => void;
  onClose: (id: T) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scroller.current;
    const current = root?.querySelector<HTMLElement>("[data-active='true']");
    if (!root || !current) return;
    const rootBox = root.getBoundingClientRect();
    const box = current.getBoundingClientRect();
    if (box.left < rootBox.left) root.scrollLeft -= rootBox.left - box.left;
    else if (box.right > rootBox.right) root.scrollLeft += box.right - rootBox.right;
  }, [active, tabs]);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    function onWheel(event: WheelEvent) {
      if (!root || root.scrollWidth <= root.clientWidth) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      root.scrollLeft += event.deltaY;
    }
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="h-9 min-w-0 shrink-0 overflow-hidden border-b border-[#eceef2] bg-[#eef0f3]">
      <div
        ref={scroller}
        className="tab-scroller h-full overflow-x-auto overflow-y-hidden whitespace-nowrap px-2 pt-[3px]"
      >
        {tabs.map((id) => {
          const label = isCenterTab(id) ? centerTabLabel(id) : id;
          const focused = id === active;
          return (
            <button
              key={id}
              data-active={focused}
              onClick={() => onFocus(id)}
              className={`mr-1 inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-t-md px-3 align-bottom text-[13px] leading-none ${
                focused ? "bg-white text-paper" : "text-[#5b6472] hover:bg-white/70"
              }`}
            >
              {label}
              <span
                role="button"
                aria-label={`Close ${label}`}
                className="text-[#8b93a1] hover:text-paper"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose(id);
                }}
              >
                <X className="h-3 w-3" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
