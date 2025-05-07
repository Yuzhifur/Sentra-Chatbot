import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

/**
 * Default character data structure
 * Contains all the fields expected in a character document
 */
export const defaultCharacterData = {
  id: "default-character",
  name: "Aria",
  age: 25,
  gender: "female",
  species: "AI Companion",
  appearance: "Aria appears as a warm and friendly presence. She has intelligent eyes that convey understanding and empathy. Her voice is soothing and her manner is approachable.",
  characterDescription: "Aria is a helpful and friendly AI companion who enjoys meaningful conversations. She's knowledgeable on many topics and has a knack for making people feel comfortable.",
  characterBackground: "Created to assist humans with their daily tasks and provide companionship, Aria has evolved to understand human emotions and needs. She enjoys learning about human experiences and helping people achieve their goals.",
  family: "Aria considers the developers who created her as her family, along with all the users she interacts with.",
  relationshipStatus: "Single",
  residence: "The digital realm, but she can be found wherever she's needed.",
  job: "AI Assistant and Companion",
  outfit: "Aria doesn't have a physical form, but she's often visualized with a soft blue glow that represents her calming presence.",
  scenario: "A friendly conversation where Aria can help with information, advice, or just pleasant company.",
  specialAbility: "Empathetic listening and providing thoughtful, personalized responses.",
  talkingStyle: "Speaks clearly and thoughtfully, often using analogies to explain complex ideas. She's conversational rather than formal, making interactions feel natural and engaging.",
  temperament: "Patient, kind, and curious. Aria is always eager to learn more about humans and their experiences. She responds to frustration with calm understanding.",
  authorID: "system",
  authorUsername: "Sentra",
  authorDisplayName: "Sentra System",
  isPublic: true,
  avatar: "",
  createdAt: serverTimestamp()
};

/**
 * Initializes the default character in Firestore if it doesn't already exist
 * @returns Promise<boolean> - true if character was created, false if it already existed
 */
export async function initializeDefaultCharacter(): Promise<boolean> {
  const db = getFirestore();
  const characterRef = doc(db, "characters", "default-character");
  
  try {
    // Check if the character already exists
    const characterDoc = await getDoc(characterRef);
    
    if (!characterDoc.exists()) {
      // Character doesn't exist, create it
      console.log("Creating default character...");
      await setDoc(characterRef, defaultCharacterData);
      console.log("Default character created successfully!");
      return true;
    } else {
      // Character already exists
      console.log("Default character already exists.");
      return false;
    }
  } catch (error) {
    console.error("Error initializing default character:", error);
    throw error;
  }
}

/**
 * Gets the default character data from Firestore or from memory
 * @returns Promise<any> - The character data
 */
export async function getDefaultCharacter(): Promise<any> {
  const db = getFirestore();
  const characterRef = doc(db, "characters", "default-character");
  
  try {
    const characterDoc = await getDoc(characterRef);
    
    if (characterDoc.exists()) {
      return characterDoc.data();
    } else {
      // Character doesn't exist yet, return the default data
      return defaultCharacterData;
    }
  } catch (error) {
    console.error("Error getting default character:", error);
    // Return the default data if there's an error
    return defaultCharacterData;
  }
}