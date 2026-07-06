// Firestore helpers for creating, retrieving, updating, and deleting board pages.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BoardPage, Product } from '@/types';

const STORAGE_PREFIX = 'onboard_local_boards_';
const SAVED_ITEMS_PREFIX = 'onboard_saved_items_';

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function getSavedItemsStorageKey(userId: string) {
  return `${SAVED_ITEMS_PREFIX}${userId}`;
}

function readStoredBoards(userId: string): BoardPage[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(getStorageKey(userId));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Array<BoardPage | Record<string, unknown>>;
    return parsed.map((board) => ({
      ...(board as BoardPage),
      createdAt: new Date((board as BoardPage).createdAt as string | Date),
      products: ((board as BoardPage).products ?? []).map((product) => ({ ...product })),
    }));
  } catch {
    return [];
  }
}

function writeStoredBoards(userId: string, boards: BoardPage[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(boards));
}

function readStoredSavedItems(userId: string): Array<{ boardId: string; product: Product }> {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(getSavedItemsStorageKey(userId));
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Array<{ boardId: string; product: Product }>;
  } catch {
    return [];
  }
}

function writeStoredSavedItems(userId: string, savedItems: Array<{ boardId: string; product: Product }>) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getSavedItemsStorageKey(userId), JSON.stringify(savedItems));
}

function normalizeBoard(boardPage: BoardPage): BoardPage {
  return {
    ...boardPage,
    createdAt: boardPage.createdAt instanceof Date ? boardPage.createdAt : new Date(boardPage.createdAt),
    products: (boardPage.products ?? []).map((product) => ({ ...product })),
  };
}

export async function createBoardPage(userId: string, boardPage: BoardPage): Promise<string> {
  const normalizedBoard = normalizeBoard({
    ...boardPage,
    id: boardPage.id || `board-${Date.now()}`,
  });

  if (!db) {
    const boards = readStoredBoards(userId);
    boards.unshift(normalizedBoard);
    writeStoredBoards(userId, boards);
    return normalizedBoard.id;
  }

  const boardRef = await addDoc(collection(db, 'users', userId, 'pages'), {
    ...normalizedBoard,
    createdAt: normalizedBoard.createdAt.toISOString(),
  });

  return boardRef.id;
}

export async function getBoardPages(userId: string): Promise<BoardPage[]> {
  if (!db) {
    return readStoredBoards(userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const q = query(collection(db, 'users', userId, 'pages'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    return {
      ...(data as BoardPage),
      id: docSnapshot.id,
      createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
      products: (data.products ?? []) as BoardPage['products'],
    };
  });
}

export async function getBoardPage(userId: string, pageId: string): Promise<BoardPage | null> {
  if (!db) {
    return readStoredBoards(userId).find((board) => board.id === pageId) ?? null;
  }

  const snapshot = await getDoc(doc(db, 'users', userId, 'pages', pageId));
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    ...(data as BoardPage),
    id: snapshot.id,
    createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
    products: (data.products ?? []) as BoardPage['products'],
  };
}

export async function toggleSavedItem(userId: string, pageId: string, productId: string): Promise<void> {
  if (!db) {
    const boards = readStoredBoards(userId);
    const nextBoards = boards.map((board) => {
      if (board.id !== pageId) {
        return board;
      }

      const targetProduct = board.products.find((product) => product.id === productId);
      const nextValue = targetProduct ? !targetProduct.isSaved : true;

      return {
        ...board,
        products: board.products.map((product) =>
          product.id === productId ? { ...product, isSaved: nextValue } : product,
        ),
      };
    });

    const savedItems = readStoredSavedItems(userId);
    const targetBoard = nextBoards.find((board) => board.id === pageId);
    const targetProduct = targetBoard?.products.find((product) => product.id === productId);

    if (targetProduct?.isSaved) {
      const nextSavedItems = [...savedItems.filter((item) => !(item.boardId === pageId && item.product.id === productId)), { boardId: pageId, product: targetProduct }];
      writeStoredSavedItems(userId, nextSavedItems);
    } else {
      writeStoredSavedItems(userId, savedItems.filter((item) => !(item.boardId === pageId && item.product.id === productId)));
    }

    writeStoredBoards(userId, nextBoards);
    return;
  }

  const boardRef = doc(db, 'users', userId, 'pages', pageId);
  const snapshot = await getDoc(boardRef);
  if (!snapshot.exists()) {
    return;
  }

  const board = snapshot.data() as BoardPage;
  const targetProduct = board.products.find((product) => product.id === productId);
  const nextValue = targetProduct ? !targetProduct.isSaved : true;
  const nextProducts = board.products.map((product) =>
    product.id === productId ? { ...product, isSaved: nextValue } : product,
  );

  await updateDoc(boardRef, { products: nextProducts });

  const savedItemRef = doc(db, 'users', userId, 'savedItems', `${pageId}:${productId}`);
  if (nextValue) {
    const savedProduct = nextProducts.find((product) => product.id === productId);
    if (savedProduct) {
      await setDoc(savedItemRef, {
        boardId: pageId,
        product: savedProduct,
        savedAt: serverTimestamp(),
      });
    }
  } else {
    await deleteDoc(savedItemRef);
  }
}

export async function deleteBoardPage(userId: string, pageId: string): Promise<void> {
  if (!db) {
    const boards = readStoredBoards(userId).filter((board) => board.id !== pageId);
    writeStoredBoards(userId, boards);
    const savedItems = readStoredSavedItems(userId).filter((item) => item.boardId !== pageId);
    writeStoredSavedItems(userId, savedItems);
    return;
  }

  const savedItemsSnapshot = await getDocs(collection(db, 'users', userId, 'savedItems'));
  const matchingSavedItems = savedItemsSnapshot.docs.filter((savedDoc) => {
    const data = savedDoc.data() as { boardId?: string };
    return data.boardId === pageId;
  });

  await Promise.all(matchingSavedItems.map((savedDoc) => deleteDoc(savedDoc.ref)));
  await deleteDoc(doc(db, 'users', userId, 'pages', pageId));
}

export async function getSavedItems(userId: string): Promise<Product[]> {
  if (!db) {
    return readStoredSavedItems(userId).map((item) => item.product);
  }

  const snapshot = await getDocs(collection(db, 'users', userId, 'savedItems'));
  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    return data.product as Product;
  });
}

export async function importGuestBoard(userId: string, guestBoard: BoardPage): Promise<string> {
  return createBoardPage(userId, normalizeBoard(guestBoard));
}
