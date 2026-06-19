import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "./client";
import type {
  Assignment,
  Course,
  FocusSession,
  Recommendation,
  StudyPreferences,
  UserProfile,
} from "../../types";

export const userDoc = (uid: string) =>
  doc(db, "users", uid) as DocumentReference<UserProfile>;

export const preferencesDoc = (uid: string) =>
  doc(
    db,
    "users",
    uid,
    "preferences",
    "default",
  ) as DocumentReference<StudyPreferences>;

export const coursesCollection = (uid: string) =>
  collection(db, "users", uid, "courses") as CollectionReference<Course>;

export const assignmentsCollection = (uid: string) =>
  collection(
    db,
    "users",
    uid,
    "assignments",
  ) as CollectionReference<Assignment>;

export const focusSessionsCollection = (uid: string) =>
  collection(
    db,
    "users",
    uid,
    "focusSessions",
  ) as CollectionReference<FocusSession>;

export const recommendationsCollection = (uid: string) =>
  collection(
    db,
    "users",
    uid,
    "recommendations",
  ) as CollectionReference<Recommendation>;
