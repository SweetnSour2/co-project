import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Assignment, Course, FocusSession, Recommendation } from "../../types";

type LocalKey = "courses" | "assignments" | "focusSessions" | "recommendations";

const prefix = "studypilot-demo";

function keyFor(uid: string, key: LocalKey) {
  return `${prefix}:${uid}:${key}`;
}

function reviveTimestamp(value: unknown): Timestamp {
  if (typeof value === "number") return Timestamp.fromMillis(value);
  if (typeof value === "string") return Timestamp.fromDate(new Date(value));
  return Timestamp.now();
}

function serializeTimestamp(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as Timestamp).toMillis();
  }
  return value;
}

function reviveItem<T>(key: LocalKey, item: Record<string, unknown>): T {
  if (key === "courses") {
    return {
      ...item,
      createdAt: reviveTimestamp(item.createdAt),
      updatedAt: reviveTimestamp(item.updatedAt),
    } as T;
  }

  if (key === "assignments") {
    return {
      ...item,
      dueAt: reviveTimestamp(item.dueAt),
      completedAt: item.completedAt ? reviveTimestamp(item.completedAt) : undefined,
      createdAt: reviveTimestamp(item.createdAt),
      updatedAt: reviveTimestamp(item.updatedAt),
    } as T;
  }

  if (key === "focusSessions") {
    return {
      ...item,
      startedAt: reviveTimestamp(item.startedAt),
      endedAt: item.endedAt ? reviveTimestamp(item.endedAt) : undefined,
      createdAt: reviveTimestamp(item.createdAt),
    } as T;
  }

  return {
    ...item,
    createdAt: reviveTimestamp(item.createdAt),
  } as T;
}

function serializeItem<T extends Record<string, unknown>>(item: T) {
  return Object.fromEntries(
    Object.entries(item).map(([entryKey, value]) => [entryKey, serializeTimestamp(value)]),
  );
}

export function createLocalId() {
  return crypto.randomUUID();
}

export function useLocalCollection<T extends Record<string, unknown>>(
  uid: string | undefined,
  key: LocalKey,
) {
  const [items, setItems] = useState<T[]>(() => {
    if (!uid) return [];
    const stored = window.localStorage.getItem(keyFor(uid, key));
    if (!stored) return [];
    return (JSON.parse(stored) as Record<string, unknown>[]).map((item) =>
      reviveItem<T>(key, item),
    );
  });

  useEffect(() => {
    if (!uid) {
      setItems([]);
      return;
    }
    const stored = window.localStorage.getItem(keyFor(uid, key));
    setItems(
      stored
        ? (JSON.parse(stored) as Record<string, unknown>[]).map((item) =>
            reviveItem<T>(key, item),
          )
        : [],
    );
  }, [key, uid]);

  useEffect(() => {
    if (!uid) return;
    window.localStorage.setItem(
      keyFor(uid, key),
      JSON.stringify(items.map((item) => serializeItem(item))),
    );
  }, [items, key, uid]);

  return { items, setItems };
}

export type LocalCourse = Course & Record<string, unknown>;
export type LocalAssignment = Assignment & Record<string, unknown>;
export type LocalFocusSession = FocusSession & Record<string, unknown>;
export type LocalRecommendation = Recommendation & Record<string, unknown>;
