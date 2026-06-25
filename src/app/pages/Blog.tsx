import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";

export function Blog() {
  return (
    <div className="min-h-screen bg-[#0e0d13] text-white">
      <Navbar />
      <section className="pt-40 pb-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <h1
          className="font-['sofia-pro',sans-serif] font-semibold text-white leading-[1.05]"
          style={{ fontSize: "var(--text-hero)" }}
        >
          Blog
        </h1>
        <p
          className="text-white/60 font-['sofia-pro',sans-serif] font-light mt-6 max-w-2xl"
          style={{ fontSize: "var(--text-body)" }}
        >
          Diese Seite kommt noch.
        </p>
      </section>
      <Footer />
    </div>
  );
}
