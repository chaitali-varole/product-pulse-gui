import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";

export interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  configured: boolean;
}

/**
 * Live subscription to a Firestore collection. No seed data, no fallbacks —
 * whatever is in Firestore is what renders.
 */
export function useCollection<T>(name: string, orderField = "createdAt"): CollectionState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getDb();
    if (!db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = onSnapshot(
      query(collection(db, name), orderBy(orderField, "desc")),
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as T[]);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [name, orderField]);

  return useMemo(
    () => ({ data, loading, error, configured: isFirebaseConfigured }),
    [data, loading, error],
  );
}

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("Firebase is not configured yet.");
  return db;
}

export async function createDocument(name: string, values: Record<string, unknown>) {
  const db = requireDb();
  return addDoc(collection(db, name), { ...values, createdAt: serverTimestamp() });
}

export async function updateDocument(name: string, id: string, values: Record<string, unknown>) {
  const db = requireDb();
  return updateDoc(doc(db, name, id), values);
}

export async function deleteDocument(name: string, id: string) {
  const db = requireDb();
  return deleteDoc(doc(db, name, id));
}

/**
 * Records a purchase or sale, writes the matching stock_transactions entry and
 * moves the product's quantity — all in one atomic batch.
 */
export async function recordMovement(opts: {
  kind: "purchase" | "sale";
  header: Record<string, unknown>;
  productDocId: string;
  productId: string;
  quantity: number;
  referenceId: string;
  date: string;
}) {
  const db = requireDb();
  const batch = writeBatch(db);
  const isPurchase = opts.kind === "purchase";

  const headerRef = doc(collection(db, isPurchase ? COLLECTIONS.purchases : COLLECTIONS.sales));
  batch.set(headerRef, { ...opts.header, createdAt: serverTimestamp() });

  const txRef = doc(collection(db, COLLECTIONS.stockTransactions));
  batch.set(txRef, {
    transactionId: `TXN-${txRef.id.slice(0, 6).toUpperCase()}`,
    productId: opts.productId,
    type: isPurchase ? "IN" : "OUT",
    quantity: opts.quantity,
    referenceId: opts.referenceId,
    date: opts.date,
    createdAt: serverTimestamp(),
  });

  batch.update(doc(db, COLLECTIONS.products, opts.productDocId), {
    quantity: increment(isPurchase ? opts.quantity : -opts.quantity),
  });

  await batch.commit();
}
