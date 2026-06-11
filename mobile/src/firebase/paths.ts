import { db } from "./firebase";

/**
 * Firestore layout (all per-user, isolated by uid in security rules):
 *
 *   users/{uid}
 *   users/{uid}/domains/{domainId}
 *   users/{uid}/weeks/{weekId}
 *   users/{uid}/sessions/{sessionId}
 *   users/{uid}/parkingLot/{itemId}
 */
export const userDoc = (uid: string) => db.collection("users").doc(uid);

export const domainsCol = (uid: string) => userDoc(uid).collection("domains");
export const weeksCol = (uid: string) => userDoc(uid).collection("weeks");
export const sessionsCol = (uid: string) => userDoc(uid).collection("sessions");
export const parkingLotCol = (uid: string) =>
  userDoc(uid).collection("parkingLot");
