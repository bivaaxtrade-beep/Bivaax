import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const fs = readFileSync('./firebase-applet-config.json', 'utf-8');
const config = JSON.parse(fs);

initializeApp({ projectId: config.projectId });
const db = getFirestore("ai-studio-0b241b4d-4c35-43e1-b8bd-0f5c63d81b41");

async function run() {
  try {
    const sn = await db.collection('test').get();
    console.log("Success! Docs:", sn.size);
  } catch (e) {
    console.error("Error connecting to Firestore:", e);
  }
}
run();
