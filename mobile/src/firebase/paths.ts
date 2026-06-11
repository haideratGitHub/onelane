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
 * `db!`: these builders are only reached from repositories.ts branches that run
 * when Firebase IS configured (demo mode short-circuits before them), so db is
 * never null here.
 */
export const userDoc = (uid: string): DocumentReference => doc(db!, "users", uid);

export const domainsCol = (uid: string): CollectionReference =>
  collection(db!, "users", uid, "domains");
export const weeksCol = (uid: string): CollectionReference =>
  collection(db!, "users", uid, "weeks");
export const sessionsCol = (uid: string): CollectionReference =>
  collection(db!, "users", uid, "sessions");
export const parkingLotCol = (uid: string): CollectionReference =>
  collection(db!, "users", uid, "parkingLot");
