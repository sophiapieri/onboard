'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useGuestSession } from '@/lib/hooks/useGuestSession';
import type { PreferredGender } from '@/types';

const aestheticPillsByGender: Record<PreferredGender, string[]> = {
  women: ['Coastal Grandma', 'Dark Academia', 'Clean Girl', 'Quiet Luxury', 'Y2K Revival', 'Cottagecore'],
  men: ['Streetwear', 'Tailored', 'Old Money', 'Minimalist', 'Workwear', 'Quiet Luxury'],
};

export default function ExplorePage() {
  const router = useRouter();
  const { saveGuestBoard } = useGuestSession();
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [selectedGender, setSelectedGender] = useState<PreferredGender>('women');
  const [error, setError] = useState('');

  const handleExplore = async () => {
    if (!pinterestUrl.includes('pinterest.com')) {
      setError('Please enter a valid Pinterest board URL.');
      return;
    }

    setError('');
    const response = await fetch('/api/analyze-board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinterestUrl: pinterestUrl.trim(), pageName: 'New board', gender: selectedGender }),
    });

    const board = await response.json();
    if (response.ok && board?.id) {
      saveGuestBoard(board);
      router.push('/board/preview');
      return;
    }

    setError('We could not create your board right now. Please try again.');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-navy">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-sky/60 bg-white p-8 shadow-[0_18px_55px_-24px_rgba(0,28,87,0.32)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">Public discovery</p>
          <h1 className="mt-3 font-display text-4xl">What&apos;s your aesthetic?</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">Paste a public Pinterest board link to start your curated shopping page.</p>

          <div className="mt-6 flex flex-col gap-3 rounded-[24px] border border-sky/60 bg-sand p-4 sm:flex-row">
            <input
              value={pinterestUrl}
              onChange={(event) => setPinterestUrl(event.target.value)}
              placeholder="https://www.pinterest.com/username/board-name/"
              className="flex-1 rounded-full border border-sky/70 bg-white px-4 py-3 text-sm outline-none focus:border-navy"
            />
            <div className="flex flex-wrap gap-2">
              {(['women', 'men'] as PreferredGender[]).map((value) => {
                const active = selectedGender === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedGender(value)}
                    className={`rounded-full px-3 py-2 text-sm transition ${active ? 'bg-navy text-white' : 'border border-navy bg-white text-navy'}`}
                  >
                    {value === 'women' ? 'Women' : 'Men'}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => void handleExplore()} className="rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white">
              Explore →
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <p className="mt-3 text-sm text-muted">No account needed.</p>
        </section>

        <section className="rounded-[32px] border border-sky/60 bg-white p-8 shadow-[0_18px_55px_-24px_rgba(0,28,87,0.32)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Popular aesthetics</h2>
            <div className="flex flex-wrap gap-2">
              {(['women', 'men'] as PreferredGender[]).map((value) => {
                const active = selectedGender === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedGender(value)}
                    className={`rounded-full px-3 py-2 text-sm transition ${active ? 'bg-navy text-white' : 'border border-navy bg-white text-navy'}`}
                  >
                    {value === 'women' ? 'Women' : 'Men'}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {aestheticPillsByGender[selectedGender].map((pill) => (
              <button key={pill} type="button" className="rounded-full border border-navy px-4 py-2 text-sm font-medium text-navy">
                {pill}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
