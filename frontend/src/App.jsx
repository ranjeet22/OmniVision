import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowRight,
  Brain,
  CircleHelp,
  FileAudio,
  FileText,
  Globe,
  Link as LinkIcon,
  LoaderCircle,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  WandSparkles
} from "lucide-react";

const processingSteps = [
  { id: "audio", label: "Extracting audio", icon: FileAudio },
  { id: "transcript", label: "Transcribing content", icon: FileText },
  { id: "knowledge", label: "Building knowledge base", icon: Brain },
  { id: "insights", label: "Generating insights", icon: Sparkles }
];

const featureCards = [
  { label: "AI transcription", tone: "violet" },
  { label: "Instant summary", tone: "sky" },
  { label: "RAG answers", tone: "mint" }
];

const initialResult = null;

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [language, setLanguage] = useState("english");
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [result, setResult] = useState(initialResult);
  const [error, setError] = useState("");
  const [showTranscript, setShowTranscript] = useState(true);
  const [showSummary, setShowSummary] = useState(true);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    if (!processing) {
      setProcessingIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setProcessingIndex((current) => {
        if (current >= processingSteps.length - 1) {
          return current;
        }
        return current + 1;
      });
    }, 1800);

    return () => window.clearInterval(interval);
  }, [processing]);

  const canAnalyze = useMemo(() => {
    return Boolean(selectedFile || youtubeUrl.trim());
  }, [selectedFile, youtubeUrl]);

  const title = result?.title || "Transform videos into searchable knowledge";

  async function handleAnalyze(event) {
    event.preventDefault();
    if (!canAnalyze) {
      setError("Choose a video file or paste a YouTube link.");
      return;
    }

    setProcessing(true);
    setError("");
    setChatHistory([]);
    setResult(null);

    const formData = new FormData();
    formData.append("language", language);

    if (selectedFile) {
      formData.append("sourceType", "upload");
      formData.append("file", selectedFile);
    } else {
      formData.append("sourceType", "youtube");
      formData.append("youtubeUrl", youtubeUrl.trim());
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Analysis failed.");
      }

      setResult(payload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleAsk(event) {
    event.preventDefault();
    if (!question.trim() || !result?.sessionId) {
      return;
    }

    const currentQuestion = question.trim();
    setQuestion("");
    setChatLoading(true);
    setChatHistory((current) => [...current, { role: "user", content: currentQuestion }]);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: result.sessionId,
          question: currentQuestion
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Could not answer the question.");
      }

      setChatHistory((current) => [...current, { role: "assistant", content: payload.answer }]);
    } catch (requestError) {
      setChatHistory((current) => [
        ...current,
        { role: "assistant", content: requestError.message || "Something went wrong." }
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      setYoutubeUrl("");
    }
  }

  function removeFile() {
    setSelectedFile(null);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(159,161,255,0.35),_transparent_34%),linear-gradient(180deg,#fcfdff_0%,#f7fbff_45%,#f4fff8_100%)] text-slate-800">
      <div className="absolute inset-0 pointer-events-none">
        <div className="hero-orbit hero-orbit-left" />
        <div className="hero-orbit hero-orbit-right" />
        <div className="hero-grid" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-[36px] border border-white/70 bg-white/72 p-6 shadow-[0_25px_80px_rgba(159,161,255,0.18)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-[#B5BAFF]/70 bg-white/80 px-4 py-2 text-sm font-semibold text-[#5f67d7] shadow-sm">
              <Sparkles className="h-4 w-4" />
              OmniVision intelligence canvas
            </div>

            <h1 className="font-display text-5xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-6xl">
              OmniVision
            </h1>
            <p className="mt-3 text-xl font-medium text-slate-600">See Beyond the Video</p>
            <p className="mx-auto mt-5 max-w-3xl text-balance text-base leading-8 text-slate-600 sm:text-lg">
              OmniVision transforms videos into searchable knowledge with AI-powered
              transcription, summarization, and conversational insights, helping you find
              answers without rewatching hours of content.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {featureCards.map((card) => (
                <span key={card.label} className={`feature-pill feature-pill-${card.tone}`}>
                  {card.label}
                </span>
              ))}
            </div>
          </div>

          <form className="mt-10" onSubmit={handleAnalyze}>
            <div className="rounded-[32px] border border-white/80 bg-white/85 p-5 shadow-[0_18px_50px_rgba(174,226,255,0.18)] backdrop-blur md:p-7">
              <div className="grid gap-4 xl:grid-cols-[1.2fr_auto_1.2fr_0.9fr_0.8fr] xl:items-center">
                <label className="upload-panel cursor-pointer">
                  <input type="file" accept="video/*,audio/*" className="hidden" onChange={handleFileChange} />
                  <div className="upload-panel-inner">
                    <div className="upload-icon-shell">
                      <Upload className="h-7 w-7 text-[#6e79f8]" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-slate-800">
                        {selectedFile ? selectedFile.name : "Upload video"}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        Drag, drop, or click to add a local file
                      </div>
                    </div>
                  </div>
                </label>

                <div className="mx-auto hidden h-12 w-12 items-center justify-center rounded-full border border-white/90 bg-[#f6f7ff] text-sm font-semibold text-slate-500 shadow-sm xl:flex">
                  OR
                </div>

                <div className="field-shell">
                  <LinkIcon className="h-5 w-5 text-[#6e79f8]" />
                  <input
                    value={youtubeUrl}
                    onChange={(event) => {
                      setYoutubeUrl(event.target.value);
                      if (event.target.value.trim()) {
                        setSelectedFile(null);
                      }
                    }}
                    placeholder="Paste YouTube link here..."
                    className="field-input"
                  />
                </div>

                <div className="field-shell">
                  <Globe className="h-5 w-5 text-[#6e79f8]" />
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="field-input appearance-none bg-transparent pr-8"
                  >
                    <option value="english">English transcript</option>
                    <option value="hinglish">Hindi to English</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!canAnalyze || processing}
                  className="analyze-button disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {processing ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <WandSparkles className="h-5 w-5" />}
                  Analyze
                </button>
              </div>

              {(selectedFile || youtubeUrl) && (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  {selectedFile && (
                    <button type="button" onClick={removeFile} className="soft-chip">
                      Local file selected
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                  {youtubeUrl && <span className="soft-chip">YouTube mode enabled</span>}
                </div>
              )}
            </div>
          </form>
        </section>

        {error && (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50/90 px-5 py-4 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        {processing && (
          <section className="mb-8 grid gap-6 rounded-[32px] border border-white/80 bg-white/80 p-6 shadow-[0_20px_60px_rgba(159,161,255,0.16)] backdrop-blur lg:grid-cols-[320px_1fr]">
            <div className="loader-card">
              <div className="eye-loader">
                <div className="eye-core" />
                <div className="eye-ring eye-ring-one" />
                <div className="eye-ring eye-ring-two" />
                <div className="eye-glow eye-glow-left" />
                <div className="eye-glow eye-glow-right" />
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-slate-900">
                  Processing your video...
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Whisper or Saaras is turning the source into structured knowledge. This may
                  take a few minutes for longer videos.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#B5BAFF]/45 bg-[linear-gradient(135deg,rgba(159,161,255,0.08),rgba(174,226,255,0.12),rgba(217,249,223,0.18))] p-6">
              <div className="grid gap-4 md:grid-cols-4">
                {processingSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isDone = index < processingIndex;
                  const isActive = index === processingIndex;

                  return (
                    <div key={step.id} className="process-step">
                      <div className={`process-icon ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                        <StepIcon className="h-5 w-5" />
                      </div>
                      <div className="h-1 w-full rounded-full bg-white/80">
                        <div
                          className={`process-bar ${isDone || isActive ? "filled" : ""}`}
                          style={{ width: isDone ? "100%" : isActive ? "68%" : "0%" }}
                        />
                      </div>
                      <p className="text-center text-sm font-medium text-slate-700">{step.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {!result && !processing && (
          <section className="mb-8 rounded-[32px] border border-white/80 bg-white/75 p-8 shadow-[0_22px_50px_rgba(181,186,255,0.12)] backdrop-blur">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6e79f8]">
                  Ready when you are
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-slate-900">
                  Drop in a source and let OmniVision map the meaning.
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="mini-stat">
                  <span>Whisper small</span>
                  <strong>English videos</strong>
                </div>
                <div className="mini-stat">
                  <span>Saaras v2.5</span>
                  <strong>Hindi to English</strong>
                </div>
                <div className="mini-stat">
                  <span>Chroma RAG</span>
                  <strong>Ask follow-up questions</strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {result && (
          <>
            <section className="mb-8 rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[0_25px_65px_rgba(159,161,255,0.14)] backdrop-blur">
              <div className="mb-5 flex flex-col gap-5 border-b border-slate-200/70 pb-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eef0ff] px-4 py-2 text-sm font-semibold text-[#6e79f8]">
                    <FileText className="h-4 w-4" />
                    Analysis ready
                  </div>
                  <h2 className="font-display text-3xl font-semibold text-slate-900">{title}</h2>
                </div>

                <div className="flex flex-wrap gap-3">
                  <ToggleCard label="Full transcript" enabled={showTranscript} onChange={setShowTranscript} />
                  <ToggleCard label="Summary" enabled={showSummary} onChange={setShowSummary} />
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
                <div className="space-y-5">
                  {showTranscript && (
                    <div className="content-card">
                      <div className="section-label">
                        <FileText className="h-4 w-4" />
                        Full transcript
                      </div>
                      <div className="transcript-box">{result.transcript}</div>
                    </div>
                  )}

                  {showSummary && (
                    <div className="content-card">
                      <div className="section-label">
                        <Sparkles className="h-4 w-4" />
                        Summary
                      </div>
                      <MarkdownBlock text={result.summary} />
                    </div>
                  )}
                </div>

                <div className="grid gap-4">
                  <InsightCard
                    icon={MessageSquareText}
                    title="Action items"
                    tone="mint"
                    content={result.actionItems}
                  />
                  <InsightCard
                    icon={ShieldCheck}
                    title="Key decisions"
                    tone="sky"
                    content={result.keyDecisions}
                  />
                  <InsightCard
                    icon={CircleHelp}
                    title="Open questions"
                    tone="violet"
                    content={result.openQuestions}
                  />
                </div>
              </div>
            </section>

            <section className="mb-8 rounded-[32px] border border-[#D9F9DF] bg-[linear-gradient(135deg,rgba(217,249,223,0.42),rgba(255,255,255,0.86),rgba(174,226,255,0.22))] p-6 shadow-[0_24px_55px_rgba(174,226,255,0.15)]">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="section-label text-emerald-700">
                    <Sparkles className="h-4 w-4" />
                    Ask anything about your video
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Your transcript is indexed in Chroma and ready for follow-up questions.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/75 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <Brain className="h-4 w-4" />
                  RAG Assistant
                </div>
              </div>

              <div className="chat-shell">
                {chatHistory.length === 0 && !chatLoading && (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-5 py-6 text-sm text-slate-500">
                    Ask for decisions, risks, deadlines, summaries, or anything grounded in the
                    transcript.
                  </div>
                )}

                <div className="space-y-4">
                  {chatHistory.map((entry, index) => (
                    <div
                      key={`${entry.role}-${index}`}
                      className={`chat-row ${entry.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`chat-bubble ${entry.role === "user" ? "chat-user" : "chat-assistant"}`}>
                        {entry.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="chat-row justify-start">
                      <div className="chat-bubble chat-assistant inline-flex items-center gap-2">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Thinking through the transcript...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <form className="mt-5 flex gap-3" onSubmit={handleAsk}>
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Type your question here..."
                  className="field-input flex-1 rounded-[22px] border border-white/80 bg-white/90 px-5 py-4 shadow-sm outline-none transition focus:border-[#9FA1FF]"
                />
                <button
                  type="submit"
                  disabled={!question.trim() || chatLoading}
                  className="send-button disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function ToggleCard({ label, enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
    >
      {label}
      <span className={`toggle-pill ${enabled ? "toggle-on" : "toggle-off"}`}>
        <span className="toggle-knob" />
      </span>
    </button>
  );
}

function InsightCard({ icon: Icon, title, content, tone }) {
  return (
    <div className={`insight-card insight-${tone}`}>
      <div className="mb-3 flex items-center gap-3">
        <div className="insight-icon">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>

      <MarkdownBlock text={content} compact />
    </div>
  );
}

function MarkdownBlock({ text, compact = false }) {
  return (
    <div className={`markdown-block ${compact ? "markdown-compact" : ""}`}>
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="markdown-h1" {...props} />,
          h2: ({ node, ...props }) => <h2 className="markdown-h2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="markdown-h3" {...props} />,
          h4: ({ node, ...props }) => <h4 className="markdown-h4" {...props} />,
          p: ({ node, ...props }) => <p className="markdown-p" {...props} />,
          ul: ({ node, ...props }) => <ul className="markdown-ul" {...props} />,
          ol: ({ node, ...props }) => <ol className="markdown-ol" {...props} />,
          li: ({ node, ...props }) => <li className="markdown-li" {...props} />,
          strong: ({ node, ...props }) => <strong className="markdown-strong" {...props} />
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default App;
