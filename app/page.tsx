"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import { scrapeWebsite } from "./actions";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaningIndex, setLeaningIndex] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [biasExamples, setBiasExamples] = useState<string[]>([]);
  const [error, setError] = useState("");

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

  return (
    <div className="bg-background h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
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

        {leaningIndex !== null && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1 w-full">
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
            <div className="flex justify-between text-xs mt-1 w-full">
              <span className="text-blue-600 font-bold">-10</span>
              <span
                className="text-gray-600 mx-auto font-bold"
                style={{ flex: 1, textAlign: "center" }}
              >
                0
              </span>
              <span className="text-red-600 font-bold">+10</span>
            </div>
            <div className="text-center mt-1 text-sm font-semibold">
              {leaningIndex !== null &&
                (leaningIndex === 0 ? (
                  <>
                    Source is <span className="text-gray-600">neutral</span>
                  </>
                ) : leaningIndex > 0 && leaningIndex <= 4 ? (
                  <>
                    Source is{" "}
                    <span className="text-red-600">
                      moderately right leaning
                    </span>
                  </>
                ) : leaningIndex > 4 ? (
                  <>
                    Source is{" "}
                    <span className="text-red-600">strongly right leaning</span>
                  </>
                ) : leaningIndex < 0 && leaningIndex >= -4 ? (
                  <>
                    Source is{" "}
                    <span className="text-blue-600">
                      moderately left leaning
                    </span>
                  </>
                ) : leaningIndex < -4 ? (
                  <>
                    Source is{" "}
                    <span className="text-blue-600">strongly left leaning</span>
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
          <div className="mt-6 space-y-4">
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
      </div>
    </div>
  );
}
