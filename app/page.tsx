"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import { scrapeWebsite } from "./actions";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await scrapeWebsite(url);
      // if (typeof result === "string" && result) {
      //   setContent(result);
      // } else {
      //   setContent(null);
      //   setError("No content found.");
      // }
      setContent(result.content)
    } catch (err) {
      setError(
        "Failed to scrape website: " +
          (err instanceof Error ? err.message : String(err))
      );
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
            onClick={handleScrape}
            variant="outline"
            className=""
            disabled={loading}
          >
            {loading ? "Loading..." : "go"}
          </Button>
        </div>

        {error && <div className="text-red-500 mt-4">{error}</div>}

        {content && (
          <div className="mt-4 border p-4 rounded-md max-h-80 overflow-auto">
            <pre className="text-xs whitespace-pre-wrap">{content}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
