import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

// These types describe the data our chat application works with.
// Later, the Python backend will return data in a similar structure.
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

const STORAGE_KEY = "arc-chat-conversations";

const suggestions = [
  {
    icon: "⌘",
    title: "Explain something",
    prompt: "Explain how AI agents work in simple terms.",
  },
  {
    icon: "⚡",
    title: "Explore an idea",
    prompt: "What are some interesting use cases for AI agents?",
  },
  {
    icon: "⌨",
    title: "Help me code",
    prompt: "Explain the difference between an API and an MCP server.",
  },
  {
    icon: "✦",
    title: "Learn something",
    prompt: "Give me a learning roadmap for Python and LangGraph.",
  },
];

function createId() {
  return crypto.randomUUID();
}

// Read conversations from the browser.
// This is why your conversations survive a page refresh.
function loadConversations(): Conversation[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as Conversation[] : [];
  } catch {
    return [];
  }
}

// This is TEMPORARY. It simulates an assistant response.
// Later, we will replace this function with a request to FastAPI,
// which will communicate with our real Python agent.
function getMockResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();

  if (message.includes("hello") || message.includes("hi")) {
    return "Hello! Welcome to arc-chat. I'm currently running in mock mode, but we'll connect a real AI agent here later.";
  }

  if (message.includes("agent")) {
    return [
      "An AI agent is a system that can reason about a task and take actions to complete it.",
      "",
      "A simplified agent workflow looks like this:",
      "1. Receive a message from the user.",
      "2. Send the message and context to an LLM.",
      "3. Decide whether a tool is needed.",
      "4. Execute the tool and inspect its result.",
      "5. Return a response to the user.",
      "",
      "We'll build this workflow in Python using LangGraph.",
    ].join("\n");
  }

  if (message.includes("mcp")) {
    return [
      "MCP stands for Model Context Protocol.",
      "",
      "It is a standard way for AI applications to connect to external tools and context.",
      "",
      "For example, an MCP server could expose tools that let an agent:",
      "- Read files",
      "- Query a database",
      "- Access an external API",
      "",
      "We'll build a small MCP server as part of this project.",
    ].join("\n");
  }

  return [
    "This is a simulated assistant response.",
    "",
    "Your message was received successfully, and the frontend is working!",
    "",
    "The next step is to connect this chat interface to a Python FastAPI backend. That backend will eventually call a LangGraph agent instead of this mock function.",
    "",
    `Your message: "${userMessage}"`,
  ].join("\n");
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function formatConversationDate(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function App() {
  // Application state: React keeps track of conversations and the active chat.
  const [conversations, setConversations] =
    useState<Conversation[]>(loadConversations);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeChatId,
  );

  // Save conversations whenever they change.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  // Scroll to the latest message when the conversation changes.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [activeConversation?.messages, loadingChatId]);

  function createNewChat() {
    setActiveChatId(null);
    setInput("");
    textareaRef.current?.focus();
  }

  function selectConversation(id: string) {
    setActiveChatId(id);
    setInput("");
  }

  function deleteConversation(
    event: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ) {
    event.stopPropagation();

    setConversations((current) =>
      current.filter((conversation) => conversation.id !== id),
    );

    if (activeChatId === id) {
      setActiveChatId(null);
    }
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = input.trim();

    if (!content || loadingChatId) {
      return;
    }

    const now = Date.now();
    const chatId = activeChatId ?? createId();

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content,
      createdAt: now,
    };

    // If this is a new conversation, create it.
    if (!activeChatId) {
      const newConversation: Conversation = {
        id: chatId,
        title: content.length > 35
          ? `${content.slice(0, 35)}...`
          : content,
        messages: [userMessage],
        updatedAt: now,
      };

      setConversations((current) => [
        newConversation,
        ...current,
      ]);

      setActiveChatId(chatId);
    } else {
      // Otherwise, append the message to the existing conversation.
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === chatId
            ? {
                ...conversation,
                messages: [...conversation.messages, userMessage],
                updatedAt: now,
              }
            : conversation,
        ),
      );
    }

    setInput("");
    setLoadingChatId(chatId);

    // Simulate an API request.
    // Later this will become fetch("http://localhost:8000/chat", ...).
    window.setTimeout(() => {
      const assistantMessage: Message = {
        id: createId(),
        role: "assistant",
        content: getMockResponse(content),
        createdAt: Date.now(),
      };

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === chatId
            ? {
                ...conversation,
                messages: [...conversation.messages, assistantMessage],
                updatedAt: Date.now(),
              }
            : conversation,
        ),
      );

      setLoadingChatId((current) =>
        current === chatId ? null : current,
      );
    }, 900);
  }

  function handleInputKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <button
            className="brand"
            onClick={createNewChat}
            aria-label="Go to new chat"
          >
            <span className="brand-icon">a</span>
            <span>arc<span className="brand-light">-chat</span></span>
          </button>

          <button
            className="new-chat-button"
            onClick={createNewChat}
          >
            <span>＋</span>
            <span>New chat</span>
            <span className="shortcut">⌘ K</span>
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">YOUR WORKSPACE</div>

          {conversations.length === 0 ? (
            <p className="sidebar-empty">
              Your conversations will appear here.
            </p>
          ) : (
            <div className="conversation-list">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={`conversation-item ${
                    activeChatId === conversation.id ? "active" : ""
                  }`}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <span className="conversation-icon">◷</span>
                  <span className="conversation-title">
                    {conversation.title}
                  </span>

                  <span className="conversation-actions">
                    <span className="conversation-date">
                      {formatConversationDate(conversation.updatedAt)}
                    </span>
                    <span
                      className="delete-chat"
                      role="button"
                      aria-label="Delete conversation"
                      tabIndex={0}
                      onClick={(event) =>
                        deleteConversation(
                          event as unknown as React.MouseEvent<HTMLButtonElement>,
                          conversation.id,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setConversations((current) =>
                            current.filter(
                              (item) => item.id !== conversation.id,
                            ),
                          );
                          if (activeChatId === conversation.id) {
                            setActiveChatId(null);
                          }
                        }
                      }}
                    >
                      ×
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-bottom">
          <div className="project-card">
            <div className="project-card-icon">✦</div>
            <div>
              <div className="project-card-title">Building arc-chat</div>
              <div className="project-card-subtitle">
                Your agentic AI playground
              </div>
            </div>
          </div>

          <div className="profile">
            <div className="avatar">B</div>
            <div className="profile-info">
              <div className="profile-name">Developer</div>
              <div className="profile-plan">Local workspace</div>
            </div>
            <span className="profile-menu">···</span>
          </div>
        </div>
      </aside>

      {/* Main application */}
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-context">Workspace</span>
            <span className="topbar-separator">/</span>
            <span className="topbar-current">
              {activeConversation?.title ?? "New conversation"}
            </span>
          </div>

          <div className="topbar-right">
            <span className="connection-dot" />
            <span className="connection-label">Mock mode</span>
            <span className="topbar-version">v0.1</span>
          </div>
        </header>

        <section className="chat-area">
          {!activeConversation ? (
            <div className="welcome-screen">
              <div className="welcome-icon">
                <span>✳</span>
              </div>

              <div className="welcome-eyebrow">
                YOUR AI DEVELOPMENT PLAYGROUND
              </div>

              <h1>
                Build something
                <br />
                <span>intelligent.</span>
              </h1>

              <p className="welcome-description">
                A place to experiment with AI agents, tools, workflows,
                and everything in between.
              </p>

              <div className="suggestion-grid">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.title}
                    className="suggestion-card"
                    onClick={() => setInput(suggestion.prompt)}
                  >
                    <span className="suggestion-icon">
                      {suggestion.icon}
                    </span>
                    <span className="suggestion-title">
                      {suggestion.title}
                    </span>
                    <span className="suggestion-prompt">
                      {suggestion.prompt}
                    </span>
                    <span className="suggestion-arrow">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-container">
              <div className="messages-inner">
                {activeConversation.messages.map((message) => (
                  <article
                    key={message.id}
                    className={`message message-${message.role}`}
                  >
                    <div className="message-avatar">
                      {message.role === "user" ? "B" : "✳"}
                    </div>

                    <div className="message-body">
                      <div className="message-heading">
                        <span className="message-author">
                          {message.role === "user" ? "You" : "arc-chat"}
                        </span>
                        <span className="message-time">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>

                      <div className="message-content">
                        {message.content}
                      </div>
                    </div>
                  </article>
                ))}

                {loadingChatId === activeConversation.id && (
                  <article className="message message-assistant">
                    <div className="message-avatar">✳</div>
                    <div className="message-body">
                      <div className="message-heading">
                        <span className="message-author">arc-chat</span>
                        <span className="message-time">Thinking</span>
                      </div>
                      <div className="typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </article>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </section>

        <footer className="composer-area">
          <form className="composer" onSubmit={sendMessage}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Message arc-chat..."
              rows={1}
              aria-label="Message"
            />

            <div className="composer-bottom">
              <div className="composer-hint">
                <span className="hint-symbol">↵</span>
                <span>Enter to send</span>
                <span className="hint-divider">·</span>
                <span>Shift + Enter for new line</span>
              </div>

              <button
                className="send-button"
                type="submit"
                disabled={!input.trim() || loadingChatId !== null}
                aria-label="Send message"
              >
                <span>↑</span>
              </button>
            </div>
          </form>

          <div className="disclaimer">
            arc-chat is currently running with simulated responses.
            Connect an AI backend to enable real agent conversations.
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;