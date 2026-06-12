import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Firestore layout (all per-user, isolated by uid in security rules):
 *
 *   users/{uid}
 *   users/{uid}/domains/{domainId}
 *   users/{uid}/weeks/{weekId}
 *   users/{uid}/sessions/{sessionId}
 *   users/{uid}/parkingLot/{itemId}
 *
 * `db` is non-null: firebase.ts asserts Firebase is configured at startup, so
 * the SDK is always initialized by the time these builders run.
 */
export const userDoc = (uid: string): DocumentReference => doc(db, "users", uid);

export const domainsCol = (uid: string): CollectionReference =>
  collection(db, "users", uid, "domains");
export const weeksCol = (uid: string): CollectionReference =>
  collection(db, "users", uid, "weeks");
export const sessionsCol = (uid: string): CollectionReference =>
  collection(db, "users", uid, "sessions");
export const parkingLotCol = (uid: string): CollectionReference =>
  collection(db, "users", uid, "parkingLot");
