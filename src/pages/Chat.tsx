import React, { Component, FormEvent, ChangeEvent, createRef } from 'react';
import { getFirestore, arrayUnion, setDoc, updateDoc, doc, getDoc, Timestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import './Chat.css';

// Create a wrapper component to use React Router hooks
const ChatWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <Chat return={() => navigate('/')} />;
};

type ChatProps = {
    // Return to the main page
    return: () => void;
}

// Message interface - compatible with Claude API format
interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Timestamp;
}

// Session metadata interface
interface SessionMetadata {
    characterId?: string;
    characterName?: string;
    lastUpdated: Timestamp;
    createdAt: Timestamp;
    userId: string;
}

// Chat session interface
interface ChatSession {
    messages: Message[];
    metadata: SessionMetadata;
}

type ChatState = {
    messages: Message[]; // Conversation history
    input: string; // Current content in the input box
    isLoading: boolean;
    error: string | null;
    sessionId: string;
}

export class Chat extends Component<ChatProps, ChatState> {
    private messagesEndRef = createRef<HTMLDivElement>();
    
    constructor(props: ChatProps) {
        super(props);
        this.state = {
            messages: [],
            input: "",
            isLoading: false,
            error: null,
            sessionId: this.generateSessionId() // Generate a unique session ID
        };
    }

    componentDidMount = async () => {
        await this.loadSession();
        this.scrollToBottom();
    };
    
    componentDidUpdate() {
        this.scrollToBottom();
    }

    scrollToBottom = () => {
        this.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    // Generate a unique session ID
    generateSessionId = (): string => {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000000);
        return `session_${timestamp}_${random}`;
    }

    render = (): JSX.Element => {
        const { messages, input, isLoading, error } = this.state;

        return (
            <div className="chat-container">
                <div className="chat-header">
                    <h1>Chat with AI Character</h1>
                    <button className="home-button" onClick={this.props.return}>Back to Home</button>
                </div>

                {/* Error message */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Conversation Box */}
                <div className="conversation-box">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.role}-message`}>
                            <div className="message-content">
                                <p>{msg.content}</p>
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="loading-indicator">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}
                    <div ref={this.messagesEndRef} />
                </div>

                {/* Input Box and Submit Button */}
                <form onSubmit={this.handleSubmit} className="input-form">
                    <input
                        type="text"
                        value={input}
                        onChange={this.handleInputChange}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="message-input"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="send-button"
                    >
                        Send
                    </button>
                </form>
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

        // Create userMessage object
        const userMessage: Message = {
            role: 'user', 
            content: newMessage,
            timestamp: Timestamp.now()
        };

        // Update local state to show user message and clear input box
        this.setState(prevState => ({
            messages: [...prevState.messages, userMessage],
            input: "",
            isLoading: true,
            error: null
        }));

        try {
            // Save user's message to Firestore
            await this.saveMessageToFirestore(userMessage);

            // Call Claude API via Cloud Function
            await this.callClaudeAPI();
        } catch (error) {
            console.error("Error sending message:", error);
            this.setState({
                isLoading: false,
                error: error instanceof Error ? error.message : "Error sending message"
            });
        }
    }

    saveMessageToFirestore = async (message: Message) => {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
            throw new Error("User not authenticated");
        }

        const { sessionId } = this.state;
        const sessionRef = doc(db, "chatSessions", sessionId);

        try {
            // Attempt to update existing document
            const docSnap = await getDoc(sessionRef);
            
            if (docSnap.exists()) {
                // Update existing session
                await updateDoc(sessionRef, {
                    messages: arrayUnion(message),
                    "metadata.lastUpdated": Timestamp.now()
                });
            } else {
                // Create new session
                const newSession: ChatSession = {
                    messages: [message],
                    metadata: {
                        userId: user.uid,
                        lastUpdated: Timestamp.now(),
                        createdAt: Timestamp.now()
                    }
                };
                await setDoc(sessionRef, newSession);
            }
        } catch (error) {
            console.error("Error saving to Firestore:", error);
            throw error;
        }
    }

    callClaudeAPI = async () => {
        try {
            const functions = getFunctions();
            const claudeFunction = httpsCallable(functions, "callClaudeAPI");

            // Call cloud function with all messages to maintain conversation context
            const result = await claudeFunction({
                messages: this.state.messages,
                sessionId: this.state.sessionId
            });

            // Process API response
            const data = result.data as { 
                success: boolean; 
                assistantMessage?: Message;
                error?: string;
            };

            if (data.success && data.assistantMessage) {
                // Add timestamp to the assistant message
                const assistantMessage: Message = {
                    ...data.assistantMessage,
                    timestamp: Timestamp.now()
                };

                // Update local state
                this.setState(prevState => ({
                    messages: [...prevState.messages, assistantMessage],
                    isLoading: false
                }));

                // Save assistant message to Firestore
                await this.saveMessageToFirestore(assistantMessage);
            } else {
                throw new Error(data.error || "Invalid response from Claude API");
            }
        } catch (error) {
            console.error("Error calling Claude API:", error);
            this.setState({
                isLoading: false,
                error: error instanceof Error ? error.message : "Error calling AI service"
            });
        }
    }

    loadSession = async () => {
        const db = getFirestore();
        const { sessionId } = this.state;
        const sessionRef = doc(db, "chatSessions", sessionId);

        try {
            const docSnap = await getDoc(sessionRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as ChatSession;
                this.setState({ messages: data.messages || [] });
            } else {
                // If no session exists, initialize with a system message
                const systemMessage: Message = {
                    role: 'system',
                    content: 'I am an AI character ready to have a conversation with you.',
                    timestamp: Timestamp.now()
                };
                
                this.setState({ 
                    messages: [systemMessage] 
                });
                
                // Save initial system message
                await this.saveMessageToFirestore(systemMessage);
            }
        } catch (error) {
            console.error("Error loading session:", error);
            this.setState({
                error: error instanceof Error ? error.message : "Error loading conversation history"
            });
        }
    }
}

export default ChatWrapper;