import { 
    getFirestore, 
    doc, 
    setDoc,
    getDoc,
    Timestamp 
  } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';
  import { FirebaseService } from './FirebaseService';
  
  export interface CharacterCreateData {
    name: string;
    age?: number;
    gender?: string;
    species?: string;
    characterDescription: string;
    characterBackground?: string;
    family?: string;
    relationshipStatus?: string;
    residence?: string;
    job?: string;
    appearance?: string;
    talkingStyle?: string;
    temperament?: string;
    scenario?: string;
    specialAbility?: string;
    outfit?: string;
    isPublic: boolean;
    avatar?: string;
  }
  
  export class CharacterService {
    /**
     * Creates a new character and adds it to the user's character list
     * @param characterData The character data to create
     * @returns The numeric ID of the created character
     */
    static async createCharacter(characterData: CharacterCreateData): Promise<string> {
      try {
        // Get current user
        const auth = getAuth();
        const currentUser = auth.currentUser;
  
        if (!currentUser) {
          throw new Error('You must be logged in to create a character');
        }
  
        // Get user data
        const userData = await FirebaseService.getUserData(currentUser.uid);
        
        if (!userData) {
          throw new Error('Failed to load user data');
        }
  
        // Get next character ID
        const nextId = await FirebaseService.getNextCharacterId();
        const characterId = `char_${nextId}`;
        
        // Create a new character document
        const db = getFirestore();
        const characterRef = doc(db, "characters", characterId);
        
        // Prepare character data
        const fullCharacterData = {
          id: nextId.toString(), // Numeric ID as string
          name: characterData.name,
          age: characterData.age || null,
          gender: characterData.gender || '',
          species: characterData.species || 'Human',
          characterDescription: characterData.characterDescription,
          characterBackground: characterData.characterBackground || '',
          family: characterData.family || '',
          relationshipStatus: characterData.relationshipStatus || '',
          residence: characterData.residence || '',
          job: characterData.job || '',
          appearance: characterData.appearance || '',
          outfit: characterData.outfit || '',
          scenario: characterData.scenario || '',
          specialAbility: characterData.specialAbility || '',
          talkingStyle: characterData.talkingStyle || '',
          temperament: characterData.temperament || '',
          authorID: currentUser.uid,
          authorUsername: userData.username,
          authorDisplayName: userData.displayName || userData.username,
          avatar: characterData.avatar || "", // Default empty, would be handled by image upload
          isPublic: characterData.isPublic !== undefined ? characterData.isPublic : true,
          createdAt: Timestamp.now()
        };
        
        // Create the character document
        await setDoc(characterRef, fullCharacterData);
        
        // Add the character ID to the user's userCharacters array
        await FirebaseService.addCharacterToUserList(currentUser.uid, characterId);
        
        return nextId.toString();
      } catch (error) {
        console.error("Error in CharacterService.createCharacter:", error);
        throw error;
      }
    }
  
    /**
     * Gets a character by ID
     * @param characterId The character ID
     * @returns The character data
     */
    static async getCharacter(characterId: string) {
      try {
        const db = getFirestore();
        const characterDoc = await getDoc(doc(db, "characters", characterId));
        
        if (!characterDoc.exists()) {
          throw new Error(`Character with ID ${characterId} not found`);
        }
        
        return characterDoc.data();
      } catch (error) {
        console.error("Error in CharacterService.getCharacter:", error);
        throw error;
      }
    }
  }