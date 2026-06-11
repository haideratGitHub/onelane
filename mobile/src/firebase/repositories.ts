import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import {
  DEFAULT_DOMAINS,
  type Domain,
  type ParkingLotItem,
  type Session,
  type Week,
} from "@/src/domain";
import {
  domainsCol,
  parkingLotCol,
  sessionsCol,
  weeksCol,
  userDoc,
} from "./paths";
import { db } from "./firebase";

/**
 * Because every timestamp in the domain model is a plain number (epoch ms), the
 * Firestore document is just the domain object without its `id` (which is the doc
 * id). These two helpers are the only (de)serialisation we need.
 */
type Doc<T extends { id: string }> = Omit<T, "id">;

function toDoc<T extends { id: string }>(obj: T): Doc<T> {
  const { id: _id, ...rest } = obj;
  return rest;
}

function fromDoc<T extends { id: string }>(
  snap: FirebaseFirestoreTypes.DocumentSnapshot,
): T {
  return { id: snap.id, ...(snap.data() as Doc<T>) } as T;
}

type Unsub = () => void;

/* ----------------------------- domains ----------------------------- */

export async function bootstrapDomains(uid: string): Promise<void> {
  const col = domainsCol(uid);
  const existing = await col.limit(1).get();
  if (!existing.empty) return; // already seeded
  const batch = db.batch();
  for (const d of DEFAULT_DOMAINS) {
    batch.set(col.doc(), d);
  }
  await batch.commit();
}

export function observeDomains(
  uid: string,
  cb: (domains: Domain[]) => void,
): Unsub {
  return domainsCol(uid)
    .orderBy("order")
    .onSnapshot((snap) => {
      cb(snap.docs.map((d) => fromDoc<Domain>(d)).filter((d) => !d.archived));
    });
}

export async function createDomain(
  uid: string,
  data: Omit<Domain, "id">,
): Promise<string> {
  const ref = domainsCol(uid).doc();
  await ref.set(data);
  return ref.id;
}

export function updateDomain(
  uid: string,
  id: string,
  patch: Partial<Omit<Domain, "id">>,
): Promise<void> {
  return domainsCol(uid).doc(id).update(patch);
}

/* ------------------------------ weeks ------------------------------ */

export function observeWeek(
  uid: string,
  weekId: string,
  cb: (week: Week | null) => void,
): Unsub {
  return weeksCol(uid)
    .doc(weekId)
    .onSnapshot((snap) => {
      cb(snap.exists ? fromDoc<Week>(snap) : null);
    });
}

export function upsertWeek(uid: string, week: Week): Promise<void> {
  return weeksCol(uid).doc(week.id).set(toDoc(week), { merge: true });
}

/* ----------------------------- sessions ---------------------------- */

export function createSession(uid: string, session: Session): Promise<void> {
  return sessionsCol(uid).doc(session.id).set(toDoc(session));
}

export function updateSession(uid: string, session: Session): Promise<void> {
  return sessionsCol(uid).doc(session.id).set(toDoc(session), { merge: true });
}

/** Pre-generate a Firestore id so the caller can build a Session locally first. */
export function newSessionId(uid: string): string {
  return sessionsCol(uid).doc().id;
}

export function observeActiveSession(
  uid: string,
  cb: (session: Session | null) => void,
): Unsub {
  return sessionsCol(uid)
    .where("status", "==", "active")
    .limit(1)
    .onSnapshot((snap) => {
      cb(snap.empty ? null : fromDoc<Session>(snap.docs[0]!));
    });
}

export function observeSessionsForWeek(
  uid: string,
  weekId: string,
  cb: (sessions: Session[]) => void,
): Unsub {
  return sessionsCol(uid)
    .where("weekId", "==", weekId)
    .onSnapshot((snap) => {
      cb(snap.docs.map((d) => fromDoc<Session>(d)));
    });
}

/* ---------------------------- parking lot -------------------------- */

export async function addParkingItem(
  uid: string,
  data: Omit<ParkingLotItem, "id">,
): Promise<string> {
  const ref = parkingLotCol(uid).doc();
  await ref.set(data);
  return ref.id;
}

export function updateParkingItem(
  uid: string,
  id: string,
  patch: Partial<Omit<ParkingLotItem, "id">>,
): Promise<void> {
  return parkingLotCol(uid).doc(id).update(patch);
}

export function observeOpenParking(
  uid: string,
  cb: (items: ParkingLotItem[]) => void,
): Unsub {
  return parkingLotCol(uid)
    .where("status", "==", "open")
    .onSnapshot((snap) => {
      const items = snap.docs.map((d) => fromDoc<ParkingLotItem>(d));
      items.sort((a, b) => b.createdAt - a.createdAt);
      cb(items);
    });
}

/* ------------------------------ user ------------------------------- */

export async function ensureUserDoc(
  uid: string,
  profile: { displayName: string | null; email: string | null; photoURL: string | null },
): Promise<void> {
  await userDoc(uid).set({ profile }, { merge: true });
}
