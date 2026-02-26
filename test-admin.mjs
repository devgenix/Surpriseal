import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const vars = {};
env.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)="?(.*)"?$/);
  if (match) vars[match[1]] = match[2];
});

let key = vars.FIREBASE_PRIVATE_KEY;
if (key && key.endsWith('"')) key = key.slice(0, -1);
key = key.replace(/\\n/g, "\n");

initializeApp({
  credential: cert({
    projectId: vars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: vars.FIREBASE_CLIENT_EMAIL,
    privateKey: key
  })
});

const db = getFirestore();

async function run() {
  console.log("Checking bigmama...");
  const snap = await db.collection("moments").where("urlSlug", "==", "bigmama").get();
  console.log("size:", snap.size);
  
  const all = await db.collection("moments").get();
  console.log("total:", all.size);
  all.forEach(doc => {
    let s = doc.data().urlSlug;
    if (s) console.log(doc.id, "slug:", s);
  });
}

run().catch(console.error);
