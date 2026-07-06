// Marketing and landing experience for the OnBoard product.

import Link from 'next/link';

const features = [
  {
    title: 'Paste your board',
    description: 'Drop in any public Pinterest board link to start your style scan.',
  },
  {
    title: 'We read your aesthetic',
    description: 'AI identifies the mood, palette, and wardrobe cues behind the pins.',
  },
  {
    title: 'Shop your look',
    description: 'Browse curated product matches tailored to the vibe you shared.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-navy">
      <section className="bg-navy px-6 py-20 text-white sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <div className="max-w-3xl space-y-6">
            <p className="text-sm uppercase tracking-[0.35em] text-sky">OnBoard</p>
            <h1 className="font-display text-5xl leading-tight sm:text-6xl lg:text-7xl">
              Shop the board.
            </h1>
            <p className="max-w-xl text-lg text-slate-200">
              Paste a Pinterest board. Get a curated closet.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-navy transition hover:scale-[1.02]"
              >
                Explore Boards →
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full border border-white px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-sky/60 bg-sand p-8 shadow-sm">
              <h2 className="mb-3 font-display text-2xl text-navy">{feature.title}</h2>
              <p className="text-base text-muted">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

    </main>
  );
}
