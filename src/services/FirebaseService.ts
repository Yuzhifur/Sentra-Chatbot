import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  CollectionReference
} from 'firebase/firestore';

export interface UserData {
  username: string;
  displayName: string;
  email: string;
  userAvatar: string;
  userDescription: string;
  userCharacters: string[];
  createdAt?: any; // FirebaseTimestamp
  lastLogin?: any; // FirebaseTimestamp
}

export class FirebaseService {
  // User Authentication
  static async createAccount(email: string, password: string): Promise<User> {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  static async signIn(email: string, password: string): Promise<User> {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  static async logOut(): Promise<void> {
    const auth = getAuth();
    await signOut(auth);
  }

  // User Data Management
  static async isUsernameAvailable(username: string): Promise<boolean> {
    if (!username || username.trim() === '') return false;

    const db = getFirestore();
    const q = query(collection(db, "users"), where("username", "==", username));
    const querySnapshot = await getDocs(q);

    return querySnapshot.empty;
  }

  static async createUserDocument(userId: string, userData: Partial<UserData>): Promise<void> {
    const db = getFirestore();

    // Create the main user document
    await setDoc(doc(db, "users", userId), {
      ...userData,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });

    // Initialize the chatHistory subcollection with a welcome document
    const chatHistoryRef = collection(db, "users", userId, "chatHistory");
    await addDoc(chatHistoryRef, {
      title: "Welcome to Sentra!",
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp()
    });
  }

  static async updateUserLastLogin(userId: string): Promise<void> {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp()
    });
  }

  static async getUserData(userId: string): Promise<UserData | null> {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, "users", userId));

    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }

    return null;
  }

  // Chat History Management
  static getChatHistoryRef(userId: string): CollectionReference {
    const db = getFirestore();
    return collection(db, "users", userId, "chatHistory");
  }
}