"use server";

import * as cheerio from "cheerio";

export async function scrapeWebsite(url: string) {
  try {
    // Add https:// if it's missing
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    
    // Fetch the website content
    const response = await fetch(formattedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Load the HTML with cheerio
    const $ = cheerio.load(html);
    
    // Get the HTML content
    const content = $("html").html() || "";
    
    return { content };
  } catch (error) {
    console.error("Error scraping website:", error);
    throw error;
  }
}