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

import  { GoogleGenerativeAI } from "@google/generative-ai";

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
      return <h1>Stop</h1>;
    }
   

    setIsTtsPlaying(id);

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }

      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }

      const genAI = new GoogleGenerativeAI(
        import.meta.env.VITE_API_KEY
      );

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
      });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: `Speak gently: ${text}` }]
          }
        ],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" }
            }
          }
        }
      });

      const base64 =
        result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64) throw new Error("No audio");

      const buffer = await decodeAudioData(
        decode(base64),
        audioCtxRef.current,
        24000,
        1
      );

      const src = audioCtxRef.current.createBufferSource();
      src.buffer = buffer;
      src.connect(audioCtxRef.current.destination);

      src.onended = () => {
        if (mountedRef.current) setIsTtsPlaying(null);
      };

      src.start();
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
      const ai = new GoogleGenAI({
        apiKey: import.meta.env.VITE_API_KEY
      });

      const res = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: {
          role: "user",
          parts: [
            {
              text:
                "Respond as a compassionate therapist in 1–2 sentences: " +
                text
            }
          ]
        }
      });

      const reply = res.text ?? "I am here with you.";

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