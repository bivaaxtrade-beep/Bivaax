import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = dbId 
  ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, dbId) 
  : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const isQuota = message.includes('quota-exceeded') || message.includes('RESOURCE_EXHAUSTED') || message.toLowerCase().includes('quota');
  const isUnavailable = message.includes('unavailable') || message.includes('offline');

  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isQuota) {
    console.warn('Firestore Quota Exceeded for ' + operationType + ' on ' + path);
    toast.error("পর্যাপ্ত কোটা নেই (Quota Exceeded) - অনুগ্রহ করে আগামীকাল আবার চেষ্টা করুন বা এডমিনের সাথে যোগাযোগ করুন।");
    return; 
  }

  if (isUnavailable) {
    console.warn('Firestore Unavailable (Offline) for ' + operationType + ' on ' + path);
    toast.error("সংযোগ বিচ্ছিন্ন - অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ চেক করুন।");
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (message.includes('permission') && (operationType === OperationType.GET || operationType === OperationType.LIST)) {
    return; // Do not show toasts for background READ permission errors
  }
  const cleanMessage = message.replace(/FirebaseError:|Firestore:|Error:/gi, '').trim();
  toast.error(`অপারেশন ব্যর্থ হয়েছে (${operationType}): ${cleanMessage}`);
}
