import {
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  mergeSettings,
  type Domain,
  type ParkingLotItem,
  type Session,
  type UserSettings,
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
 * The data "API" — the only place Firestore is touched. Firebase is required
 * (firebase.ts asserts the env at startup), so these talk straight to Firestore.
 *
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
  snap: DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>,
): T {
  return { id: snap.id, ...(snap.data() as Doc<T>) } as T;
}

type Unsub = () => void;

/* ----------------------------- domains ----------------------------- */

/**
 * Emits ALL domains, archived included — the store derives the active subset.
 * (Archived lanes must stay resolvable so Review/session history keeps their
 * name/icon/color.)
 */
export function observeDomains(
  uid: string,
  cb: (domains: Domain[]) => void,
): Unsub {
  return onSnapshot(query(domainsCol(uid), orderBy("order")), (snap) => {
    cb(snap.docs.map((d) => fromDoc<Domain>(d)));
  });
}

export async function createDomain(
  uid: string,
  data: Omit<Domain, "id">,
): Promise<string> {
  const ref = doc(domainsCol(uid));
  await setDoc(ref, data);
  return ref.id;
}

export function updateDomain(
  uid: string,
  id: string,
  patch: Partial<Omit<Domain, "id">>,
): Promise<void> {
  return updateDoc(doc(domainsCol(uid), id), patch);
}

/* ------------------------------ weeks ------------------------------ */

export function observeWeek(
  uid: string,
  weekId: string,
  cb: (week: Week | null) => void,
): Unsub {
  return onSnapshot(doc(weeksCol(uid), weekId), (snap) => {
    cb(snap.exists() ? fromDoc<Week>(snap) : null);
  });
}

export function upsertWeek(uid: string, week: Week): Promise<void> {
  return setDoc(doc(weeksCol(uid), week.id), toDoc(week), { merge: true });
}

/* ----------------------------- sessions ---------------------------- */

export function createSession(uid: string, session: Session): Promise<void> {
  return setDoc(doc(sessionsCol(uid), session.id), toDoc(session));
}

export function updateSession(uid: string, session: Session): Promise<void> {
  return setDoc(doc(sessionsCol(uid), session.id), toDoc(session), {
    merge: true,
  });
}

/** Pre-generate an id so the caller can build a Session locally first. */
export function newSessionId(uid: string): string {
  return doc(sessionsCol(uid)).id;
}

export function observeActiveSession(
  uid: string,
  cb: (session: Session | null) => void,
): Unsub {
  return onSnapshot(
    query(sessionsCol(uid), where("status", "==", "active"), limit(1)),
    (snap) => {
      cb(snap.empty ? null : fromDoc<Session>(snap.docs[0]!));
    },
  );
}

/**
 * One-shot fetch of every session in a lane, for the lane-history screen.
 * Equality-only `where` (no orderBy) so no composite index is needed; callers
 * sort client-side. Fine at personal-app volume — revisit (orderBy + index +
 * limit) if a lane ever accumulates thousands of sessions.
 */
export async function fetchSessionsForDomain(
  uid: string,
  domainId: string,
): Promise<Session[]> {
  const snap = await getDocs(
    query(sessionsCol(uid), where("domainId", "==", domainId)),
  );
  return snap.docs.map((d) => fromDoc<Session>(d));
}

export function observeSessionsForWeek(
  uid: string,
  weekId: string,
  cb: (sessions: Session[]) => void,
): Unsub {
  return onSnapshot(
    query(sessionsCol(uid), where("weekId", "==", weekId)),
    (snap) => {
      cb(snap.docs.map((d) => fromDoc<Session>(d)));
    },
  );
}

/* ---------------------------- parking lot -------------------------- */

export async function addParkingItem(
  uid: string,
  data: Omit<ParkingLotItem, "id">,
): Promise<string> {
  const ref = doc(parkingLotCol(uid));
  await setDoc(ref, data);
  return ref.id;
}

export function updateParkingItem(
  uid: string,
  id: string,
  patch: Partial<Omit<ParkingLotItem, "id">>,
): Promise<void> {
  return updateDoc(doc(parkingLotCol(uid), id), patch);
}

export function observeOpenParking(
  uid: string,
  cb: (items: ParkingLotItem[]) => void,
): Unsub {
  return onSnapshot(
    query(parkingLotCol(uid), where("status", "==", "open")),
    (snap) => {
      const items = snap.docs.map((d) => fromDoc<ParkingLotItem>(d));
      items.sort((a, b) => b.createdAt - a.createdAt);
      cb(items);
    },
  );
}

/* ------------------------------ user ------------------------------- */

export async function ensureUserDoc(
  uid: string,
  profile: { displayName: string | null; email: string | null; photoURL: string | null },
): Promise<void> {
  await setDoc(userDoc(uid), { profile }, { merge: true });
}

/**
 * Settings live as a `settings` field on users/{uid}. mergeSettings defends
 * against a missing doc / missing field / partial object, so observers always
 * receive a complete UserSettings.
 */
export function observeUserSettings(
  uid: string,
  cb: (settings: UserSettings) => void,
): Unsub {
  return onSnapshot(userDoc(uid), (snap) => {
    cb(mergeSettings((snap.data()?.settings ?? null) as Partial<UserSettings> | null));
  });
}

export function updateUserSettings(
  uid: string,
  patch: Partial<UserSettings>,
): Promise<void> {
  // merge:true deep-merges nested maps and creates the doc if needed. Callers
  // must send quietHours as a whole object so the stored map is never partial.
  return setDoc(userDoc(uid), { settings: patch }, { merge: true });
}

/**
 * Permanently delete every Firestore document belonging to a user: all docs in
 * the four subcollections, then users/{uid} itself. Runs client-side (there is
 * no server) under the owner-only security rules, batched below Firestore's
 * 500-op limit. Idempotent/resumable: re-running after a partial failure
 * deletes whatever remains. Caller must delete the AUTH user afterwards —
 * order matters, since these writes need a signed-in user.
 */
export async function deleteAllUserData(uid: string): Promise<void> {
  const collections = [
    domainsCol(uid),
    weeksCol(uid),
    sessionsCol(uid),
    parkingLotCol(uid),
  ];
  for (const col of collections) {
    const snap = await getDocs(col);
    for (let i = 0; i < snap.docs.length; i += 450) {
      const batch = writeBatch(db);
      for (const d of snap.docs.slice(i, i + 450)) batch.delete(d.ref);
      await batch.commit();
    }
  }
  await deleteDoc(userDoc(uid));
}
