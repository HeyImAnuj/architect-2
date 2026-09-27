"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function ChoiceMenu({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((item) => item.value === value);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="input flex w-full items-center justify-between gap-2 text-left"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="min-w-0">{current?.label || "Choose"}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: easeOut }}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[#eceef2] bg-white p-1.5 shadow-lg"
          >
            {options.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`w-full whitespace-normal break-words rounded-lg px-2.5 py-2 text-left text-sm leading-snug text-paper hover:bg-panel-2 ${
                  item.value === value ? "bg-panel-2" : ""
                }`}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
