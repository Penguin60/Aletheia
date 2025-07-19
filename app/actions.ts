"use server";

import { GoogleGenAI } from "@google/genai";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as cheerio from "cheerio";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getBrowser() {
  // Check environment
  const isDev = process.env.NODE_ENV !== "production";
  console.log(`Environment: ${isDev ? "Development" : "Production"}`);

  if (isDev) {
    console.log("Using local Puppeteer instance");
    const puppeteer = await import("puppeteer");
    return puppeteer.default.launch({
      headless: "new" as any,
    });
  } else {
    console.log("Using @sparticuz/chromium in production");
    try {
      const browser = await puppeteerCore.launch({
        args: [
          ...chromium.args,
          "--disable-features=AudioServiceOutOfProcess",
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--disable-setuid-sandbox",
          "--no-sandbox",
          "--no-zygote",
          "--single-process",
        ],
        executablePath: await chromium.executablePath(),
        headless: true,
      });
      console.log("Browser launched successfully");
      return browser;
    } catch (error) {
      console.error("Failed to launch browser:", error);
      throw error;
    }
  }
}

export async function scrapeWebsite(url: string) {
  try {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;

    let html: string;
    let fetchMethod = "standard";

    try {
      // First attempt: standard fetch
      const response = await fetch(formattedUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch website: ${response.status} ${response.statusText}`
        );
      }

      html = await response.text();
    } catch (fetchError) {
      console.log("Standard fetch failed, trying with Puppeteer...");
      fetchMethod = "puppeteer";

      // Replace the Puppeteer code with:
      const browser = await getBrowser();
      try {
        const page = await browser.newPage();
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        );
        await page.goto(formattedUrl, {
          waitUntil: "networkidle0",
          timeout: 60000,
        });

        // Wait a bit for dynamic content to load
        await new Promise((res) => setTimeout(res, 2000));

        html = await page.content();
      } finally {
        await browser.close();
      }
    }

    const $ = cheerio.load(html);

    $(
      [
        "script",
        "style",
        "noscript",
        "meta",
        "link",
        "iframe",
        "svg",
        "img",
        "video",
        "audio",
        "object",
        "embed",
        "nav",
        "footer",
        "header",
        "aside",
        ".ad",
        ".ads",
        ".advertisement",
        ".promo",
        ".sidebar",
        ".comments",
        "form",
        "button",
        "input",
        "select",
        "option",
        "label",
        "figure",
        "figcaption",
        "canvas",
        "map",
        "area",
        "table",
        "thead",
        "tbody",
        "tfoot",
        "tr",
        "th",
        "td",
        "blockquote",
        "cite",
        ".sponsored",
        ".cookie",
        ".banner",
        ".newsletter",
        ".subscribe",
        ".share",
        ".social",
        ".related",
        ".pagination",
        ".breadcrumb",
        ".modal",
        ".popup",
        ".overlay",
        ".loader",
        ".spinner",
        ".hidden",
        ".skip-link",
        ".skip",
        ".nav",
        ".menu",
        ".search",
        ".login",
        ".register",
        ".signup",
        ".profile",
        ".user",
        ".author",
        ".avatar",
      ].join(", ")
    ).remove();

    const cleanedHtml = $.html();

    // Try to extract content with Readability
    let articleTitle = "Untitled Article";
    let content = "";

    try {
      const dom = new JSDOM(cleanedHtml, { url: formattedUrl });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article || !article.content) {
        throw new Error("Could not extract readable content");
      }

      // Extract the article title from Readability
      articleTitle = article.title || "Untitled Article";
      const $$ = cheerio.load(article.content);

      $("body")
        .find("*")
        .each((_: number, element: any) => {
          const tagName = element.name;

          const directText = $(element)
            .clone()
            .children()
            .remove()
            .end()
            .text()
            .trim();

          if (directText) {
            if (
              [
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
                "p",
                "div",
                "section",
                "article",
              ].includes(tagName)
            ) {
              content += "\n\n" + directText;
            } else if (["li"].includes(tagName)) {
              content += "\n• " + directText;
            } else {
              content += " " + directText;
            }
          }
        });
    } catch (readabilityError) {
      console.log(
        "Readability extraction failed, trying Puppeteer extraction..."
      );

      // Replace your existing Puppeteer extraction code in the catch block
      if (fetchMethod !== "puppeteer") {
        try {
          console.log("[PUPPETEER] Starting Puppeteer extraction...");
          fetchMethod = "puppeteer";
          console.log("[PUPPETEER] Initializing browser");
          const browser = await getBrowser();

          try {
            console.log("[PUPPETEER] Creating new page");
            const page = await browser.newPage();
            console.log("[PUPPETEER] Setting user agent");
            await page.setUserAgent(
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            );

            console.log(`[PUPPETEER] Navigating to ${formattedUrl}`);
            await page.goto(formattedUrl, {
              waitUntil: "domcontentloaded",
              timeout: 30000,
            });
            console.log("[PUPPETEER] Navigation completed");

            // Try to get title
            console.log("[PUPPETEER] Extracting page title");
            articleTitle = (await page.title()) || "Untitled Article";
            console.log(`[PUPPETEER] Page title: "${articleTitle}"`);

            // Extract text content from main content areas
            console.log("[PUPPETEER] Extracting page content");
            const textContent = await (page.evaluate as any)(() => {
              try {
                console.log("[BROWSER] Finding main content element");
                const mainContent =
                  document.querySelector("article") ||
                  document.querySelector("main") ||
                  document.querySelector(".content") ||
                  document.body;

                console.log("[BROWSER] Removing unnecessary elements");
                const elementsToRemove = mainContent.querySelectorAll(
                  "nav, footer, header, aside, script, style"
                );
                elementsToRemove.forEach((el) => el.remove());

                console.log("[BROWSER] Extracting text");
                return mainContent.innerText || "No content found";
              } catch (err) {
                return `Error in browser context: ${
                  typeof err === "object" && err !== null && "message" in err
                    ? (err as { message?: string }).message
                    : String(err)
                }`;
              }
            });

            console.log(
              `[PUPPETEER] Content extraction complete, type: ${typeof textContent}`
            );
            content = textContent;
            console.log(
              `[PUPPETEER] Extracted content length: ${content.length} characters`
            );
            console.log(
              `[PUPPETEER] First 100 characters: "${content
                .substring(0, 100)
                .replace(/\n/g, " ")}..."`
            );
          } finally {
            console.log("[PUPPETEER] Closing browser...");
            await browser.close();
            console.log("[PUPPETEER] Browser closed");
          }
        } catch (puppeteerError) {
          console.error("[PUPPETEER] Extraction error:", puppeteerError);
          // Continue with what we have or fallback to simple content
        }
      }

      if (!content.trim()) {
        const titleSelectors = [
          "h1",
          "h1.title",
          "header h1",
          ".article-title",
          ".post-title",
        ];
        for (const selector of titleSelectors) {
          const titleElement = $(selector).first();
          if (titleElement.length && titleElement.text().trim()) {
            articleTitle = titleElement.text().trim();
            break;
          }
        }

        const contentSelectors = [
          "article",
          ".content",
          ".post-content",
          ".article-content",
          "main",
          "#content",
          "#main",
        ];
        let mainContent: cheerio.Cheerio<any> = $("body").first();

        for (const selector of contentSelectors) {
          const element = $(selector).first();
          if (element.length) {
            mainContent = element;
            break;
          }
        }

        mainContent.find("h1, h2, h3, h4, h5, h6, p").each((_, element) => {
          const text = $(element).text().trim();
          if (text) {
            content += "\n\n" + text;
          }
        });

        mainContent.find("li").each((_, element) => {
          const text = $(element).text().trim();
          if (text) {
            content += "\n• " + text;
          }
        });

        // If we still don't have content, get all text as a last resort
        if (!content.trim()) {
          content = mainContent
            .text()
            .replace(/\s+/g, " ")
            .replace(/\n\s+/g, "\n")
            .trim();
        }
      }
    }

    // Clean up content
    content = content.replace(/\n{3,}/g, "\n\n").trim();

    if (!content.trim()) {
      throw new Error("Could not extract meaningful content from the webpage");
    }

    console.log(`Content extracted successfully, length: ${content.length} characters`);

    const prompt = `
    The following content is from an article titled: "${articleTitle}"
    
    Analyze the content for political bias, keeping in mind that the main topic is about "${articleTitle}". 
    Focus ONLY on content related to this topic and ignore any references to other articles, sidebar content, 
    or unrelated headlines that might have been captured during scraping.
    
    Please provide:
    1. A number between -10 and 10 (inclusive) indicating the political leaning. The lower the number, the more left leaning. The higher the number, the more right leaning.
    2. Three specific examples from the content that demonstrate this political bias. Ensure these examples are from the main article about "${articleTitle}" and not from other articles or sidebar content.
    
    Important: List the examples in order of significance, with the most egregious/obvious examples of bias first. Focus on the clearest and most impactful instances of political framing, loaded language, or one-sided representation.
    
    Format your response exactly as follows:
    SCORE: [your number]
    
    EXAMPLES:
    - [most significant example of bias]
    - [second most significant example]
    - [third most significant example]
    
    The content: ${content}`;

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `${prompt}`,
    });

    const responseText = geminiResponse.text ?? "";

    const scoreMatch = responseText.match(/SCORE:\s*(-?\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    const examplesSection = responseText.split("EXAMPLES:")[1]?.trim();
    const examples = examplesSection
      ? examplesSection
          .split(/\n-\s*/)
          .filter((example) => example.trim().length > 0)
          .map((example) => example.trim())
      : [];

    return {
      leaningIndex: score,
      content: content,
      biasExamples: examples,
      title: articleTitle,
      fetchMethod: fetchMethod,
    };
  } catch (error) {
    console.error("Error scraping website:", error);
    throw error;
  }
}
