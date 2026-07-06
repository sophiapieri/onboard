import Image from 'next/image';
import Link from 'next/link';
import headshot from '../../../docs/Headshot.png';

export default function AboutPage() {
  const founderName = 'Sophia Pieri';
  const founderBio = 'OnBoard was built to make fashion discovery feel more personal, thoughtful, and effortless. I created it to help people turn inspiration into a curated wardrobe without the overwhelm of endless scrolling.';
  const founderHeadline = 'Founder & Creator';
  const linkedinUrl = 'https://www.linkedin.com/in/sophia-pieri-vanderbilt';

  return (
    <main className="min-h-screen bg-[#F5F5F0] px-4 py-10 text-navy sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-[32px] border border-sky/60 bg-white p-8 shadow-[0_18px_55px_-24px_rgba(0,28,87,0.32)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">About OnBoard</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">What OnBoard does</h1>
          <p className="mt-5 max-w-3xl text-lg text-muted">
            OnBoard turns a Pinterest board into a curated shopping experience. Paste a public board, and the platform helps translate its mood and style into fashion picks you can actually browse and save.
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-stretch">
          <div className="flex h-full flex-col rounded-[32px] border border-sky/60 bg-white p-8 shadow-sm lg:pr-12">
            <h2 className="font-display text-2xl text-navy">Why it was made</h2>
            <p className="mt-4 text-base leading-7 text-muted">
              OnBoard was created for people who feel inspired by online style but want a simpler, more intentional way to shop. Instead of piecing together ideas from scattered photos, it brings the aesthetic into one place and makes it easier to discover products that fit the vibe.
            </p>
          </div>

          <div className="flex h-full flex-col rounded-[32px] border border-sky/60 bg-white p-8 shadow-sm lg:pl-12">
            <h2 className="font-display text-2xl text-navy">Meet the founder</h2>
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-sky/70 bg-sky/70">
                <Image src={headshot} alt={founderName} width={80} height={80} className="h-full w-full object-cover" />
              </div>
              <div>
                <h3 className="font-display text-xl text-navy">{founderName}</h3>
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-muted">{founderHeadline}</p>
              </div>
              <p className="text-sm leading-7 text-muted">{founderBio}</p>
              <Link href={linkedinUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy underline underline-offset-4">
                Connect on LinkedIn →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
