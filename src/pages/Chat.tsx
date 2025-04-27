import React, { Component, FormEvent, ChangeEvent, MouseEvent } from 'react';
import { getFirestore, arrayUnion, setDoc, updateDoc, collection, addDoc, serverTimestamp, getDoc, query, orderBy, doc} from "firebase/firestore";

type Chatprops = {
    // Return to the main page
    return: () => void;
}

type ChatState = {
    messages: { role: string; content: string }[]; // Conversation history
    input: string; // Current content in the input box
}

export class Chat extends Component<Chatprops, ChatState> {
    constructor(props: Chatprops) {
        super(props);
        this.state = {
            messages: [],
            input: ""
        }
    }

    componentDidMount = async () => {
        await this.loadMessages();
    };

    render = (): JSX.Element => {
        return <div style={{maxWidth: "600px", margin: "0 atuto", padding: "1rem"}}>
            <h1>Welcome to Chat Interface</h1>
            <button onClick={this.doReturnClick}>Home</button>

            {/*Conversation Box*/}
            <div style={{
                border: "1px solid #ccc",
                height: "400px",
                overflowY: "auto",
                padding: "1rem",
                marginTop: "1rem",
                backgroundColor: "#f9f9f9"
            }}>
                {this.state.messages.map((msg, idx) => (
                    <p key={idx} style={{margin: "0.5rem 0"}}>
                        <b>{msg.role}</b> {msg.content}
                    </p>
                ))}
            </div>

            {/*Input Box and Sumbit Button*/}
            <form onSubmit={this.handleSubmit} style={{marginTop: "1rem", display: "flex"}}>
                <input
                    type="text"
                    value={this.state.input}
                    onChange={this.handleInputChange}
                    placeholder="Type your message..."
                    style={{flex: 1, padding: "0.5rem", fontSize: "1rem"}}/>
                <button
                    type="submit"
                    style={{marginLeft: "0.5rem", padding: "0.5rem 1rem", fontSize: "1rem"}}>
                    Send
                </button>
            </form>
        </div>
    }


    doReturnClick = (_evt: MouseEvent<HTMLButtonElement>): void => {
            this.props.return();
    }

    handleInputChange = (evt: ChangeEvent<HTMLInputElement>): void => {
            this.setState({input: evt.target.value})
    }

    handleSubmit = async (evt: FormEvent<HTMLFormElement>): Promise<void> => {
            evt.preventDefault();
            const newMessage = this.state.input.trim();
            if (newMessage !== "") {
                // Local update first
                this.setState((prevState) => ({
                    messages: [...prevState.messages, {role: "user", content: newMessage}],
                    input: ""
                }));

                // Then save to Firestore
                await this.saveMessageToFirestore(newMessage);
            }
    }

    saveMessageToFirestore = async (content: string) => {
        const db = getFirestore();
        const sessionDocId = "default-session";
        const sessionRef = doc(db, "chats", sessionDocId);

        try {
            await updateDoc(sessionRef, {
                messages: arrayUnion({role: "user", content: content}),
                updatedAt: serverTimestamp(),
            })
        } catch (err) {
            await setDoc(sessionRef, {
                messages: [{role: "user", content: content}],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
        // await addDoc(chatsRef, {
        //     role: "user",
        //     content: content,
        //     timestamp: serverTimestamp(),
        // })
    }

    loadMessages = async () => {
        const db = getFirestore();
        const sessionDocId = "default-session";
        const sessionRef = doc(db, "chats", sessionDocId);
        const docSnap = await getDoc(sessionRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const messages = data.messages || [];
            this.setState({messages});
        } else {
            this.setState({messages: []});
        }


        // const q = query(chatsRef, orderBy("timestamp", "asc"));
        //
        // const querySnapshot = await getDocs(q);
        // const messages = querySnapshot.docs.map(doc => ({
        //     role: doc.data().role,
        //     content: doc.data().content
        // }));
        // this.setState({messages});
    }
}


