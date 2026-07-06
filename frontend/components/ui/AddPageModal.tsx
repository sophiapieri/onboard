'use client';

import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/components/AuthProvider';
import { createBoardPage } from '@/lib/firestore';
import { useGuestSession } from '@/lib/hooks/useGuestSession';
import LoadingScreen from '@/components/ui/LoadingScreen';
import type { BoardPage, PreferredGender } from '@/types';

interface AddPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardCreated?: () => void;
}

export default function AddPageModal({ isOpen, onClose, onBoardCreated }: AddPageModalProps) {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const { saveGuestBoard } = useGuestSession();
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [pageName, setPageName] = useState('');
  const [selectedGender, setSelectedGender] = useState<PreferredGender>('women');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!pinterestUrl.trim() || !pageName.trim()) {
      setError('Please fill in both fields to create a board.');
      return;
    }

    if (!pinterestUrl.includes('pinterest.com')) {
      setError('Please enter a valid Pinterest board URL.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pinterestUrl: pinterestUrl.trim(),
          pageName: pageName.trim(),
          gender: selectedGender,
          ...(auth?.user && !auth.isGuest ? { userId: auth.user.uid } : {}),
        }),
      });

      const board = (await response.json()) as BoardPage;

      if (!response.ok || board?.id == null) {
        setError('We could not create your board right now. Please try again.');
        setIsLoading(false);
        return;
      }

      if (auth?.isGuest) {
        saveGuestBoard(board);
        onBoardCreated?.();
        onClose();
        router.push('/board/preview');
        return;
      }

      if (auth?.user) {
        const pageId = await createBoardPage(auth.user.uid, board);
        onBoardCreated?.();
        onClose();
        router.push(`/board/${pageId}`);
      }
    } catch {
      setError('We could not create your board right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-2xl text-navy">Create a new board</p>
              <p className="mt-2 text-sm text-muted">No account needed to get started.</p>
            </div>
            <button type="button" onClick={onClose} className="text-2xl text-muted" aria-label="Close modal">
              ×
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-navy" htmlFor="pinterest-url">
                Pinterest Board URL
              </label>
              <input
                id="pinterest-url"
                type="url"
                value={pinterestUrl}
                onChange={(event) => setPinterestUrl(event.target.value)}
                className="w-full rounded-xl border border-sky/70 bg-sand px-4 py-3 text-sm outline-none focus:border-navy"
                placeholder="https://www.pinterest.com/username/board-name/"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-navy" htmlFor="board-name">
                Name this board
              </label>
              <input
                id="board-name"
                type="text"
                value={pageName}
                onChange={(event) => setPageName(event.target.value)}
                className="w-full rounded-xl border border-sky/70 bg-sand px-4 py-3 text-sm outline-none focus:border-navy"
                placeholder="Coastal Grandma Winter"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-navy">Preferred gender</label>
              <div className="flex flex-wrap gap-2">
                {(['women', 'men'] as PreferredGender[]).map((value) => {
                  const active = selectedGender === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedGender(value)}
                      className={`rounded-full px-3 py-2 text-sm transition ${
                        active ? 'bg-navy text-white' : 'border border-navy bg-white text-navy'
                      }`}
                    >
                      {value === 'women' ? 'Women' : 'Men'}
                    </button>
                  );
                })}
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-navy px-4 py-3 font-semibold text-white transition hover:bg-navy/90"
            >
              Create Board →
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
