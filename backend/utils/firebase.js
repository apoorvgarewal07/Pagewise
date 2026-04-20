const admin = require("firebase-admin");
const path = require("path");
let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Local/dev fallback (not used on Vercel): repoRoot/firebase-key.json
    serviceAccount = require(path.join(__dirname, "..", "..", "firebase-key.json"));
  }
} catch (error) {
  console.error("Failed to load Firebase credentials:", error);
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

let db = null;
if (admin.apps.length) {
  db = admin.firestore();
} else {
  console.error("Firebase not initialized — set FIREBASE_SERVICE_ACCOUNT env variable on Vercel");
}

module.exports = db;