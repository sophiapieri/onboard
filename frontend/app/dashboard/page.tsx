'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AddPageModal from '@/components/ui/AddPageModal';
import Sidebar from '@/components/ui/Sidebar';
import { AuthContext } from '@/components/AuthProvider';
import { createBoardPage, deleteBoardPage, getBoardPages, importGuestBoard } from '@/lib/firestore';
import type { BoardPage, PreferredGender, Product } from '@/types';

const aestheticPillsByGender: Record<PreferredGender, string[]> = {
  women: ['Coastal Grandma', 'Dark Academia', 'Clean Girl', 'Quiet Luxury', 'Y2K Revival', 'Cottagecore'],
  men: ['Streetwear', 'Tailored', 'Old Money', 'Minimalist', 'Workwear', 'Quiet Luxury'],
};

export default function DashboardPage() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const [boards, setBoards] = useState<BoardPage[]>([]);
  const [isBoardsLoading, setIsBoardsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState<PreferredGender>('women');
  const [unsavedGuestBoards, setUnsavedGuestBoards] = useState<BoardPage[]>([]);
  const [isImportingBoards, setIsImportingBoards] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth?.loading && auth?.isGuest) {
      router.replace('/login');
      return;
    }

    if (!auth?.loading && auth?.user) {
      void loadBoards();
      void readGuestBoards();
    }
  }, [auth?.loading, auth?.isGuest, auth?.user, router]);

  const loadBoards = async () => {
    if (!auth?.user) {
      return;
    }

    setIsBoardsLoading(true);
    const pages = await getBoardPages(auth.user.uid);
    setBoards(pages);
    setIsBoardsLoading(false);
  };

  const readGuestBoards = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const raw = window.localStorage.getItem('onboard_guest_boards');
    if (!raw) {
      setUnsavedGuestBoards([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as BoardPage[];
      setUnsavedGuestBoards(parsed);
    } catch {
      setUnsavedGuestBoards([]);
    }
  };

  const handleImportGuestBoards = async () => {
    if (!auth?.user || unsavedGuestBoards.length === 0) {
      return;
    }

    setIsImportingBoards(true);

    try {
      for (const board of unsavedGuestBoards) {
        await importGuestBoard(auth.user.uid, board);
      }
      window.localStorage.removeItem('onboard_guest_boards');
      setUnsavedGuestBoards([]);
      await loadBoards();
    } finally {
      setIsImportingBoards(false);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!auth?.user || !window.confirm('Delete this board from your collection?')) {
      return;
    }

    setDeletingBoardId(boardId);

    try {
      await deleteBoardPage(auth.user.uid, boardId);
      setBoards((currentBoards) => currentBoards.filter((board) => board.id !== boardId));
    } finally {
      setDeletingBoardId(null);
    }
  };

  const handleQuickCreate = async (aesthetic: string) => {
    if (!auth?.user) {
      return;
    }

    const response = await fetch('/api/search-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchQuery: aesthetic, gender: selectedGender }),
    });

    const products = (await response.json()) as Product[];
    const board: BoardPage = {
      id: `board-${Date.now()}`,
      name: `${aesthetic} Board`,
      pinterestUrl: 'https://www.pinterest.com',
      aestheticLabels: [aesthetic],
      preferredGender: selectedGender,
      createdAt: new Date(),
      products,
    };

    const pageId = await createBoardPage(auth.user.uid, board);
    router.push(`/board/${pageId}`);
  };

  if (auth?.loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <div className="flex min-h-screen">
        <Sidebar
          boards={boards}
          onNewBoardClick={() => setIsModalOpen(true)}
          onDeleteBoard={handleDeleteBoard}
        />

        <main className="flex-1 px-6 py-8 sm:px-8 lg:px-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">Your collection</p>
              <h1 className="mt-2 font-display text-4xl text-navy">Good morning, {auth?.user?.displayName || 'there'}</h1>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy/90"
            >
              Add a New Board
            </button>
          </div>

          {unsavedGuestBoards.length > 0 ? (
            <div className="mb-6 rounded-2xl border border-sky/70 bg-sky/70 p-4 text-sm text-navy">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>✦ You have an unsaved board from your last session — Save it to your account?</p>
                <button
                  type="button"
                  onClick={handleImportGuestBoards}
                  disabled={isImportingBoards}
                  className="rounded-full bg-white px-4 py-2 font-semibold text-navy transition hover:bg-sand disabled:opacity-70"
                >
                  {isImportingBoards ? 'Saving...' : 'Save Board'}
                </button>
              </div>
            </div>
          ) : null}

          <section className="rounded-[28px] border border-sky/60 bg-white p-6 shadow-[0_18px_55px_-24px_rgba(0,28,87,0.32)]">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-navy">Your Boards</h2>
            </div>

            {isBoardsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse rounded-2xl border border-sky/40 bg-sand p-5">
                    <div className="mb-3 h-4 w-24 rounded-full bg-sky/70" />
                    <div className="mb-4 h-5 w-2/3 rounded-full bg-sky/60" />
                    <div className="h-4 w-full rounded-full bg-sky/40" />
                  </div>
                ))}
              </div>
            ) : boards.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sky/70 bg-sand/60 px-6 py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white">
                  <svg viewBox="0 0 24 24" className="h-8 w-8 text-navy" fill="none">
                    <path d="M6 18c1-3 3-5 6-5s5 2 6 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M10 7a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 3c4 0 7 3 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="font-display text-xl text-navy">No boards yet. Create your first one.</h3>
                <p className="mt-2 max-w-md text-sm text-muted">Start with a Pinterest board and turn it into a curated shopping page.</p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-6 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white"
                >
                  Create a Board
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {boards.map((board) => (
                  <div key={board.id} className="rounded-2xl border border-sky/40 bg-sand p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {board.aestheticLabels?.slice(0, 3).map((label) => (
                          <span key={label} className="rounded-full bg-sky/70 px-3 py-1 text-xs font-medium text-navy">
                            {label}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDeleteBoard(board.id);
                        }}
                        disabled={deletingBoardId === board.id}
                        className="rounded-full border border-navy/20 px-3 py-1 text-xs font-semibold text-navy transition hover:bg-white disabled:opacity-60"
                      >
                        {deletingBoardId === board.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                    <h3 className="font-display text-xl text-navy">{board.name}</h3>
                    <p className="mt-2 text-sm text-muted">{board.products.length} curated picks</p>
                    <button
                      type="button"
                      onClick={() => router.push(`/board/${board.id}`)}
                      className="mt-6 inline-flex items-center text-sm font-semibold text-navy"
                    >
                      Open →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-8 rounded-[28px] border border-sky/60 bg-white p-6 shadow-[0_18px_55px_-24px_rgba(0,28,87,0.32)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-navy">Popular Aesthetics</h2>
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
            <div className="flex flex-wrap gap-3">
              {aestheticPillsByGender[selectedGender].map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => void handleQuickCreate(pill)}
                  className="rounded-full border border-navy px-4 py-2 text-sm font-medium text-navy transition hover:bg-sky/60"
                >
                  {pill}
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>

      <AddPageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onBoardCreated={loadBoards} />
    </div>
  );
}
