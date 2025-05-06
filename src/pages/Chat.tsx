import React, { Component, FormEvent, ChangeEvent, MouseEvent } from 'react';
import { getFirestore, setDoc, updateDoc, getDoc, doc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Chat.css';

// Create a wrapper component to use React Router hooks
const ChatWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { characterId, sessionId } = useParams();
  return (
    <Chat 
      return={() => navigate('/')}
      characterId={characterId || "1"} // Default to character "1" if not provided
      sessionId={sessionId || "default-session"} // Default session ID
    />
  );
};

type ChatProps = {
    return: () => void;
    characterId: string;
    sessionId: string;
};

type Message = {
    role: string;
    content: string;
};

// Format of the history stored in Firestore
type ChatHistory = {
    messages: Message[];
};

type ChatState = {
    messages: Message[]; // Conversation history
    input: string; // Current content in the input box
    isLoading: boolean;
    error: string | null;
    characterName: string;
    userName: string;
};

export class Chat extends Component<ChatProps, ChatState> {
    constructor(props: ChatProps) {
        super(props);
        this.state = {
            messages: [],
            input: "",
            isLoading: false,
            error: null,
            characterName: "Loading...",
            userName: "User"
        };
    }

    componentDidMount = async () => {
        await this.loadCharacterInfo();
        await this.loadUserInfo();
        await this.loadChat();
    };

    render = (): JSX.Element => {
        const { messages, input, isLoading, error, characterName } = this.state;

        return (
            <div className="chat-container">
                <Sidebar doResetDashboard={() => {}} />
                <div className="chat-main">
                    <div className="chat-header">
                        <button className="home-button" onClick={this.props.return}>Home</button>
                        <h1>Chat with {characterName}</h1>
                    </div>

                    {/* Error message */}
                    {error && <div className="error-message">{error}</div>}

                    {/* Conversation Box */}
                    <div className="conversation-box">
                        {messages.length === 0 ? (
                            <div className="empty-chat">
                                Start a conversation with {characterName} by typing a message below.
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`message ${msg.role === "user" ? "user-message" : "assistant-message"}`}>
                                    <div className="message-header">
                                        <b>{msg.role === "user" ? this.state.userName : characterName}</b>
                                    </div>
                                    <div className="message-content">
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="loading-indicator">
                                {characterName} is typing...
                            </div>
                        )}
                    </div>

                    {/* Input Box and Submit Button */}
                    <form onSubmit={this.handleSubmit} className="input-form">
                        <input
                            type="text"
                            value={input}
                            onChange={this.handleInputChange}
                            placeholder={`Send a message to ${characterName}...`}
                            className="message-input"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || input.trim() === ""}
                            className={`send-button ${isLoading || input.trim() === "" ? "disabled" : ""}`}
                        >
                            {isLoading ? 'Sending...' : 'Send'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    handleInputChange = (evt: ChangeEvent<HTMLInputElement>): void => {
        this.setState({ input: evt.target.value });
    }

    handleSubmit = async (evt: FormEvent<HTMLFormElement>): Promise<void> => {
        evt.preventDefault();
        const newMessage = this.state.input.trim();
        if (newMessage === "" || this.state.isLoading) {
            return;
        }

        // Create user message
        const userMessage: Message = {
            role: "user",
            content: newMessage
        };

        // Update local state to show user message and clear input box
        this.setState(prevState => ({
            messages: [...prevState.messages, userMessage],
            input: "",
            isLoading: true,
            error: null
        }));

        try {
            // Add the user message to the chat history
            const updatedMessages = [...this.state.messages, userMessage];
            await this.saveChat(updatedMessages);

            // For now, we'll use a simulated response instead of calling the cloud function
            // This allows us to test the UI without depending on the cloud function
            setTimeout(() => {
                const assistantMessage: Message = {
                    role: "assistant",
                    content: `This is a simulated response. You said: "${newMessage}". In a real implementation, this would be a response from the cloud function connecting to Claude API.`
                };
                
                // Update state with assistant message
                this.setState(prevState => ({
                    messages: [...prevState.messages, assistantMessage],
                    isLoading: false
                }));
                
                // Save the updated chat including the assistant's response
                this.saveChat([...updatedMessages, assistantMessage])
                    .catch(err => console.error("Error saving assistant message:", err));
            }, 1000);

            /* 
            // Commented out for now until cloud function issues are resolved
            // Call cloud function to process the chat and get AI response
            const functions = getFunctions();
            const processChat = httpsCallable(functions, "processChat");
            
            console.log("Sending to cloud function:", {
                messages: updatedMessages,
                sessionId: this.props.sessionId,
                characterId: this.props.characterId
            });
            
            const response = await processChat({
                messages: updatedMessages,
                sessionId: this.props.sessionId,
                characterId: this.props.characterId
            });
            
            // Handle response and update state
            const data = response.data as { success: boolean; aiMessage: Message };
            
            if (data.success && data.aiMessage) {
                const assistantMessage = data.aiMessage;
                
                // Update state with assistant message
                this.setState(prevState => ({
                    messages: [...prevState.messages, assistantMessage],
                    isLoading: false
                }));
                
                // Save the updated chat including the assistant's response
                await this.saveChat([...updatedMessages, assistantMessage]);
            } else {
                throw new Error("Failed to get a valid response");
            }
            */
        } catch (error) {
            console.error("Error in chat:", error);
            this.setState({
                isLoading: false,
                error: error instanceof Error ? error.message : "An error occurred"
            });
        }
    }

    loadCharacterInfo = async () => {
        try {
            const db = getFirestore();
            const characterRef = doc(db, "characters", this.props.characterId);
            const characterDoc = await getDoc(characterRef);
            
            if (characterDoc.exists()) {
                const characterData = characterDoc.data();
                this.setState({
                    characterName: characterData.name || "Character"
                });
            } else {
                this.setState({
                    characterName: "Unknown Character",
                    error: "Character not found"
                });
            }
        } catch (error) {
            console.error("Error loading character:", error);
            this.setState({
                error: error instanceof Error ? error.message : "Error loading character information"
            });
        }
    }

    loadUserInfo = async () => {
        try {
            const auth = getAuth();
            const currentUser = auth.currentUser;
            
            if (currentUser) {
                const db = getFirestore();
                const userRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    this.setState({
                        userName: userData.displayName || "User"
                    });
                }
            }
        } catch (error) {
            console.error("Error loading user info:", error);
            // Don't set an error state here as it's not critical
        }
    }

    loadChat = async () => {
        try {
            const db = getFirestore();
            const chatRef = doc(db, "chats", this.props.sessionId);
            const chatDoc = await getDoc(chatRef);
            
            console.log("Loading chat document:", this.props.sessionId);
            
            if (chatDoc.exists()) {
                const chatData = chatDoc.data();
                console.log("Chat data loaded:", chatData);
                
                // Parse the history string to get messages
                if (chatData.history) {
                    try {
                        const history: ChatHistory = JSON.parse(chatData.history);
                        console.log("Parsed history:", history);
                        
                        if (history.messages && Array.isArray(history.messages)) {
                            this.setState({ messages: history.messages });
                        } else {
                            console.error("Invalid messages format in history:", history);
                        }
                    } catch (parseError) {
                        console.error("Error parsing chat history:", parseError);
                        this.setState({
                            error: "Error loading chat history"
                        });
                    }
                } else {
                    console.log("No history field in chat document");
                }
            } else {
                console.log("Chat doesn't exist, creating new chat");
                // Chat doesn't exist yet, create a new one
                await this.createNewChat();
            }
        } catch (error) {
            console.error("Error loading chat:", error);
            this.setState({
                error: error instanceof Error ? error.message : "Error loading chat"
            });
        }
    }

    createNewChat = async () => {
        try {
            const auth = getAuth();
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                this.setState({
                    error: "You must be logged in to chat"
                });
                return;
            }
            
            const db = getFirestore();
            const chatRef = doc(db, "chats", this.props.sessionId);
            
            const newChat = {
                characterId: this.props.characterId,
                characterName: this.state.characterName,
                userId: currentUser.uid,
                userName: this.state.userName,
                history: JSON.stringify({ messages: [] }),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            await setDoc(chatRef, newChat);
            
            // Reset messages state to empty
            this.setState({ messages: [] });
        } catch (error) {
            console.error("Error creating new chat:", error);
            this.setState({
                error: error instanceof Error ? error.message : "Error creating new chat"
            });
        }
    }

    saveChat = async (messages: Message[]) => {
        try {
            const db = getFirestore();
            const chatRef = doc(db, "chats", this.props.sessionId);
            
            // Format the history as a JSON string
            const historyStr = JSON.stringify({ messages });
            console.log("Saving chat history:", historyStr);
            
            // Check if the document exists first
            const docSnap = await getDoc(chatRef);
            
            if (docSnap.exists()) {
                // Update existing document
                await updateDoc(chatRef, {
                    history: historyStr,
                    updatedAt: new Date()
                });
                console.log("Chat history updated successfully");
            } else {
                // Create new document
                await setDoc(chatRef, {
                    characterId: this.props.characterId,
                    characterName: this.state.characterName,
                    userId: getAuth().currentUser?.uid || "unknown-user",
                    userName: this.state.userName,
                    history: historyStr,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log("New chat document created successfully");
            }
        } catch (error) {
            console.error("Error saving chat:", error);
            throw error;
        }
    }
}

export default ChatWrapper;