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
  CollectionReference,
  Timestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

    // Store the lowercase version to search case-insensitively
    const lowerUsername = username.toLowerCase();

    const db = getFirestore();
    const q = query(collection(db, "users"), where("username", "==", lowerUsername));
    const querySnapshot = await getDocs(q);

    return querySnapshot.empty;
  }

  static async createUserDocument(userId: string, userData: Partial<UserData>): Promise<void> {
    const db = getFirestore();

    // Ensure username is stored in lowercase for case-insensitive search
    if (userData.username) {
      userData.username = userData.username.toLowerCase();
    }

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
      lastUpdated: serverTimestamp()
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

  // Character ID Generation
  static async getNextCharacterId(): Promise<number> {
    const db = getFirestore();
    const statsDocRef = doc(db, "global", "stats");

    try {
      // Use transaction to ensure ID uniqueness
      const statsDoc = await getDoc(statsDocRef);

      let currentCount = 1;

      if (statsDoc.exists()) {
        const data = statsDoc.data();
        currentCount = (data.characterCount || 0) + 1;

        // Update the counter
        await updateDoc(statsDocRef, {
          characterCount: currentCount
        });
      } else {
        // Create the document if it doesn't exist
        await setDoc(statsDocRef, {
          characterCount: currentCount
        });
      }

      return currentCount;
    } catch (error) {
      console.error("Error getting next character ID:", error);
      throw new Error("Failed to generate character ID");
    }
  }

  // User Character List Management
  static async addCharacterToUserList(userId: string, characterId: string): Promise<void> {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);

    // Get current user data
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      let userCharacters = userData.userCharacters || [];

      // Only add if not already in the array
      if (!userCharacters.includes(characterId)) {
        userCharacters.push(characterId);

        // Update the user document
        await updateDoc(userRef, {
          userCharacters: userCharacters
        });
      }
    } else {
      throw new Error("User document not found");
    }
  }

  // Get user's characters
  static async getUserCharacters(userId: string): Promise<any[]> {
    try {
      const userData = await this.getUserData(userId);

      if (!userData || !userData.userCharacters || userData.userCharacters.length === 0) {
        return [];
      }

      const db = getFirestore();
      const characters = [];

      // Fetch each character document
      for (const characterId of userData.userCharacters) {
        const characterDoc = await getDoc(doc(db, "characters", characterId));

        if (characterDoc.exists()) {
          characters.push({
            ...characterDoc.data(),
            docId: characterId
          });
        }
      }

      return characters;
    } catch (error) {
      console.error("Error fetching user characters:", error);
      throw error;
    }
  }

  // Get a character by its ID
  static async getCharacterById(characterId: string): Promise<any> {
    try {
      const db = getFirestore();
      const characterDoc = await getDoc(doc(db, "characters", characterId));

      if (characterDoc.exists()) {
        return {
          ...characterDoc.data(),
          docId: characterId
        };
      }

      throw new Error(`Character with ID ${characterId} not found`);
    } catch (error) {
      console.error("Error fetching character:", error);
      throw error;
    }
  }

  static async updateUserData(userId: string, updatedData: any): Promise<void> {
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, updatedData, { merge: true });
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error;
    }
  }

  // Profile Picture Upload - Combined method that uploads and returns the URL
  static async uploadAndGetProfilePicture(userId: string, file: File): Promise<string> {
    try {
      const storage = getStorage();
      // Use a more unique filename to avoid cache issues
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${file.name}`;
      const storagePath = `profilePictures/${userId}/${fileName}`;
      const storageRef = ref(storage, storagePath);

      // Upload the file to Firebase Storage
      await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  }

  // Legacy method for compatibility
  static async uploadProfilePicture(userId: string, file: File): Promise<any> {
    const storage = getStorage();
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `profilePictures/${userId}/${fileName}`);

    // Upload the file to Firebase Storage
    await uploadBytes(storageRef, file);
    return storageRef;
  }
}