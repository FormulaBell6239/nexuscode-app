
"use client";

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import "./NexusAI.css";

type Mode = "chat" | "learn" | "debug" | "review";

type AttachedImage = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  size: number;
};

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  images?: AttachedImage[];
};

type ApiImage = {
  name: string;
  mimeType: string;
  data: string;
};

const modes: {
  id: Mode;
  label: string;
  description: string;
  icon: string;
}[] = [
  { id: "chat", label: "AI Chat", description: "Ask anything about coding", icon: "✳︎" },
  { id: "learn", label: "Learn Code", description: "Understand concepts step by step", icon: "⌘" },
  { id: "debug", label: "Debug Code", description: "Find and fix errors", icon: "⌁" },
  { id: "review", label: "Code Review", description: "Improve your code quality", icon: "⌕" },
];

const suggestions = [
  {
    icon: "⌘",
    title: "Build a React component",
    description: "Create reusable UI components",
    prompt: "Help me build a reusable React component in TypeScript.",
  },
  {
    icon: "⌁",
    title: "Debug my code",
    description: "Track down an error",
    prompt: "Help me debug my code. Explain how to identify the root cause.",
  },
  {
    icon: "✳︎",
    title: "Learn a new concept",
    description: "Make difficult topics simple",
    prompt: "Teach me an important programming concept with an example.",
  },
  {
    icon: "⟨/⟩",
    title: "Improve my project",
    description: "Make NexusCode even better",
    prompt: "Suggest a useful new feature I can build into NexusCode.",
  },
];

const welcomeMessages: Record<Mode, string> = {
  chat: "What are we building today?",
  learn: "What do you want to learn?",
  debug: "Let's hunt down that bug.",
  review: "Let's make your code better.",
};

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "json", "csv", "log", "html", "css", "js", "jsx", "ts",
  "tsx", "py", "java", "c", "cpp", "cs", "go", "rs", "rb", "php", "sql",
  "sh", "yml", "yaml", "xml", "toml", "env",
]);

const ACCEPT_ATTRIBUTE = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  ...Array.from(TEXT_EXTENSIONS).map((ext) => `.${ext}`),
].join(",");

/* Returns the MIME type the AI accepts for a file, or null if unsupported. */
function resolveMimeType(file: File): string | null {
  if (ACCEPTED_IMAGE_TYPES.has(file.type)) return file.type;
  if (file.type === "application/pdf") return file.type;

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (file.type.startsWith("text/") || TEXT_EXTENSIONS.has(extension)) {
    return "text/plain";
  }

  return null;
}

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error(`Could not read ${file.name}.`));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Could not read ${file.name}.`));
    };

    reader.readAsDataURL(file);
  });
}

/* Smoothly reveals the completed AI response with a glowing cursor. */
function TypewriterText({ content }: { content: string }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);

    if (!content) return;

    const interval = window.setInterval(() => {
      setVisibleCount((current) => {
        const next = Math.min(current + 2, content.length);

        if (next >= content.length) {
          window.clearInterval(interval);
        }

        return next;
      });
    }, 13);

    return () => window.clearInterval(interval);
  }, [content]);

  const isTyping = visibleCount < content.length;

  return (
    <p className="nexus-ai__typed-text">
      {content.slice(0, visibleCount)}

      {isTyping && (
        <span
          className="nexus-ai__typing-cursor"
          aria-hidden="true"
        />
      )}
    </p>
  );
}

/* Kept outside the welcome/chat conditional so the orb remains mounted. */
function OrbVisual() {
  return (
    <div
      className="nexus-ai__orb-wrap"
      aria-label="Nexus AI visualizer"
    >
      <div className="nexus-ai__orb-ring nexus-ai__orb-ring--outer" />
      <div className="nexus-ai__orb-ring nexus-ai__orb-ring--inner" />

      <div className="nexus-ai__orb">
        <span>✳︎</span>
      </div>

      <span className="nexus-ai__orb-particle nexus-ai__orb-particle--one" />
      <span className="nexus-ai__orb-particle nexus-ai__orb-particle--two" />
      <span className="nexus-ai__orb-particle nexus-ai__orb-particle--three" />
    </div>
  );
}

export default function NexusAI() {
  const [activeMode, setActiveMode] = useState<Mode>("chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [attachments, setAttachments] = useState<AttachedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [signedIn, setSignedIn] = useState(true);

  useEffect(() => {
    setSignedIn(Boolean(localStorage.getItem("token")));
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMode =
    modes.find((mode) => mode.id === activeMode) ?? modes[0];

  async function addImageFiles(fileList: FileList | File[]) {
    if (isLoading) {
      setAttachmentError(
        "Wait for the current response to finish before attaching another image.",
      );
      return;
    }

    const files = Array.from(fileList);

    if (files.length === 0) return;

    setAttachmentError("");

    const validImages: AttachedImage[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const mimeType = resolveMimeType(file);

      if (!mimeType) {
        errors.push(
          `${file.name}: use an image, PDF, or text/code file.`,
        );
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        errors.push(
          `${file.name}: files must be 4 MB or smaller.`,
        );
        continue;
      }

      try {
        const dataUrl = await fileToDataUrl(file);

        validImages.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`,
          name: file.name,
          mimeType,
          dataUrl,
          size: file.size,
        });
      } catch {
        errors.push(`${file.name}: the file could not be read.`);
      }
    }

    const availableSlots = Math.max(
      0,
      MAX_IMAGES - attachments.length,
    );

    const acceptedImages = validImages.slice(0, availableSlots);

    if (validImages.length > availableSlots) {
      errors.push(
        `You can attach up to ${MAX_IMAGES} images per message.`,
      );
    }

    if (acceptedImages.length > 0) {
      setAttachments((current) =>
        [...current, ...acceptedImages].slice(0, MAX_IMAGES),
      );
    }

    setAttachmentError(errors.join(" "));
  }

  function removeAttachment(id: string) {
    setAttachments((current) =>
      current.filter((image) => image.id !== id),
    );

    setAttachmentError("");
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;

    if (
      !(nextTarget instanceof Node) ||
      !event.currentTarget.contains(nextTarget)
    ) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(event.dataTransfer.files);

    if (droppedFiles.length > 0) {
      void addImageFiles(droppedFiles);
    }
  }

  async function sendMessage(
    event?: FormEvent<HTMLFormElement>,
    suggestedPrompt?: string,
  ) {
    event?.preventDefault();

    const content = (suggestedPrompt ?? input).trim();
    const imagesToSend = attachments;

    if (
      (!content && imagesToSend.length === 0) ||
      isLoading
    ) {
      return;
    }

    if (!localStorage.getItem("token")) {
      setSignedIn(false);
      return;
    }

    const displayContent =
      content || "Please analyze the attached file(s).";

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: displayContent,
      images: imagesToSend,
    };

    // Keep the existing text history compatible with your current API.
    // Image data is sent separately for the current request.
    const history = messages.slice(-20).map(({ role, content }) => ({
      role,
      content,
    }));

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setAttachments([]);
    setAttachmentError("");
    setChatStarted(true);
    setIsLoading(true);

    const apiImages: ApiImage[] = imagesToSend.map((image) => ({
      name: image.name,
      mimeType: image.mimeType,
      // Send the base64 portion without the data URL prefix.
      data: image.dataUrl.substring(
        image.dataUrl.indexOf(",") + 1,
      ),
    }));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("token")
              ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
              : {}),
          },
          body: JSON.stringify({
            message: displayContent,
            mode: activeMode,
            history,
            images: apiImages,
          }),
        },
      );

      if (!response.ok) {
        let detail =
          response.status === 401
            ? "Your session has expired or you are logged out. Please log in again to use Nexus AI."
            : "The AI service returned an error.";

        try {
          const errorData = (await response.json()) as {
            message?: string;
          };

          if (typeof errorData.message === "string") {
            detail = errorData.message;
          }
        } catch {
          // Keep the generic error when the server returns no JSON.
        }

        throw new Error(detail);
      }

      const data = (await response.json()) as {
        reply?: unknown;
      };

      if (
        typeof data.reply !== "string" ||
        !data.reply.trim()
      ) {
        throw new Error("The AI returned an empty response.");
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.reply,
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("Nexus AI request failed:", error);

      if (
        error instanceof Error &&
        error.message.includes("log in")
      ) {
        setSignedIn(false);
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error";

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            `I couldn't complete that request. ${errorMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleComposerKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function startNewChat() {
    setMessages([]);
    setInput("");
    setAttachments([]);
    setAttachmentError("");
    setChatStarted(false);
    setActiveMode("chat");
  }

  return (
    <main className="nexus-ai">
      <section className="nexus-ai__main">
        <header className="nexus-ai__topbar">
          <div className="nexus-ai__breadcrumb">
            <span>Workspace</span>
            <span className="nexus-ai__breadcrumb-divider">
              /
            </span>
            <span className="nexus-ai__breadcrumb-current">
              Nexus AI
            </span>
          </div>

          <div className="nexus-ai__topbar-right">
            <span className="nexus-ai__status">
              <span className="nexus-ai__status-dot" />
              AI workspace
            </span>

            <div className="nexus-ai__topbar-divider" />

            <span className="nexus-ai__version">BETA</span>

            {chatStarted && (
              <button
                type="button"
                className="nexus-ai__new-chat"
                onClick={startNewChat}
              >
                + New chat
              </button>
            )}
          </div>
        </header>

        <div className="nexus-ai__content">
          <nav
            className="nexus-ai__modes"
            aria-label="Choose AI workspace mode"
          >
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`nexus-ai__mode ${
                  activeMode === mode.id ? "is-active" : ""
                }`}
                onClick={() => setActiveMode(mode.id)}
                aria-pressed={activeMode === mode.id}
              >
                <span className="nexus-ai__mode-icon">
                  {mode.icon}
                </span>

                <span className="nexus-ai__mode-copy">
                  <span className="nexus-ai__mode-title">
                    {mode.label}
                  </span>

                  <span className="nexus-ai__mode-description">
                    {mode.description}
                  </span>
                </span>

                {activeMode === mode.id && (
                  <span className="nexus-ai__active-dot" />
                )}
              </button>
            ))}
          </nav>

          {/* The orb stays mounted when the welcome screen changes to chat. */}
          <div
            className={`nexus-ai__persistent-orb ${
              chatStarted ? "is-chatting" : "is-welcome"
            }`}
          >
            <OrbVisual />
          </div>

          {!chatStarted ? (
            <div className="nexus-ai__welcome">
              <div className="nexus-ai__eyebrow">
                <span />
                YOUR INTELLIGENT CODING COMPANION
              </div>

              <h1>
                Think bigger.
                <br />
                <span>Build beyond.</span>
              </h1>

              <p className="nexus-ai__welcome-description">
                {welcomeMessages[activeMode]} Explore ideas, solve
                problems, and turn your next big idea into working code.
              </p>

              <div className="nexus-ai__suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.title}
                    type="button"
                    className="nexus-ai__suggestion"
                    onClick={() =>
                      void sendMessage(
                        undefined,
                        suggestion.prompt,
                      )
                    }
                  >
                    <span className="nexus-ai__suggestion-icon">
                      {suggestion.icon}
                    </span>

                    <span className="nexus-ai__suggestion-copy">
                      <span className="nexus-ai__suggestion-title">
                        {suggestion.title}
                      </span>

                      <span className="nexus-ai__suggestion-description">
                        {suggestion.description}
                      </span>
                    </span>

                    <span className="nexus-ai__suggestion-arrow">
                      ↗
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="nexus-ai__conversation">
              <div className="nexus-ai__conversation-heading">
                <span className="nexus-ai__conversation-icon">
                  ✳︎
                </span>

                <div>
                  <h2>{currentMode.label}</h2>
                  <p>Your Nexus AI conversation</p>
                </div>
              </div>

              <div
                className="nexus-ai__messages"
                aria-live="polite"
              >
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`nexus-ai__message nexus-ai__message--${message.role}`}
                  >
                    <div className="nexus-ai__message-avatar">
                      {message.role === "user" ? "YOU" : "✳︎"}
                    </div>

                    <div className="nexus-ai__message-body">
                      <span className="nexus-ai__message-author">
                        {message.role === "user"
                          ? "You"
                          : "Nexus AI"}
                      </span>

                      {message.role === "assistant" ? (
                        <TypewriterText
                          content={message.content}
                        />
                      ) : (
                        <p>{message.content}</p>
                      )}

                      {message.role === "user" &&
                        message.images &&
                        message.images.length > 0 && (
                          <div className="nexus-ai__message-images">
                            {message.images.map((image) => (
                              image.mimeType.startsWith("image/") ? (
                                <img
                                  key={image.id}
                                  src={image.dataUrl}
                                  alt={image.name}
                                />
                              ) : (
                                <span key={image.id}>
                                  📎 {image.name}
                                </span>
                              )
                            ))}
                          </div>
                        )}
                    </div>
                  </article>
                ))}

                {isLoading && (
                  <div
                    className="nexus-ai__placeholder-response"
                    role="status"
                  >
                    <span className="nexus-ai__placeholder-icon nexus-ai__thinking-orb">
                      ✳︎
                    </span>

                    <div className="nexus-ai__thinking-copy">
                      <strong>
                        Nexus AI is thinking
                        <span className="nexus-ai__thinking-dots">
                          <i>.</i>
                          <i>.</i>
                          <i>.</i>
                        </span>
                      </strong>

                      <p>Working through your message.</p>

                      <div className="nexus-ai__thinking-track">
                        <span />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            className={`nexus-ai__composer-area ${
              isDragging ? "is-dragging" : ""
            }`}
            onDragOver={handleDragOver}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div
                className="nexus-ai__drop-overlay"
                aria-hidden="true"
              >
                <span className="nexus-ai__drop-overlay-icon">
                  ＋
                </span>

                <strong>Drop images into Nexus AI</strong>

                <span>
                  Images, PDFs, or text/code files · up to 5 files
                </span>
              </div>
            )}

            {!signedIn && (
              <p className="nexus-ai__auth-notice" role="alert">
                You need to be signed in to use Nexus AI, including
                image and file attachments.{" "}
                <a href="/auth">Log in or create an account</a>
              </p>
            )}

            <form
              className="nexus-ai__composer"
              onSubmit={(event) => void sendMessage(event)}
            >
              <input
                ref={fileInputRef}
                className="nexus-ai__file-input"
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                multiple
                onChange={(event) => {
                  if (event.currentTarget.files) {
                    void addImageFiles(
                      event.currentTarget.files,
                    );
                  }

                  // Allows choosing the same file again later.
                  event.currentTarget.value = "";
                }}
                aria-label="Attach images"
              />

              <div className="nexus-ai__composer-tools">
                <span className="nexus-ai__composer-mode">
                  <span>✳︎</span> {currentMode.label}
                </span>

                <span className="nexus-ai__composer-hint">
                  Type a message or drop an image
                </span>
              </div>

              {attachments.length > 0 && (
                <div
                  className="nexus-ai__attachment-list"
                  aria-label="Images attached to your message"
                >
                  {attachments.map((image) => (
                    <div
                      className="nexus-ai__attachment"
                      key={image.id}
                    >
                      {image.mimeType.startsWith("image/") ? (
                        <img
                          src={image.dataUrl}
                          alt={`Preview of ${image.name}`}
                        />
                      ) : (
                        <span aria-hidden="true">📎</span>
                      )}

                      <span title={image.name}>
                        {image.name}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeAttachment(image.id)
                        }
                        aria-label={`Remove ${image.name}`}
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {attachmentError && (
                <p
                  className="nexus-ai__attachment-error"
                  role="alert"
                >
                  {attachmentError}
                </p>
              )}

              <textarea
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleComposerKeyDown}
                placeholder="Ask Nexus AI anything about code..."
                rows={3}
                aria-label="Message Nexus AI"
                disabled={isLoading}
              />

              <div className="nexus-ai__composer-footer">
                <div className="nexus-ai__composer-actions">
                  <button
                    type="button"
                    className="nexus-ai__attach-button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={
                      isLoading ||
                      attachments.length >= MAX_IMAGES
                    }
                  >
                    <span aria-hidden="true">＋</span>
                    Attach images
                  </button>

                  <span className="nexus-ai__composer-note">
                    <span>↵</span> to send · Shift + ↵ for a new line
                  </span>
                </div>

                <button
                  className="nexus-ai__send"
                  type="submit"
                  disabled={
                    isLoading ||
                    (!input.trim() && attachments.length === 0)
                  }
                  aria-label="Send message"
                >
                  <span>↑</span>
                </button>
              </div>
            </form>

            <p className="nexus-ai__disclaimer">
              Nexus AI can make mistakes. Review generated code
              before using it.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
