const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

db.collection("test").add({
  message: "Firebase working directly ✅",
  time: new Date()
}).then(() => {
  console.log("SUCCESS");
  process.exit(0);
}).catch((err) => {
  console.error("ERROR:");
  console.error(err);
  process.exit(1);
});
