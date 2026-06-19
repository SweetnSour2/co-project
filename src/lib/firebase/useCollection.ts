import { onSnapshot, orderBy, query, type QueryConstraint } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { CollectionReference, DocumentData } from "firebase/firestore";

export function useCollection<T extends DocumentData>(
  ref: CollectionReference<T> | null,
  constraints: QueryConstraint[] = [],
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(Boolean(ref));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = constraints.length ? query(ref, ...constraints) : query(ref);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(
          snapshot.docs.map((document) => ({
            ...document.data(),
            id: document.id,
          })),
        );
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [ref, constraints]);

  return { data, loading, error };
}

export const newestFirst = (field = "createdAt") => [orderBy(field, "desc")];
export const dueSoonFirst = () => [orderBy("dueAt", "asc")];
