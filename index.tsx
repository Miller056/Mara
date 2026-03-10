/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useCallback,
  useEffect,
  useRef
} from "react";
import ReactDOM from "react-dom/client";

// AI calls go through our local backend to avoid exposing API keys in the browser.

import { Session } from "./types";
import { INITIAL_PLACEHOLDERS } from "./constants";
import { generateId } from "./utils";

import DottedGlowBackground from "./components/DottedGlowBackground";
import SideDrawer from "./components/SideDrawer";

import {
  ThinkingIcon,
  SparklesIcon,
  ArrowUpIcon,
  HeartPulseIcon,
  PlayIcon,
  PauseIcon,
  HeadphonesIcon,
  AlertCircleIcon,
  PhoneIcon,
  MessageSquareIcon
} from "./components/Icons";

/* -------------------- helpers -------------------- */

function decode(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  channels: number
) {
  const int16 = new Int16Array(data.buffer);
  const frames = int16.length / channels;
  const buffer = ctx.createBuffer(channels, frames, sampleRate);

  for (let c = 0; c < channels; c++) {
    const channel = buffer.getChannelData(c);
    for (let i = 0; i < frames; i++) {
      channel[i] = int16[i * channels + c] / 32768;
    }
  }
  return buffer;
}

const formatTimestamp = (t: number) =>
  new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* -------------------- App -------------------- */

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState<string | null>(null);

  const placeholders = INITIAL_PLACEHOLDERS;

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<{ close: () => void } | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      mountedRef.current = false;
      liveSessionRef.current?.close();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [sessions, isLoading]);

  /* ---------- TTS ---------- */

  const handleTts = async (text: string, id: string) => {
    if (isTtsPlaying === id) {
      setIsTtsPlaying(null);
      window.speechSynthesis?.cancel();
      return;
    }
   

    setIsTtsPlaying(id);

    try {
      if (!("speechSynthesis" in window)) throw new Error("No speech support");

      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.pitch = 1.0;
      utter.onend = () => {
        if (mountedRef.current) setIsTtsPlaying(null);
      };
      utter.onerror = () => {
        if (mountedRef.current) setIsTtsPlaying(null);
      };
      window.speechSynthesis.speak(utter);
    } catch {
      if (mountedRef.current) setIsTtsPlaying(null);
    }
  };

  /* ---------- Send text ---------- */

  const handleSend = useCallback(async (preset?: string) => {
    const text = (preset ?? inputValue).trim();
    if (!text || isLoading) return;

    setInputValue("");
    setIsLoading(true);

    const id = generateId();

    setSessions((s) => [
      ...s,
      {
        id,
        prompt: text,
        timestamp: Date.now(),
        insight: "ADHCI is here…",
        artifacts: []
      }
    ]);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: text }],
          language: "en"
        })
      });

      const data = await res.json();
      const reply =
        typeof data?.reply === "string" && data.reply.trim()
          ? data.reply
          : "I am here with you.";

      setSessions((s) =>
        s.map((x) => (x.id === id ? { ...x, insight: reply } : x))
      );
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [inputValue, isLoading]);

  /* ---------- UI ---------- */

  return (
    <>
      <main className="immersive-app">
        <DottedGlowBackground speedScale={0.2} />

        <div ref={scrollRef} className="stage-container">
          {sessions.map((s) => (
            <div key={s.id} className="message-pair">
              <div className="user-message">"{s.prompt}"</div>
              <div className="ai-insight-bubble">
                {s.insight}
                <button onClick={() => handleTts(s.insight!, s.id)}>
                  {isTtsPlaying === s.id ? <PauseIcon /> : <PlayIcon />}
                </button>
                <span>{formatTimestamp(s.timestamp)}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="ai-insight-bubble">
              <ThinkingIcon /> ADHCI is reflecting…
            </div>
          )}
        </div>

        <footer className="floating-input-container">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="What's on your mind?"
          />
          <button onClick={() => handleSend()}>
            <ArrowUpIcon />
          </button>
        </footer>
      </main>
    </>
  );
}

/* -------------------- mount -------------------- */

const root = document.getElementById("root")!;
ReactDOM.createRoot(root).render(<App />);
 export default App;