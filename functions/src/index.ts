/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();

interface Message {
    role: string;
    content: string;
}

interface DeepseekChatResult {
    success: boolean;
    aiMessage: Message;
}

export const deepseekChat = functions.https.onCall(async (data): Promise<DeepseekChatResult> => {
    try {

        // Carefully check the format of messages
        if (!data|| typeof data !== 'object') {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "请求数据格式无效"
            );
        }

        if (!('messages' in data)) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "没有message在data里面"
            );
        }

        if (!Array.isArray(data.messages)) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "不是array"
            );
        }

        if (data.messages.length === 0 ) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "message长度为0"
            );
        }

        // if (!('messages' in data) || !Array.isArray(data.messages) || data.messages.length === 0) {
        //     throw new functions.https.HttpsError(
        //         "invalid-argument",
        //         "消息格式无效或未空"
        //     );
        // }

        // Obtain the messages
        const messages = data.messages as Message[];

        // Safely extract sessionId
        const sessionId = 'sessionId' in data && typeof data.sessionId === 'string' ? data.sessionId : undefined;


        //Obtain DeepSeek API key
        const deepseekApiKey = functions.config().deepseek.apikey;

        if (!deepseekApiKey) {
            throw new functions.https.HttpsError(
                "failed-precondition",
                "服务器未正确配置API密钥"
            );
        }

        // Call DeepSeek API
        const response = await axios.post(
            "https://api.deepseek.com/v1/chat/completions",
            {
                model: "deepseek-chat",
                messages: messages,
                temperature: 0.7,
                max_tokens: 800,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${deepseekApiKey}`
                }
            }
        );

        if (response.status !== 200) {
            throw new functions.https.HttpsError('internal', 'DeepSeek 服务异常');
        }

        // Check do we have valid AI response
        if (!response.data || !response.data.choices || !Array.isArray(response.data.choices) ||
            response.data.choices.length === 0 || !response.data.choices[0].message ||
        typeof response.data.choices[0].message.content !== "string") {
            throw new functions.https.HttpsError(
                "internal",
                "从DeepSeek API 收到的响应格式无效"
            );
        }

        // Get AI's response
        const aiResponse: Message = {
            role: response.data.choices[0].message.role,
            content: response.data.choices[0].message.content
        }

        // Add AI response to the dialog history in Firestore
        if (sessionId) {
            const db = admin.firestore();
            const sessionRef = db.collection("chats").doc(sessionId);

            try {
                await sessionRef.update({
                    messages: admin.firestore.FieldValue.arrayUnion(aiResponse),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            } catch (err) {
                console.error("更新 Firestore 时出错", err);
            }
        }

        // Return AI response to client
        return {
            success: true,
            aiMessage: aiResponse
        };

    } catch (error) {
        console.error("DeepSeek 聊天请求出错：", error);

        // Return the error message to client
        throw new functions.https.HttpsError(
            "internal",
            error instanceof Error ? error.message : "与AI聊天服务时出错"
        );
    }
})