import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
admin.initializeApp({ projectId: config.projectId });

console.log(config);
