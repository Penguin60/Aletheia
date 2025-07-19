"use server";

import { GoogleGenAI } from "@google/genai";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as cheerio from "cheerio";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function scrapeWebsite(url: string) {
  try {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;

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

    const html = await response.text();

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

    const dom = new JSDOM(cleanedHtml, { url: formattedUrl });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.content) {
      throw new Error("Could not extract readable content");
    }

    // Extract the article title from Readability
    const articleTitle = article.title || "Untitled Article";

    //   const finalText = $$.text()
    //     .replace(/\s+/g, " ")
    //     .replace(/\n\s+/g, "\n")
    //     .trim();

    //   return { content: finalText };

    const $$ = cheerio.load(article.content);

    let content = "";

    $("body")
      .find("*")
      .each((_, element) => {
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
    };
  } catch (error) {
    console.error("Error scraping website:", error);
    throw error;
  }
}
