
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

console.log("Project ID:", projectId);
console.log("Client Email:", clientEmail);
console.log("Private Key length:", privateKey?.length);

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing credentials!");
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  const db = admin.firestore();
  console.log("Attempting to fetch moment 'bigmama'...");
  
  db.collection("moments").doc("bigmama").get()
    .then(snap => {
      if (snap.exists) {
        console.log("Found by ID:", snap.id, snap.data());
      } else {
        console.log("Not found by ID 'bigmama'. Trying slug...");
        return db.collection("moments")
          .where("urlSlug", "==", "bigmama")
          .limit(1)
          .get();
      }
    })
    .then(slugQuery => {
      if (slugQuery && !slugQuery.empty) {
        console.log("Found by slug:", slugQuery.docs[0].id, slugQuery.docs[0].data());
      } else if (slugQuery) {
        console.log("Not found by slug either.");
      }
    })
    .catch(err => {
      console.error("Error during operations:", err);
    });

} catch (err) {
  console.error("Initialization Error:", err);
}
