"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { scrapeWebsite } from "./actions";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaningIndex, setLeaningIndex] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [biasExamples, setBiasExamples] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [aboutOpacity, setAboutOpacity] = useState(1);
  const inputRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Fade out the about card as you scroll down
      const scrollY = window.scrollY;
      // Fade out between 0 and 120px
      const opacity = Math.max(0, 1 - scrollY / 120);
      setAboutOpacity(opacity);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await scrapeWebsite(url);
      setLeaningIndex(result.leaningIndex);
      setContent(result.content);
      setBiasExamples(result.biasExamples);
    } catch (err) {
      console.error("Error:", err);
      let errorMessage = "Failed to analyze the website. Please try again.";
      if (err && typeof err === "object" && "message" in err) {
        errorMessage = (err as { message: string }).message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <div />;
  }

  return (
    <div
      className={`bg-background min-h-screen w-full flex flex-col items-center justify-center p-4 ${
        leaningIndex === null && !loading ? "overflow-hidden h-screen" : "overflow-auto"
      }`}
      style={
        leaningIndex === null && !loading
          ? { position: "fixed", width: "100vw", height: "100vh", top: 0, left: 0 }
          : {}
      }
      suppressHydrationWarning
    >
      <Button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="fixed top-4 right-4 px-3 py-1 rounded bg-muted text-sm font-medium cursor-pointer z-50"
        aria-label="Toggle theme"
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </Button>
      {(leaningIndex === null && !loading) && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 transition-opacity duration-300"
          style={{
            top: 24,
            opacity: aboutOpacity,
            pointerEvents: aboutOpacity === 0 ? "none" : "auto",
          }}
        >
          <HoverCard>
            <HoverCardTrigger className="px-3 py-1 rounded bg-muted text-sm font-medium cursor-pointer">
              about
            </HoverCardTrigger>
            <HoverCardContent className="bg-background dark:bg-background rounded-lg shadow-lg p-4">
              <div className="text-sm">
                Analyzes the political bias of a piece of media, just paste the
                link or upload the video!
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      )}
      <div
        ref={inputRef}
        className={`w-full max-w-md space-y-4 transition-all duration-500 ${leaningIndex !== null || loading ? 'fixed z-40 bg-background animate-move-up' : ''}`}
        style={leaningIndex !== null || loading
          ? { width: '100%', maxWidth: '28rem', background: 'var(--color-background)', paddingTop: '5rem', paddingBottom: '2rem', top: '50%', left: '50%', transform: 'translate(-50%, 0)' }
          : {}
        }
      >
        <Input
          placeholder="paste..."
          className="w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <ToggleGroup
            type="single"
            defaultValue="text"
            className="justify-start"
          >
            <ToggleGroupItem value="text">text</ToggleGroupItem>
            <ToggleGroupItem value="video">video</ToggleGroupItem>
          </ToggleGroup>
          <Button
            onClick={handleSubmit}
            variant="outline"
            className=""
            disabled={loading}
          >
            {loading ? "Loading..." : "go"}
          </Button>
        </div>
        {error && <div className="text-red-500 mt-4">{error}</div>}
      </div>
      {(loading && leaningIndex === null) && (
        <div className="mt-32 flex flex-col items-center justify-center w-full max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mb-4"></div>
          <div className="text-muted-foreground text-lg font-medium">Analyzing...</div>
        </div>
      )}
      {leaningIndex !== null && (
        <div className="mt-50 w-full max-w-md mx-auto">
          <div className="flex justify-between text-xs mb-2 w-full">
            <span className="text-blue-600 font-bold">Strongly Left</span>
            <span
              className="text-gray-600 mx-auto font-bold"
              style={{ flex: 1, textAlign: "center" }}
            >
              Neutral
            </span>
            <span className="text-red-600 font-bold">Strongly Right</span>
          </div>
          {/* Scale */}
          <div
            className="relative h-6 w-full border border-border"
            style={{
              background:
                "linear-gradient(90deg, #2563eb 0%, #d1d5db 50%, #dc2626 100%)",
            }}
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 border-4 border-white shadow-lg flex items-center justify-center"
              style={{
                left: `calc(${((leaningIndex + 10) / 20) * 100}% - 12px)`,
                background: "#f59e42", // orange marker for visibility
                transition: "left 0.3s",
                zIndex: 2,
              }}
            >
              <span className="text-xs font-bold text-black">
                {leaningIndex}
              </span>
            </div>
          </div>
          {/* Bottom: Number labels */}
          <div className="flex justify-between text-xs mt-2 w-full">
            <span className="text-blue-600 font-bold">-10</span>
            <span
              className="text-gray-600 mx-auto font-bold"
              style={{ flex: 1, textAlign: "center" }}
            >
              0
            </span>
            <span className="text-red-600 font-bold">+10</span>
          </div>
          <div className="text-center mt-2 text-sm font-semibold">
            {leaningIndex !== null &&
              (leaningIndex >= -1 && leaningIndex <= 1 ? (
                <>
                  Source is <span className="text-gray-600">neutral</span>
                </>
              ) : leaningIndex < -1 && leaningIndex >= -3 ? (
                <>
                  Source is{" "}
                  <span className="text-blue-600">slightly left leaning</span>
                </>
              ) : leaningIndex > 1 && leaningIndex <= 3 ? (
                <>
                  Source is{" "}
                  <span className="text-red-600">slightly right leaning</span>
                </>
              ) : leaningIndex < -3 && leaningIndex >= -7 ? (
                <>
                  Source is{" "}
                  <span className="text-blue-600">moderately left leaning</span>
                </>
              ) : leaningIndex > 3 && leaningIndex <= 7 ? (
                <>
                  Source is{" "}
                  <span className="text-red-600">moderately right leaning</span>
                </>
              ) : leaningIndex < -7 ? (
                <>
                  Source is{" "}
                  <span className="text-blue-600">strongly left leaning</span>
                </>
              ) : leaningIndex > 7 ? (
                <>
                  Source is{" "}
                  <span className="text-red-600">strongly right leaning</span>
                </>
              ) : (
                <>
                  Source is <span className="text-gray-600">neutral</span>
                </>
              ))}
          </div>
        </div>
      )}

      {content && (
        <div className="mt-12 space-y-4 w-full max-w-md mx-auto">
          <h3 className="text-lg font-medium">Examples of bias:</h3>
          <ul className="space-y-2 list-disc pl-5">
            {biasExamples.map((example, index) => (
              <li key={index} className="text-sm text-gray-700">
                {example}
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx global>{`
        @keyframes moveUp {
          0% {
            top: 45%;
            left: 50%;
            transform: translate(-50%, 0);
          }
          100% {
            top: 0%;
            left: 50%;
            transform: translate(-50%, 0);
          }
        }
        .animate-move-up {
          animation: moveUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          left: 50%;
          transform: translate(-50%, 0);
        }
      `}</style>
    </div>
  );
}
