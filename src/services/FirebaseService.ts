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
  Timestamp,
  deleteDoc,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface FriendData {
  userId: string;
  userUsername: string;
  userDisplayName: string;
  userAvatar: string;
  pending: boolean;
  createdAt?: any;
}

export interface UserData {
  username: string;
  displayName: string;
  email: string;
  userAvatar: string;
  userDescription: string;
  userCharacters: string[];
  friendCount?: number; // Add this field
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

    // Create the main user document with friendCount defaulting to 0
    await setDoc(doc(db, "users", userId), {
      ...userData,
      friendCount: userData.friendCount || 0, // Initialize friend count
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

  static async deleteCharacter(userId: string, characterId: string): Promise<void> {
    console.log("userId: " + userId + " characterId: " + characterId)
    try {
      const db = getFirestore();

      // 1. Delete the character document from Firestore
      const characterRef = doc(db, 'characters', characterId);
      const characterSnap = await getDoc(characterRef);

      if (!characterSnap.exists()) {
        throw new Error("Character not found.");
      }

      const characterData = characterSnap.data();
      const tags: string[] = characterData.tags || [];

      // Remove characterId from each tag's subcollection
      for (const tag of tags) {
        const tagRef = doc(db, 'tags', tag);
        const tagCharRef = doc(tagRef, 'characters', characterId);
        await deleteDoc(tagCharRef);
        await updateDoc(tagRef, {
          characterCount: increment(-1)
        });
        const remaining = await getDocs(collection(tagRef, 'characters'));
        if (remaining.empty) {
          await deleteDoc(tagRef);
          console.log(`Tag "${tag}" deleted because it had no more characters.`);
        }
      }

      // Delete the character document
      await deleteDoc(characterRef);

      // 2. Remove the characterId from user's userCharacters array
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentList = Array.isArray(userData.userCharacters)
          ? userData.userCharacters
          : [];

        const updatedCharacterList = currentList.filter((id: string) => id !== characterId);

        await updateDoc(userRef, {
          userCharacters: updatedCharacterList
        });
      }
    } catch (error) {
      console.error("Error deleting character:", error);
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

  /**
   * Send a friend request to another user
   */
  static async sendFriendRequest(targetUserId: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to send friend requests');
      }

      if (currentUser.uid === targetUserId) {
        throw new Error('You cannot add yourself as a friend');
      }

      // Get current user's data
      const currentUserData = await this.getUserData(currentUser.uid);
      if (!currentUserData) {
        throw new Error('Unable to fetch your user data');
      }

      // Check if friendship already exists
      const db = getFirestore();
      const existingFriendDoc = await getDoc(doc(db, "users", targetUserId, "friends", currentUser.uid));

      if (existingFriendDoc.exists()) {
        const data = existingFriendDoc.data();
        if (data.pending) {
          throw new Error('Friend request already sent');
        } else {
          throw new Error('You are already friends');
        }
      }

      // Create friend request document in target user's friends collection
      const friendRequestData: FriendData = {
        userId: currentUser.uid,
        userUsername: currentUserData.username,
        userDisplayName: currentUserData.displayName || currentUserData.username,
        userAvatar: currentUserData.userAvatar || '',
        pending: true,
        createdAt: serverTimestamp()
      };

      await setDoc(
        doc(db, "users", targetUserId, "friends", currentUser.uid),
        friendRequestData
      );
    } catch (error) {
      console.error("Error sending friend request:", error);
      throw error;
    }
  }

  /**
   * Accept a friend request
   */
  static async acceptFriendRequest(requesterId: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to accept friend requests');
      }

      const db = getFirestore();

      // Get the pending request
      const requestDoc = await getDoc(doc(db, "users", currentUser.uid, "friends", requesterId));

      if (!requestDoc.exists()) {
        throw new Error('Friend request not found');
      }

      const requestData = requestDoc.data();
      if (!requestData.pending) {
        throw new Error('This is not a pending friend request');
      }

      // Get current user's data
      const currentUserData = await this.getUserData(currentUser.uid);
      if (!currentUserData) {
        throw new Error('Unable to fetch your user data');
      }

      // Start a batch write
      const batch = writeBatch(db);

      // Update the request to accepted in current user's friends
      batch.update(doc(db, "users", currentUser.uid, "friends", requesterId), {
        pending: false
      });

      // Add current user to requester's friends
      const reciprocalFriendData: FriendData = {
        userId: currentUser.uid,
        userUsername: currentUserData.username,
        userDisplayName: currentUserData.displayName || currentUserData.username,
        userAvatar: currentUserData.userAvatar || '',
        pending: false,
        createdAt: serverTimestamp()
      };

      batch.set(
        doc(db, "users", requesterId, "friends", currentUser.uid),
        reciprocalFriendData
      );

      // Update friend counts
      batch.update(doc(db, "users", currentUser.uid), {
        friendCount: increment(1)
      });

      batch.update(doc(db, "users", requesterId), {
        friendCount: increment(1)
      });

      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.error("Error accepting friend request:", error);
      throw error;
    }
  }

  /**
   * Decline a friend request
   */
  static async declineFriendRequest(requesterId: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to decline friend requests');
      }

      const db = getFirestore();

      // Verify the request exists and is pending
      const requestDoc = await getDoc(doc(db, "users", currentUser.uid, "friends", requesterId));

      if (!requestDoc.exists()) {
        throw new Error('Friend request not found');
      }

      const requestData = requestDoc.data();
      if (!requestData.pending) {
        throw new Error('This is not a pending friend request');
      }

      // Delete the friend request
      await deleteDoc(doc(db, "users", currentUser.uid, "friends", requesterId));
    } catch (error) {
      console.error("Error declining friend request:", error);
      throw error;
    }
  }

  /**
   * Remove a friend
   */
  static async removeFriend(friendUserId: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to remove friends');
      }

      const db = getFirestore();

      // Verify friendship exists
      const friendDoc = await getDoc(doc(db, "users", currentUser.uid, "friends", friendUserId));

      if (!friendDoc.exists() || friendDoc.data().pending) {
        throw new Error('Not friends with this user');
      }

      // Start a batch write
      const batch = writeBatch(db);

      // Remove from both users' friends lists
      batch.delete(doc(db, "users", currentUser.uid, "friends", friendUserId));
      batch.delete(doc(db, "users", friendUserId, "friends", currentUser.uid));

      // Update friend counts
      batch.update(doc(db, "users", currentUser.uid), {
        friendCount: increment(-1)
      });

      batch.update(doc(db, "users", friendUserId), {
        friendCount: increment(-1)
      });

      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.error("Error removing friend:", error);
      throw error;
    }
  }

  /**
   * Get all friends and pending requests for a user
   */
  static async getFriendsAndRequests(userId: string): Promise<{
    friends: FriendData[],
    pendingRequests: FriendData[]
  }> {
    try {
      const db = getFirestore();
      const friendsRef = collection(db, "users", userId, "friends");

      const querySnapshot = await getDocs(friendsRef);

      const friends: FriendData[] = [];
      const pendingRequests: FriendData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as FriendData;
        data.userId = doc.id; // Ensure userId is set

        if (data.pending) {
          pendingRequests.push(data);
        } else {
          friends.push(data);
        }
      });

      // Sort by creation date (newest first for requests, alphabetical for friends)
      pendingRequests.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.() || new Date(0);
        const timeB = b.createdAt?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });

      friends.sort((a, b) =>
        (a.userDisplayName || a.userUsername).localeCompare(b.userDisplayName || b.userUsername)
      );

      return { friends, pendingRequests };
    } catch (error) {
      console.error("Error fetching friends and requests:", error);
      throw error;
    }
  }

  /**
   * Check friendship status between two users
   */
  static async checkFriendshipStatus(userId1: string, userId2: string): Promise<'friends' | 'pending' | 'none'> {
    try {
      const db = getFirestore();

      // Check if userId2 is in userId1's friends
      const friendDoc = await getDoc(doc(db, "users", userId1, "friends", userId2));

      if (friendDoc.exists()) {
        const data = friendDoc.data();
        return data.pending ? 'pending' : 'friends';
      }

      // Check if there's a pending request from userId1 to userId2
      const reverseDoc = await getDoc(doc(db, "users", userId2, "friends", userId1));

      if (reverseDoc.exists() && reverseDoc.data().pending) {
        return 'pending';
      }

      return 'none';
    } catch (error) {
      console.error("Error checking friendship status:", error);
      return 'none';
    }
  }

  /**
   * Get friend count for a user
   */
  static async getFriendCount(userId: string): Promise<number> {
    try {
      const userData = await this.getUserData(userId);
      return userData?.friendCount || 0;
    } catch (error) {
      console.error("Error getting friend count:", error);
      return 0;
    }
  }
}