"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { analyzeVideoForBias, scrapeWebsite } from "./actions";
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
  const [scrolledTop, setScrolledTop] = useState(false);
  const [scrolledBottom, setScrolledBottom] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedType, setSelectedType] = useState("text");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update scrolledBottom whenever content changes or window resizes
  useEffect(() => {
    const updateScrolledBottom = () => {
      const contentEl = document.querySelector(".mt-12");
      // Check if page is scrolled to the bottom
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 1;
      if (atBottom) {
        setScrolledBottom(false);
        return;
      }
      if (contentEl) {
        const rect = contentEl.getBoundingClientRect();
        setScrolledBottom(rect.top < window.innerHeight - 5 * 16);
      } else {
        setScrolledBottom(false);
      }
    };
    updateScrolledBottom();
    window.addEventListener("resize", updateScrolledBottom);
    return () => window.removeEventListener("resize", updateScrolledBottom);
  }, [content, biasExamples, leaningIndex, loading]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolledTop(window.scrollY > 0);
      // Fade out the about card as you scroll down
      const scrollY = window.scrollY;
      // Fade out between 0 and 120px
      const opacity = Math.max(0, 1 - scrollY / 120);
      setAboutOpacity(opacity);
      // Update scrolledBottom on scroll
      const contentEl = document.querySelector(".mt-12");
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 1;
      if (atBottom) {
        setScrolledBottom(false);
        return;
      }
      if (contentEl) {
        const rect = contentEl.getBoundingClientRect();
        setScrolledBottom(rect.top < window.innerHeight - 5 * 16);
      } else {
        setScrolledBottom(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (selectedType === "text") {
        const result = await scrapeWebsite(url);
        setLeaningIndex(result.leaningIndex);
        setContent(result.content);
        setBiasExamples(result.biasExamples);
      }
      else if (selectedType === "video" && videoFile) {
        // Send video file to API route using FormData
        const formData = new FormData();
        formData.append('file', videoFile);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        const result = await response.json();
        setLeaningIndex(result.leaningIndex);
        setContent(result.content);
        setBiasExamples(result.biasExamples);
      } else if (selectedType === "video" && !videoFile) {
        setError("Please upload a video file.");
        return;
      }
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
        leaningIndex === null && !loading
          ? "overflow-hidden h-screen"
          : "overflow-auto"
      }`}
      style={
        leaningIndex === null && !loading
          ? {
              position: "fixed",
              width: "100vw",
              height: "100vh",
              top: 0,
              left: 0,
            }
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
      {leaningIndex === null && !loading && (
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
      {leaningIndex === null && !loading && (
        <div>
          {theme === "dark" && (
            <img src="./White_Logo.png" className="w-[10rem] h-auto" />
          )}
          {theme === "light" && (
            <img src="./Black_Logo.png" className="w-[10rem] h-auto" />
          )}
        </div>
      )}
      <div
        ref={inputRef}
        className={`w-full max-w-md space-y-4 ${
          leaningIndex !== null || loading
            ? "fixed z-40 bg-background animate-move-up"
            : ""
        }`}
        style={
          leaningIndex !== null || loading
            ? {
                width: "100vw",
                maxWidth: "100vw",
                background: "var(--color-background)",
                paddingTop: "5rem",
                paddingBottom: "2rem",
                paddingLeft: "calc((100vw - 28rem) / 2)",
                paddingRight: "calc((100vw - 28rem) / 2)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, 0)",
                boxShadow: scrolledTop
                  ? "0 12px 24px -8px rgba(0,0,0,0.12)"
                  : "none",
              }
            : {}
        }
      >
        {selectedType === "text" ? (
          <Input
            placeholder="paste..."
            className="w-full"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              const isDisabled = loading || !url.trim() || !/^https?:\/\/.+\..+/.test(url);
              if (e.key === "Enter" && !isDisabled) {
                handleSubmit(e as any);
              }
            }}
          />
        ) : (
          <Input
            placeholder="upload file..."
            type="file"
            accept="video/*"
            className="w-full"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setVideoFile(e.target.files[0]);
              } else {
                setVideoFile(null);
              }
            }}
          />
        )}
        <div className="flex items-center justify-between">
          <ToggleGroup
            type="single"
            value={selectedType}
            onValueChange={(val) => {
              // Prevent unselecting by always keeping one selected
              if (!val) return;
              setSelectedType(val);
            }}
            className="justify-start"
          >
            <ToggleGroupItem
              value="text"
              className={
                selectedType === "text"
                  ? theme === "dark"
                    ? "bg-background text-black border border-white"
                    : "bg-background text-white border border-black"
                  : ""
              }
            >
              text
            </ToggleGroupItem>
            <ToggleGroupItem
              value="video"
              className={
                selectedType === "video"
                  ? theme === "dark"
                    ? "bg-background text-black border border-white"
                    : "bg-background text-white border border-black"
                  : ""
              }
            >
              video
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            onClick={handleSubmit}
            variant="outline"
            className="hover:text-primary hover:bg-accent dark:hover:bg-accent border-black hover:border-primary dark:hover:border-white"
            disabled={
              loading ||
              (selectedType === "text"
                ? !url.trim() || !/^https?:\/\/.+\..+/.test(url)
                : !videoFile)
            }
          >
            {loading ? "Loading..." : "go"}
          </Button>
        </div>
        {error && <div className="text-red-500 mt-4">{error}</div>}
      </div>
      {loading && leaningIndex === null && (
        <div className="mt-32 flex flex-col items-center justify-center w-full max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mb-4"></div>
          <div className="text-muted-foreground text-lg font-medium">
            Analyzing...
          </div>
        </div>
      )}
      {leaningIndex !== null && (
        <div className="mt-50 w-full max-w-md mx-auto">
          <div className="flex justify-between text-xs mb-2 w-full">
            <span
              className={
                theme === "dark"
                  ? "text-blue-300 font-bold"
                  : "text-blue-600 font-bold"
              }
            >
              Strongly Left
            </span>
            <span
              className="text-text mx-auto font-bold"
              style={{ flex: 1, textAlign: "center" }}
            >
              Neutral
            </span>
            <span
              className={
                theme === "dark"
                  ? "text-red-300 font-bold"
                  : "text-red-600 font-bold"
              }
            >
              Strongly Right
            </span>
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
            <span
              className={
                theme === "dark"
                  ? "text-blue-300 font-bold"
                  : "text-blue-600 font-bold"
              }
            >
              -10
            </span>
            <span
              className="text-text mx-auto font-bold"
              style={{ flex: 1, textAlign: "center" }}
            >
              0
            </span>
            <span
              className={
                theme === "dark"
                  ? "text-red-300 font-bold"
                  : "text-red-600 font-bold"
              }
            >
              +10
            </span>
          </div>
          <div className="text-center mt-2 text-sm font-semibold">
            {leaningIndex !== null &&
              (leaningIndex >= -1 && leaningIndex <= 1 ? (
                <>
                  Source is{" "}
                  <span
                    className={
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }
                  >
                    neutral
                  </span>
                </>
              ) : leaningIndex < -1 && leaningIndex >= -3 ? (
                <>
                  Source is{" "}
                  <span
                    className={
                      theme === "dark" ? "text-blue-300" : "text-blue-600"
                    }
                  >
                    slightly left leaning
                  </span>
                </>
              ) : leaningIndex > 1 && leaningIndex <= 3 ? (
                <>
                  Source is{" "}
                  <span
                    className={
                      theme === "dark" ? "text-red-300" : "text-red-600"
                    }
                  >
                    slightly right leaning
                  </span>
                </>
              ) : leaningIndex < -3 && leaningIndex >= -7 ? (
                <>
                  Source is{" "}
                  <span
                    className={
                      theme === "dark" ? "text-blue-300" : "text-blue-600"
                    }
                  >
                    moderately left leaning
                  </span>
                </>
              ) : leaningIndex > 3 && leaningIndex <= 7 ? (
                <>
                  Source is{" "}
                  <span
                    className={
                      theme === "dark" ? "text-red-300" : "text-red-600"
                    }
                  >
                    moderately right leaning
                  </span>
                </>
              ) : leaningIndex < -7 ? (
                <>
                  Source is{" "}
                  <span
                    className={
                      theme === "dark" ? "text-blue-300" : "text-blue-600"
                    }
                  >
                    strongly left leaning
                  </span>
                </>
              ) : leaningIndex > 7 ? (
                <>
                  Source is{" "}
                  <span
                    className={
                      theme === "dark" ? "text-red-300" : "text-red-600"
                    }
                  >
                    strongly right leaning
                  </span>
                </>
              ) : (
                <>
                  Source is{" "}
                  <span
                    className={
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }
                  >
                    neutral
                  </span>
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
              <li key={index} className="text-sm text-text">
                {example}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom overlay that covers the text, requiring scroll to view results */}
      {(leaningIndex !== null || loading) && (
        <div
          style={{
            position: "fixed",
            left: 0,
            bottom: 0,
            width: "100vw",
            height: "5rem",
            background: "var(--color-background)",
            zIndex: 30,
            pointerEvents: "none",
            boxShadow: scrolledBottom
              ? "0 -12px 24px -8px rgba(0,0,0,0.12)"
              : "none",
            transition: "opacity 0.5s",
          }}
        />
      )}

      {/* Left and right solid background color divs to cover the sides (rendered above the search bar background) */}
      {(leaningIndex !== null || loading) && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "calc((100vw - 30rem) / 2)", // slightly less wide
              height: "100vh",
              background: "var(--color-background)",
              zIndex: 41,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "calc((100vw - 30rem) / 2)", // slightly less wide
              height: "100vh",
              background: "var(--color-background)",
              zIndex: 41,
              pointerEvents: "none",
            }}
          />
        </>
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
      {/* Bottom spacer for visual balance */}
      {(leaningIndex !== null || loading) && <div style={{ height: "5rem" }} />}
    </div>
  );
}
