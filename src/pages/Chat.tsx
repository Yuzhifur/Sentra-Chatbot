import React, { Component, FormEvent, ChangeEvent, MouseEvent } from 'react';
import { getFirestore, arrayUnion, setDoc, updateDoc, collection, addDoc, serverTimestamp, getDoc, query, orderBy, doc} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useNavigate } from 'react-router-dom';
// Create a wrapper component to use React Router hooks
const ChatWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <Chat return={() => navigate('/')} />;
};

type ChatProps = {
    // Return to the main page
    return: () => void;
}

type ChatState = {
    messages: { role: string; content: string }[]; // Conversation history
    input: string; // Current content in the input box
    isLoading: boolean;
    error: string | null;
}

export class Chat extends Component<ChatProps, ChatState> {
    private sessionId: string = "default-session";
    constructor(props: ChatProps) {
        super(props);
        this.state = {
            messages: [],
            input: "",
            isLoading: false,
            error: null
        }
    }

    componentDidMount = async () => {
        await this.loadMessages();
    };

    render = (): JSX.Element => {
        const { messages, input, isLoading, error } = this.state;

        return <div style={{maxWidth: "800px", margin: "0 auto", padding: "1rem", marginLeft: "250px"}}>
            <h1>Welcome to Chat Interface</h1>
            <button onClick={this.props.return}>Home</button>

            {/* Error message */}
            {error && (
                <div style={{
                    backgroundColor: "#ffdddd",
                    color: "#ff0000",
                    padding: "0.5rem",
                    marginTop: "1rem",
                    borderRadius: "4px"
                }}>
                    {error}
                </div>
            )}

            {/*Conversation Box*/}
            <div style={{
                border: "1px solid #ccc",
                height: "400px",
                overflowY: "auto",
                padding: "1rem",
                marginTop: "1rem",
                backgroundColor: "#f9f9f9"
            }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        margin: "0.5rem 0",
                        padding: "0.5rem",
                        backgroundColor: msg.role==="user" ? "#e3f2fd" : "#f1f8e9",
                        borderRadius: "8px",
                        maxWidth: "80%",
                        marginLeft: msg.role==="user" ? "auto" : "0"
                    }}>
                        <b>{msg.role}</b>
                        <span style={{whiteSpace: "pre-wrap"}}>{msg.content}</span>
                    </div>
                ))}

                {/* loading indicator */}
                {isLoading && (
                    <div style={{textAlign: "center", padding: "1rem"}}>
                        AI is thinking...
                    </div>
                )}
            </div>

            {/*Input Box and Submit Button*/}
            <form onSubmit={this.handleSubmit} style={{marginTop: "1rem", display: "flex"}}>
                <input
                    type="text"
                    value={input}
                    onChange={this.handleInputChange}
                    placeholder="Type your message..."
                    style={{flex: 1, padding: "0.5rem", fontSize: "1rem"}}/>
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{marginLeft: "0.5rem", padding: "0.5rem 1rem", fontSize: "1rem",
                            backgroundColor: isLoading ? "#cccccc" : "#4285f4", color: "white", border: "none",
                            borderRadius: "4px", cursor: isLoading ? "not-allowed" : "pointer"}}>
                    Send
                </button>
            </form>
        </div>
    }

    handleInputChange = (evt: ChangeEvent<HTMLInputElement>): void => {
            this.setState({input: evt.target.value})
    }

    handleSubmit = async (evt: FormEvent<HTMLFormElement>): Promise<void> => {
        evt.preventDefault();
        const newMessage = this.state.input.trim();
        if (newMessage === "" || this.state.isLoading) {
            return;
        }

        // Create userMessage object
        const userMessage = {role: "user", content: newMessage};

        // Update local condition to show user message and clear input box
        this.setState(prevState => ({
            messages: [...prevState.messages, userMessage],
            input: "",
            isLoading: true,
            error: null
        }));

        try {
            // Save user's message to Firestore
            await this.saveMessageToFirestore(userMessage);

            // Send message to DeepSeek
            await this.callDeepSeekAPI();
        } catch (error) {
            console.error("发送消息时出错：", error);
            this.setState({
                isLoading: false,
                error: error instanceof Error ? error.message : "发送消息时出错"
            });
        }
    }

    saveMessageToFirestore = async (message: {role: string; content: string}) => {
        const db = getFirestore();
        const sessionRef = doc(db, "chats", this.sessionId);

        try {
            await updateDoc(sessionRef, {
                messages: arrayUnion(message),
                updatedAt: serverTimestamp(),
            })
        } catch (err) {
            await setDoc(sessionRef, {
                messages: [message],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
    }

    callDeepSeekAPI = async () => {
        try {
            // 创建一个测试消息数组
            const testMessages = [
                { role: "user", content: "这是一条测试消息" }
            ];

            const functions = getFunctions();
            const deepseekChatFunction = httpsCallable(functions, "deepseekChat");

            const requestObj = {
                messages: testMessages,
                sessionId: this.sessionId
            };

            const result = await deepseekChatFunction(requestObj);

            // Call cloud function
            // const result = await deepseekChatFunction({
            //     messages: this.state.messages,
            //     sessionId: this.sessionId
            // });

            // Handle API response
            const data = result.data as { success: boolean; aiMessage: {role: string; content: string}};

            if (data.success && data.aiMessage) {
                this.setState(prevState => ({
                    messages: [...prevState.messages, data.aiMessage],
                    isLoading: false
                }));
            } else {
                throw new Error("未收到有效AI响应");
            }
        } catch (error) {
            console.error("调用API时出错：", error);
            this.setState({
                isLoading: false,
                error: error instanceof Error ? error.message : "调用API服务时出错"
            });
        }
    }

    loadMessages = async () => {
        const db = getFirestore();
        const sessionRef = doc(db, "chats", this.sessionId);

        try {
            const docSnap = await getDoc(sessionRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const messages = data.messages || [];
                this.setState({messages});
            } else {
                this.setState({messages: [] });
            }
        } catch (error) {
            console.error("加载消息时出错：", error);
            this.setState({
                error: error instanceof Error ? error.message : "加载对话历史时出错"
            })
        }
    }
}

export default ChatWrapper;