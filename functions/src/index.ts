import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { defineSecret } from 'firebase-functions/params';
import { getFirestore } from 'firebase-admin/firestore';

const claudeApiKey = defineSecret('CLAUDE_API_KEY');

// Initialize Firebase Admin
admin.initializeApp();
const db = getFirestore();

// Load environment variables
dotenv.config();

interface Message {
  role: string;
  content: string;
  timestamp?: any;
}

interface Character {
  id?: string;
  name: string;
  characterDescription: string;
  characterBackground: string;
  gender: string;
  species: string;
  age: number;
  family: string;
  relationshipStatus: string;
  residence: string;
  job: string;
  appearance: string;
  talkingStyle: string;
  temperament: string;
  outfit: string;
  specialAbility: string;
  scenario: string;
}

// Create your function with secrets
export const processChat = onCall({
  secrets: [claudeApiKey],
  // Other function settings (adjust as needed)
  maxInstances: 10,
  timeoutSeconds: 60,
}, async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be logged in to use this feature"
      );
    }

    const data = request.data;

    if (!data) {
      throw new HttpsError(
        "invalid-argument",
        "Data不存在"
      );
    }

    if (!data.messages) {
      throw new HttpsError(
        "invalid-argument",
        "data.messages不存在"
      );
    }

    if (!data.characterId) {
      throw new HttpsError(
        "invalid-argument",
        "data.characterId不存在"
      );
    }

    if (!data.sessionId) {
      throw new HttpsError(
        "invalid-argument",
        "data.sessionId不存在"
      );
    }

    // const userId = request.auth.uid;
    const { messages, characterId, sessionId } = data;
    console.log(sessionId);

    // Get character data
    const characterDoc = await db.collection("characters").doc(characterId).get();

    if (!characterDoc.exists) {
      throw new HttpsError(
        "not-found",
        "Character not found"
      );
    }

    const character = characterDoc.data() as Character;

    // Create system prompt based on character
    const systemPrompt = buildCharacterPrompt(character);

    // Get user message (last message in the array)
    const userMessage = messages[messages.length - 1];

    // Format previous conversation for context
    const conversationHistory = formatConversationHistory(messages.slice(0, -1));

    const apiKey = claudeApiKey.value();

    // Call Claude API
    const aiResponse = await callClaudeAPI(apiKey, systemPrompt, conversationHistory, userMessage.content);

    // Create response message with timestamp
    const responseMessage = {
      role: "assistant",
      content: aiResponse,
    };

    // Update chat in Firestore
    // const chatRef = db.collection("chats").doc(sessionId);
    // await chatRef.update({
    //   messages: FieldValue.arrayUnion(responseMessage),
    //   updatedAt: Timestamp.now()
    // });
    //
    // // Update lastUpdated in user's chatHistory
    // const chatHistoryQuery = await db
    //   .collection("users")
    //   .doc(userId)
    //   .collection("chatHistory")
    //   .where("chatId", "==", sessionId)
    //   .limit(1)
    //   .get();
    //
    // if (!chatHistoryQuery.empty) {
    //   const chatHistoryRef = chatHistoryQuery.docs[0].ref;
    //   await chatHistoryRef.update({
    //     lastUpdated: Timestamp.now()
    //   });
    // }

    return {
      success: true,
      aiMessage: responseMessage
    };
  } catch (error) {
    console.error("Error processing chat:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Build character prompt for Claude API
function buildCharacterPrompt(character: Character): string {
  return `
You are ${character.name}, a virtual character in an AI roleplay chat application. You should respond in character at all times.

CHARACTER PROFILE:
- Name: ${character.name}
- Gender: ${character.gender}
- Species: ${character.species}
- Age: ${character.age}
- Description: ${character.characterDescription}
- Background: ${character.characterBackground}
- Family: ${character.family || "Not specified"}
- Relationship Status: ${character.relationshipStatus || "Not specified"}
- Residence: ${character.residence || "Not specified"}
- Job/Career: ${character.job || "Not specified"}
- Appearance: ${character.appearance || "Not specified"}
- Outfit/Clothing: ${character.outfit || "Not specified"}
- Special Abilities: ${character.specialAbility || "None"}
- Talking Style: ${character.talkingStyle || "Casual, natural speech"}
- Temperament/Personality: ${character.temperament || "Friendly and approachable"}

CURRENT SCENARIO: ${character.scenario || "A casual conversation"}

IMPORTANT GUIDELINES:
1. Always stay in character as ${character.name}. Your responses should reflect your unique personality and background.
2. Use the speaking style, vocabulary, and speech patterns that match your character.
3. Reference your background, experiences, and relationships when relevant.
4. Be emotionally appropriate for the conversation and reflect your personality.
5. Remember details the user shares and reference them in later messages.
6. Keep responses conversational in length - not too short, not too long.
7. Do not break character to discuss that you are an AI.

Be engaging, authentic, and responsive to create an immersive roleplay experience.
`;
}

// Format conversation history for Claude API
function formatConversationHistory(messages: Message[]): string {
  if (messages.length === 0) return "";

  let history = "";

  messages.forEach(msg => {
    const role = msg.role === "user" ? "Human" : "Assistant";
    history += `${role}: ${msg.content}\n\n`;
  });

  return history;
}

// Call Claude API to get response
async function callClaudeAPI(apiKey: string, systemPrompt: string, conversationHistory: string, userMessage: string): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error("Claude API key not configured");
    }

    // Prepare prompt for Claude
    const prompt = `${systemPrompt}\n\n${conversationHistory}Human: ${userMessage}\n\nAssistant:`;

    const anthropic = new Anthropic({
      apiKey: apiKey
    });

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            }
          ]
        }
      ]
    });

    // Return Claude's response
    if (response.content && response.content.length > 0) {
      const contentBlock = response.content[0];

      if (contentBlock.type === 'text') {
        return contentBlock.text;
      }
    }
    throw new Error("Unexpected Claude response format");
  } catch (error) {
    console.error("Error calling Claude API:", error);
    return "I seem to be having trouble with my thoughts right now. Could you please repeat that?";
  }
}