"use server";

import * as cheerio from "cheerio";

export async function scrapeWebsite(url: string) {
  try {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    
    const response = await fetch(formattedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    const $ = cheerio.load(html);
    
    $('script, style, noscript, meta, link, iframe, svg, img, video, audio, object, embed').remove();
    
    let content = '';
    
    $('body').find('*').each((_, element) => {
      const tagName = element.name;
      
      const directText = $(element).clone().children().remove().end().text().trim();
      
      if (directText) {
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'section', 'article'].includes(tagName)) {
          content += '\n\n' + directText;
        } else if (['li'].includes(tagName)) {
          content += '\n• ' + directText;
        } else {
          content += ' ' + directText;
        }
      }
    });
    
    content = content.replace(/\s+/g, ' ').replace(/\n\s+/g, '\n').trim();
    content = content.replace(/\n{3,}/g, '\n\n');
    
    return { content };
  } catch (error) {
    console.error("Error scraping website:", error);
    throw error;
  }
}