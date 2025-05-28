import React, { Component, FormEvent, ChangeEvent, useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getAuth } from 'firebase/auth';
import { ChatService, Message } from '../services/ChatService';
import { CharacterService } from '../services/CharacterService';
import ChatTitleEditor from '../components/ChatTitleEditor';
import './Chat.css';
import '../components/ChatTitleEditor.css';

// Wrapper component to use hooks
const ChatWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { characterId, sessionId } = useParams();
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [initialChatId, setInitialChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState<string>('');

  // Use a ref to track if we've already initialized
  const hasInitialized = useRef<boolean>(false);

  const notifySidebarUpdate = () => {
    window.dispatchEvent(new CustomEvent('chatListUpdated'));
  };

  useEffect(() => {
    // This function runs only once to set up the chat
    const setupChat = async () => {
      // Check if we've already initialized to prevent double execution
      if (hasInitialized.current) {
        return;
      }

      // Mark as initialized immediately to prevent concurrent calls
      hasInitialized.current = true;

      try {
        // Case 1: Both characterId and sessionId exist - use existing chat session
        if (characterId && sessionId) {
          console.log(`Using existing chat: ${sessionId} with character: ${characterId}`);

          // Get the chat data to retrieve the title
          const chatData = await ChatService.getChatSession(sessionId);
          if (chatData.title) {
            setChatTitle(chatData.title);
          } else {
            // If no title exists, set a default one based on character name
            setChatTitle(`Chat with ${chatData.characterName}`);
          }

          setInitialChatId(sessionId);
          setInitialLoading(false);
          return;
        }

        // Case 2: Only characterId exists - create a new chat session
        if (characterId && !sessionId) {
          console.log(`Creating new chat with character: ${characterId}`);
          const newChatId = await ChatService.createChatSession(characterId);

          // Get character name to set a default title
          const characterData = await CharacterService.getCharacter(characterId);
          setChatTitle(`Chat with ${characterData.name}`);

          // Set local state first
          setInitialChatId(newChatId);
          setInitialLoading(false);

          notifySidebarUpdate();

          // Then update URL with the new chat ID without triggering a new navigation
          navigate(`/chat/${characterId}/${newChatId}`, { replace: true });
          return;
        }

        // Case 3: Neither exist - redirect to home
        console.log("No character or chat ID provided, redirecting to home");
        navigate('/');
      } catch (error) {
        console.error("Error setting up chat session:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setInitialLoading(false);
        // Reset initialization flag on error so we can try again
        hasInitialized.current = false;
      }
    };

    // Only run setup if we're still in the loading state
    if (initialLoading) {
      setupChat();
    }
  }, [characterId, sessionId, navigate, initialLoading]);

  if (initialLoading) {
    return (
      <div className="chat-container">
        <Sidebar doResetDashboard={() => {}} />
        <div className="chat-main">
          <div className="chat-loading">Setting up your chat session...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-container">
        <Sidebar doResetDashboard={() => {}} />
        <div className="chat-main">
          <div className="chat-error">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="chat-back-button"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!initialChatId || !characterId) {
    return (
      <div className="chat-container">
        <Sidebar doResetDashboard={() => {}} />
        <div className="chat-main">
          <div className="chat-error">Failed to create or load chat session</div>
          <button
            onClick={() => navigate('/')}
            className="chat-back-button"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <Chat
      chatId={initialChatId}
      characterId={characterId}
      initialChatTitle={chatTitle}
      return={() => navigate('/')}
    />
  );
};

type ChatProps = {
  chatId: string;
  characterId: string;
  initialChatTitle: string;
  return: () => void;
};

type ChatState = {
  messages: Message[];
  input: string;
  isLoading: boolean;
  error: string | null;
  characterName: string;
  characterDescription: string;
  characterAvatar: string;
  userName: string;
  chatTitle: string;
  editingMessageIndex: number | null; // Track which message is being edited
  editingContent: string; // Content being edited
};

export class Chat extends Component<ChatProps, ChatState> {
  private messagesEndRef: React.RefObject<HTMLDivElement>;

  constructor(props: ChatProps) {
    super(props);
    this.state = {
      messages: [],
      input: '',
      isLoading: false,
      error: null,
      characterName: 'Character',
      characterDescription: '',
      characterAvatar: '',
      userName: 'User',
      chatTitle: props.initialChatTitle || 'Chat',
      editingMessageIndex: null,
      editingContent: '',
    };
    this.messagesEndRef = React.createRef();
  }

  async componentDidMount() {
    await this.loadChatData();
    await this.loadUserInfo();
    await this.loadCharacterInfo();
    this.scrollToBottom();
  }

  componentDidUpdate(prevProps: ChatProps, prevState: ChatState) {
    // Scroll to bottom when messages change
    if (prevState.messages.length !== this.state.messages.length) {
      this.scrollToBottom();
    }

    // If chat ID changed, reload chat data
    if (prevProps.chatId !== this.props.chatId) {
      this.loadChatData();
    }

    // Update title if initial title changes
    if (prevProps.initialChatTitle !== this.props.initialChatTitle) {
      this.setState({ chatTitle: this.props.initialChatTitle });
    }
  }

  scrollToBottom = () => {
    this.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  loadChatData = async () => {
    try {
      const messages = await ChatService.getChatMessages(this.props.chatId);
      this.setState({ messages });

      // Get chat session to get the title
      const chatSession = await ChatService.getChatSession(this.props.chatId);
      if (chatSession.title && chatSession.title !== this.state.chatTitle) {
        this.setState({ chatTitle: chatSession.title });
      }
    } catch (error) {
      console.error("Error loading chat data:", error);
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to load chat'
      });
    }
  };

  loadUserInfo = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        this.setState({
          userName: currentUser.displayName || 'User'
        });
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  loadCharacterInfo = async () => {
    try {
      const characterData = await CharacterService.getCharacter(this.props.characterId);

      if (characterData) {
        this.setState({
          characterName: characterData.name || 'Character',
          characterDescription: characterData.characterDescription || '',
          characterAvatar: characterData.avatar || ''
        });
      }
    } catch (error) {
      console.error("Error loading character info:", error);
    }
  };

  handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    this.setState({ input: e.target.value });
  };

  handleEditingContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ editingContent: e.target.value });
  };

  handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const { input, isLoading } = this.state;
    const trimmedInput = input.trim();

    if (!trimmedInput || isLoading) {
      return;
    }

    this.setState({ isLoading: true, input: '' });

    try {
      // Send user message
      await ChatService.sendMessage(this.props.chatId, trimmedInput);

      // Reload messages to get the updated chat
      await this.loadChatData();

      // Generate AI response
      await ChatService.generateResponse(this.props.chatId);

      // Reload messages again to get the AI response
      await this.loadChatData();
    } catch (error) {
      console.error("Error in chat:", error);
      this.setState({
        error: error instanceof Error ? error.message : 'Error sending message'
      });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  handleStartEdit = (messageIndex: number, currentContent: string) => {
    this.setState({
      editingMessageIndex: messageIndex,
      editingContent: currentContent
    });
  };

  handleCancelEdit = () => {
    this.setState({
      editingMessageIndex: null,
      editingContent: ''
    });
  };

  handleConfirmEdit = async () => {
    const { editingMessageIndex, editingContent, messages } = this.state;

    if (editingMessageIndex === null || !editingContent.trim()) {
      return;
    }

    this.setState({ isLoading: true });

    try {
      // Rewind the chat history to the edited message point
      await ChatService.rewindToMessage(
        this.props.chatId,
        editingMessageIndex,
        editingContent.trim()
      );

      // Clear editing state
      this.setState({
        editingMessageIndex: null,
        editingContent: ''
      });

      // Reload messages to get the updated chat
      await this.loadChatData();

      // Generate AI response to the modified message
      await ChatService.generateResponse(this.props.chatId);

      // Reload messages again to get the AI response
      await this.loadChatData();
    } catch (error) {
      console.error("Error editing message:", error);
      this.setState({
        error: error instanceof Error ? error.message : 'Error editing message'
      });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  handleTitleChange = (newTitle: string) => {
    this.setState({ chatTitle: newTitle });
  };

  formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  render() {
    const {
      messages,
      input,
      isLoading,
      error,
      characterName,
      characterAvatar,
      userName,
      chatTitle,
      editingMessageIndex,
      editingContent
    } = this.state;

    return (
      <div className="chat-container">
        <Sidebar doResetDashboard={() => {}} />
        <div className="chat-main">
          <div className="chat-header">
            <button
              className="chat-back-button"
              onClick={this.props.return}
              title="Return to home"
            >
              ← Back
            </button>
            <div className="chat-meta">
              <div className="chat-character-info">
                {characterAvatar ? (
                  <img
                    src={characterAvatar}
                    alt={characterName}
                    className="chat-character-avatar"
                  />
                ) : (
                  <div className="chat-character-avatar-placeholder">
                    {characterName.charAt(0)}
                  </div>
                )}
                <h1 className="chat-character-name">{characterName}</h1>
              </div>

              {/* Chat title editor component */}
              <div className="chat-title-wrapper">
                <ChatTitleEditor
                  chatId={this.props.chatId}
                  initialTitle={chatTitle}
                />
              </div>
            </div>
          </div>

          {error && <div className="chat-error">{error}</div>}

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <p>Start a conversation with {characterName}!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
                >
                  <div className="chat-message-header">
                    <span className="chat-message-sender">
                      {message.role === 'user' ? userName : characterName}
                    </span>
                    {message.timestamp && (
                      <span className="chat-message-time">
                        {this.formatTimestamp(message.timestamp)}
                      </span>
                    )}
                    {/* Edit button for user messages */}
                    {message.role === 'user' && editingMessageIndex !== index && (
                      <button
                        className="chat-message-edit-button"
                        onClick={() => this.handleStartEdit(index, message.content)}
                        title="Edit this message"
                        disabled={isLoading}
                      >
                        ✏️
                      </button>
                    )}
                  </div>

                  {/* Show message content or editing interface */}
                  {editingMessageIndex === index ? (
                    <div className="chat-message-editing">
                      <textarea
                        className="chat-message-edit-textarea"
                        value={editingContent}
                        onChange={this.handleEditingContentChange}
                        placeholder="Edit your message..."
                        autoFocus
                        rows={3}
                      />
                      <div className="chat-message-edit-buttons">
                        <button
                          className="chat-message-edit-confirm"
                          onClick={this.handleConfirmEdit}
                          disabled={!editingContent.trim() || isLoading}
                        >
                          Confirm
                        </button>
                        <button
                          className="chat-message-edit-cancel"
                          onClick={this.handleCancelEdit}
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="chat-message-content">
                      {message.content}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={this.messagesEndRef} />

            {isLoading && (
              <div className="chat-typing-indicator">
                <div className="chat-typing-dot"></div>
                <div className="chat-typing-dot"></div>
                <div className="chat-typing-dot"></div>
              </div>
            )}
          </div>

          <form className="chat-input-form" onSubmit={this.handleSubmit}>
            <textarea
              className="chat-input"
              value={input}
              onChange={this.handleInputChange}
              placeholder={`Message ${characterName}...`}
              disabled={isLoading || editingMessageIndex !== null}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  this.handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              className="chat-send-button"
              disabled={isLoading || !input.trim() || editingMessageIndex !== null}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    );
  }
}

export default ChatWrapper;