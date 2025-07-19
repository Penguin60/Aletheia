"use server";

import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as cheerio from "cheerio";

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

    // $(
    //   "script, style, noscript, meta, link, iframe, svg, img, video, audio, object, embed"
    // ).remove();

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
    return { content: content };
  } catch (error) {
    console.error("Error scraping website:", error);
    throw error;
  }
}
