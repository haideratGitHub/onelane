import {
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
  DEFAULT_DOMAINS,
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
import { isFirebaseConfigured } from "./config";
import * as demo from "./demo";

/**
 * The data "API". Every function delegates to the in-memory demo backend
 * (demo.ts) when Firebase isn't configured — same contracts, no crash, so the
 * app is walkable before any backend setup.
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

export async function bootstrapDomains(uid: string): Promise<void> {
  if (!isFirebaseConfigured) return demo.seedDemoData();
  const col = domainsCol(uid);
  const existing = await getDocs(query(col, limit(1)));
  if (!existing.empty) return; // already seeded
  const batch = writeBatch(db!);
  for (const d of DEFAULT_DOMAINS) {
    batch.set(doc(col), d);
  }
  await batch.commit();
}

/**
 * Emits ALL domains, archived included — the store derives the active subset.
 * (Archived lanes must stay resolvable so Review/session history keeps their
 * name/icon/color.)
 */
export function observeDomains(
  uid: string,
  cb: (domains: Domain[]) => void,
): Unsub {
  if (!isFirebaseConfigured) return demo.observeDomainsDemo(cb);
  return onSnapshot(query(domainsCol(uid), orderBy("order")), (snap) => {
    cb(snap.docs.map((d) => fromDoc<Domain>(d)));
  });
}

export async function createDomain(
  uid: string,
  data: Omit<Domain, "id">,
): Promise<string> {
  if (!isFirebaseConfigured) return demo.createDomainDemo(data);
  const ref = doc(domainsCol(uid));
  await setDoc(ref, data);
  return ref.id;
}

export function updateDomain(
  uid: string,
  id: string,
  patch: Partial<Omit<Domain, "id">>,
): Promise<void> {
  if (!isFirebaseConfigured) return demo.updateDomainDemo(id, patch);
  return updateDoc(doc(domainsCol(uid), id), patch);
}

/* ------------------------------ weeks ------------------------------ */

export function observeWeek(
  uid: string,
  weekId: string,
  cb: (week: Week | null) => void,
): Unsub {
  if (!isFirebaseConfigured) return demo.observeWeekDemo(weekId, cb);
  return onSnapshot(doc(weeksCol(uid), weekId), (snap) => {
    cb(snap.exists() ? fromDoc<Week>(snap) : null);
  });
}

export function upsertWeek(uid: string, week: Week): Promise<void> {
  if (!isFirebaseConfigured) return demo.upsertWeekDemo(week);
  return setDoc(doc(weeksCol(uid), week.id), toDoc(week), { merge: true });
}

/* ----------------------------- sessions ---------------------------- */

export function createSession(uid: string, session: Session): Promise<void> {
  if (!isFirebaseConfigured) return demo.setSessionDemo(session);
  return setDoc(doc(sessionsCol(uid), session.id), toDoc(session));
}

export function updateSession(uid: string, session: Session): Promise<void> {
  if (!isFirebaseConfigured) return demo.setSessionDemo(session);
  return setDoc(doc(sessionsCol(uid), session.id), toDoc(session), {
    merge: true,
  });
}

/** Pre-generate an id so the caller can build a Session locally first. */
export function newSessionId(uid: string): string {
  if (!isFirebaseConfigured) return demo.newDemoId("s");
  return doc(sessionsCol(uid)).id;
}

export function observeActiveSession(
  uid: string,
  cb: (session: Session | null) => void,
): Unsub {
  if (!isFirebaseConfigured) return demo.observeActiveSessionDemo(cb);
  return onSnapshot(
    query(sessionsCol(uid), where("status", "==", "active"), limit(1)),
    (snap) => {
      cb(snap.empty ? null : fromDoc<Session>(snap.docs[0]!));
    },
  );
}

export function observeSessionsForWeek(
  uid: string,
  weekId: string,
  cb: (sessions: Session[]) => void,
): Unsub {
  if (!isFirebaseConfigured) return demo.observeSessionsForWeekDemo(weekId, cb);
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
  if (!isFirebaseConfigured) return demo.addParkingItemDemo(data);
  const ref = doc(parkingLotCol(uid));
  await setDoc(ref, data);
  return ref.id;
}

export function updateParkingItem(
  uid: string,
  id: string,
  patch: Partial<Omit<ParkingLotItem, "id">>,
): Promise<void> {
  if (!isFirebaseConfigured) return demo.updateParkingItemDemo(id, patch);
  return updateDoc(doc(parkingLotCol(uid), id), patch);
}

export function observeOpenParking(
  uid: string,
  cb: (items: ParkingLotItem[]) => void,
): Unsub {
  if (!isFirebaseConfigured) return demo.observeOpenParkingDemo(cb);
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
  if (!isFirebaseConfigured) return; // demo user has no doc
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
  if (!isFirebaseConfigured) return demo.observeSettingsDemo(cb);
  return onSnapshot(userDoc(uid), (snap) => {
    cb(mergeSettings((snap.data()?.settings ?? null) as Partial<UserSettings> | null));
  });
}

export function updateUserSettings(
  uid: string,
  patch: Partial<UserSettings>,
): Promise<void> {
  if (!isFirebaseConfigured) return demo.updateSettingsDemo(patch);
  // merge:true deep-merges nested maps and creates the doc if needed. Callers
  // must send quietHours as a whole object so the stored map is never partial.
  return setDoc(userDoc(uid), { settings: patch }, { merge: true });
}
