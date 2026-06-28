import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Firebase Admin SDK singleton for server-side access to the cattleyaresort-react
 * booking system's Firestore project.
 *
 * Credentials come from FIREBASE_SERVICE_ACCOUNT_KEY — a base64-encoded JSON
 * service account key (Firebase Console > Project Settings > Service Accounts >
 * Generate new private key). Server-side only, never exposed to the client.
 *
 * Reuses a single Admin SDK instance across invocations (guarded by a name
 * lookup in getApps()) rather than initializing per request — required because Firebase throws if
 * initializeApp() is called more than once for the same default app, and serverless
 * function instances are reused across concurrent requests under Fluid Compute.
 */
const serviceAccountKeyB64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKeyB64) {
  throw new Error(
    "Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable for the booking system's Firebase Admin SDK"
  );
}

const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountKeyB64, "base64").toString("utf-8")
);

function getBookingSystemApp(): App {
  const existing = getApps().find((app) => app.name === "booking-system");
  if (existing) return existing;
  return initializeApp(
    { credential: cert(serviceAccount) },
    "booking-system"
  );
}

export const bookingSystemFirestore: Firestore = getFirestore(getBookingSystemApp());
