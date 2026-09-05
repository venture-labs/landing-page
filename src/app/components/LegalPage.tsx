import type { ReactNode } from "react";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";

/** Shared layout for legal pages (Impressum, Datenschutz) — plain, readable prose rather than the marketing-page treatment. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0e0d13] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 lg:px-12 pt-40 pb-32">
        <h1
          className="font-['sofia-pro',sans-serif] font-semibold text-white mb-12"
          style={{ fontSize: "var(--text-h2)" }}
        >
          {title}
        </h1>
        <div
          className="flex flex-col gap-6 text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed
            [&_h2]:text-white [&_h2]:font-medium [&_h2]:mt-4 [&_h2]:mb-1 [&_h2]:text-[length:var(--text-h3)]
            [&_address]:not-italic [&_a]:text-[#a318f8] [&_a]:hover:underline"
          style={{ fontSize: "var(--text-body)" }}
        >
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
