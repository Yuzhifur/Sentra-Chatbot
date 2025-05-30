import React, { Component, FormEvent, ChangeEvent, useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getAuth } from 'firebase/auth';
import { ChatService, Message } from '../services/ChatService';
import { CharacterService } from '../services/CharacterService';
import ChatTitleEditor from '../components/ChatTitleEditor';
import ChatSettingsPopup from '../components/ChatSettingsPopup';
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

  // Remove the hasInitialized ref - it's causing issues with chat switching
  const currentSessionId = useRef<string | null>(null);

  const notifySidebarUpdate = () => {
    window.dispatchEvent(new CustomEvent('chatListUpdated'));
  };

  // MAIN useEffect - handles both initial setup AND chat switching
  useEffect(() => {
    const setupOrSwitchChat = async () => {
      try {
        // Case 1: Both characterId and sessionId exist - use existing chat session
        if (characterId && sessionId) {
          console.log(`Loading chat: ${sessionId} with character: ${characterId}`);

          // If this is the same session we're already viewing, don't reload
          if (currentSessionId.current === sessionId && !initialLoading) {
            return;
          }

          // Update current session tracking
          currentSessionId.current = sessionId;

          // Get the chat data to retrieve the title
          const chatData = await ChatService.getChatSession(sessionId);
          if (chatData.title) {
            setChatTitle(chatData.title);
          } else {
            // If no title exists, set a default one based on character name
            setChatTitle(`Chat with ${chatData.characterName}`);
          }

          setInitialChatId(sessionId);
          setError(null); // Clear any previous errors
          setInitialLoading(false);
          return;
        }

        // Case 2: Only characterId exists - create a new chat session
        if (characterId && !sessionId) {
          console.log(`Creating new chat with character: ${characterId}`);

          // Only create new chat if we don't already have one loaded
          if (!initialLoading && currentSessionId.current) {
            return;
          }

          const newChatId = await ChatService.createChatSession(characterId);

          // Get character name to set a default title
          const characterData = await CharacterService.getCharacter(characterId);
          setChatTitle(`Chat with ${characterData.name}`);

          // Update tracking
          currentSessionId.current = newChatId;

          // Set local state first
          setInitialChatId(newChatId);
          setInitialLoading(false);
          setError(null);

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
      }
    };

    setupOrSwitchChat();
  }, [characterId, sessionId, navigate]); // Remove initialLoading from dependencies

  // Separate useEffect to handle URL parameter changes for chat switching
  useEffect(() => {
    // Reset loading state when switching to a different chat
    if (sessionId !== currentSessionId.current) {
      console.log(`Switching from ${currentSessionId.current} to ${sessionId}`);
      // Don't set initialLoading to true here - let the main useEffect handle it
    }
  }, [sessionId]);

  // Rest of the component remains the same...
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
  editingMessageIndex: number | null;
  editingContent: string;
  showSettingsPopup: boolean;
  currentTokenLimit: number;
  streamingMessage: string | null; // NEW: For streaming content
  isStreaming: boolean; // NEW: Streaming state
};

export class Chat extends Component<ChatProps, ChatState> {
  private messagesEndRef: React.RefObject<HTMLDivElement>;
  private streamingAbortController: AbortController | null = null; // NEW: For aborting streams

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
      showSettingsPopup: false,
      currentTokenLimit: 1024,
      streamingMessage: null, // NEW
      isStreaming: false, // NEW
    };
    this.messagesEndRef = React.createRef();
  }

  async componentDidMount() {
    await this.loadChatData();
    await this.loadUserInfo();
    await this.loadCharacterInfo();
    this.loadTokenLimit(); // New: Load token limit from localStorage
    this.scrollToBottom();

    // New: Add event listener for token limit changes
    window.addEventListener('tokenLimitChanged', this.handleTokenLimitChange);
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

  componentWillUnmount() {
    // Clean up streaming if active
    if (this.streamingAbortController) {
      this.streamingAbortController.abort();
    }

    window.removeEventListener('tokenLimitChanged', this.handleTokenLimitChange);
  }

  scrollToBottom = () => {
    this.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // New: Load token limit from localStorage
  loadTokenLimit = () => {
    const savedTokenLimit = localStorage.getItem('chatTokenLimit');
    if (savedTokenLimit) {
      const limit = parseInt(savedTokenLimit);
      if ([256, 512, 1024].includes(limit)) {
        this.setState({ currentTokenLimit: limit });
      }
    }
  };

  // New: Handle token limit changes from settings popup
  handleTokenLimitChange = (event: any) => {
    const newTokenLimit = event.detail.tokenLimit;
    this.setState({ currentTokenLimit: newTokenLimit });
  };

  // New: Handle settings button click
  handleSettingsClick = () => {
    this.setState({ showSettingsPopup: true });
  };

  // New: Handle closing settings popup
  handleCloseSettings = () => {
    this.setState({ showSettingsPopup: false });
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

    const { input, isLoading, currentTokenLimit, isStreaming } = this.state;
    const trimmedInput = input.trim();

    if (!trimmedInput || isLoading || isStreaming) {
      return;
    }

    this.setState({ isLoading: true, input: '', streamingMessage: null });

    try {
      // Send user message
      await ChatService.sendMessage(this.props.chatId, trimmedInput);

      // Reload messages to get the updated chat
      await this.loadChatData();

      // Start streaming response
      this.setState({ isStreaming: true, streamingMessage: '' });

      await ChatService.generateResponseStream(
        this.props.chatId,
        currentTokenLimit,
        {
          onStart: () => {
            console.log('Streaming started');
          },
          onDelta: (delta: string) => {
            this.setState(prevState => ({
              streamingMessage: (prevState.streamingMessage || '') + delta
            }));
            this.scrollToBottom();
          },
          onComplete: async (fullContent: string) => {
            console.log('Streaming completed');
            this.setState({
              isStreaming: false,
              streamingMessage: null
            });

            // Reload messages to show the saved AI response
            await this.loadChatData();
          },
          onError: (error: Error) => {
            console.error('Streaming error:', error);
            this.setState({
              error: error.message,
              isStreaming: false,
              streamingMessage: null
            });
          }
        }
      );

    } catch (error) {
      console.error("Error in chat:", error);
      this.setState({
        error: error instanceof Error ? error.message : 'Error sending message',
        isStreaming: false,
        streamingMessage: null
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
    const { editingMessageIndex, editingContent, currentTokenLimit } = this.state;

    if (editingMessageIndex === null || !editingContent.trim()) {
      return;
    }

    this.setState({ isLoading: true, streamingMessage: null });

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

      // Start streaming response for the edited message
      this.setState({ isStreaming: true, streamingMessage: '' });

      await ChatService.generateResponseStream(
        this.props.chatId,
        currentTokenLimit,
        {
          onDelta: (delta: string) => {
            this.setState(prevState => ({
              streamingMessage: (prevState.streamingMessage || '') + delta
            }));
            this.scrollToBottom();
          },
          onComplete: async () => {
            this.setState({
              isStreaming: false,
              streamingMessage: null
            });
            await this.loadChatData();
          },
          onError: (error: Error) => {
            this.setState({
              error: error.message,
              isStreaming: false,
              streamingMessage: null
            });
          }
        }
      );

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
      editingContent,
      showSettingsPopup,
      currentTokenLimit,
      streamingMessage,
      isStreaming
    } = this.state;

    return (
      <div className="chat-container">
        <Sidebar doResetDashboard={() => {}} />
        <div className="chat-main">
          {/* ... (keep header unchanged) */}
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

              <div className="chat-title-wrapper">
                <ChatTitleEditor
                  chatId={this.props.chatId}
                  initialTitle={chatTitle}
                />
              </div>
            </div>

            <button
              className="chat-settings-button"
              onClick={this.handleSettingsClick}
              title={`Chat Settings (Current: ${currentTokenLimit} tokens)`}
            >
              ⚙️
            </button>
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
                    {message.role === 'user' && editingMessageIndex !== index && !isStreaming && (
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
                    <div className="chat-message-content" style={{ whiteSpace: 'pre-line' }}>
                      {message.content}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Show streaming message */}
            {isStreaming && streamingMessage !== null && (
              <div className="chat-message chat-message-assistant">
                <div className="chat-message-header">
                  <span className="chat-message-sender">{characterName}</span>
                  <span className="chat-message-time">
                    <span className="streaming-indicator">● Streaming...</span>
                  </span>
                </div>
                <div className="chat-message-content" style={{ whiteSpace: 'pre-line' }}>
                  {streamingMessage}
                  <span className="typing-cursor">▊</span>
                </div>
              </div>
            )}

            <div ref={this.messagesEndRef} />

            {/* Show typing indicator only when loading but not streaming */}
            {isLoading && !isStreaming && (
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
              disabled={isLoading || editingMessageIndex !== null || isStreaming}
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
              disabled={isLoading || !input.trim() || editingMessageIndex !== null || isStreaming}
            >
              Send
            </button>
          </form>
        </div>

        {showSettingsPopup && (
          <ChatSettingsPopup onClose={this.handleCloseSettings} />
        )}
      </div>
    );
  }
}

export default ChatWrapper;