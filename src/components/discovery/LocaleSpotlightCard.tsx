import { LocaleSpotlight } from "@/lib/mock-discovery-data";

export function LocaleSpotlightCard({ spotlight }: { spotlight: LocaleSpotlight }) {
  return (
    <section className="card fade-in p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3A4F7A]">Locale Spotlight</p>
      <h2 className="mt-1 text-lg font-semibold text-[#1E1E1E]">Why {spotlight.city} is special</h2>
      <p className="mt-2 text-sm text-slate-700">{spotlight.hook}</p>
      <p className="mt-2 text-sm text-slate-600">{spotlight.history}</p>
      <p className="mt-2 text-sm text-slate-600">{spotlight.culture}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {spotlight.images.map((image) => (
          <div
            key={image}
            className="h-20 rounded-lg"
            style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        ))}
      </div>
    </section>
  );
}
