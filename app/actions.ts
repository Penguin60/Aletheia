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

    // const prompt = `Refine the following website content for readability and conciseness. Do not add any additional text. Only remove irrelevant information, like site headers and login prompts; do not remove, change, or summarize any parts of the actual article. You must return the content provided to you the exact same, except for elements like site headers, etc that do not relate to the overall theme. Do not include extra formatting. The content is as follows:\n\n${content}`;
    const prompt = `Given the following content, return a number between -10 and 10 (inclusive) indicating the political leaning. The lower the number, the more left leaning. The higher the number, the more right leaning. The content: ${content}`
    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `${prompt}`,
    });
    return { content: geminiResponse.text };
  } catch (error) {
    console.error("Error scraping website:", error);
    throw error;
  }
}
