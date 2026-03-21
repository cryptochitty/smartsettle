const { complete } = require("./llmAdapter");
const Tesseract    = require("tesseract.js");
const pdfParse     = require("pdf-parse");
const fs           = require("fs");
const path         = require("path");

/**
 * Extract text from a PDF or image file using OCR / pdf-parse.
 */
async function extractText(filePath, mimeType) {
  if (mimeType === "application/pdf") {
    const buffer = fs.readFileSync(filePath);
    const data   = await pdfParse(buffer);
    return data.text;
  }
  // Image → Tesseract OCR
  const { data: { text } } = await Tesseract.recognize(filePath, "eng");
  return text;
}

/**
 * Use LLM adapter to parse raw invoice text into structured JSON.
 */
async function parseWithAI(rawText) {
  const raw = await complete(
    `You are an invoice parser. Extract structured data from the following invoice text.
Return ONLY valid JSON with these fields (no markdown, no explanation):
{
  "providerName":    string,   // company name e.g. "BESCOM", "Airtel", "AWS"
  "originalAmount":  number,   // total amount due as a number e.g. 53.00
  "dueDate":         string,   // ISO date string e.g. "2026-04-15"
  "accountId":       string,   // account/customer ID
  "category":        string,   // one of: Utility, Internet, SaaS, Mobile, Insurance, Other
  "confidence":      number    // 0.0–1.0 confidence score
}

Invoice text:
${rawText.slice(0, 3000)}`,
    512
  );

  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

/**
 * Main entry: parse an uploaded invoice file.
 * Returns a ParsedInvoice object.
 */
async function parseInvoice(filePath, mimeType) {
  try {
    const rawText = await extractText(filePath, mimeType);
    const parsed  = await parseWithAI(rawText);

    // Validate required fields
    if (!parsed.providerName || !parsed.originalAmount || !parsed.dueDate) {
      throw new Error("Could not extract required invoice fields");
    }

    return parsed;
  } finally {
    // Clean up uploaded temp file
    try { fs.unlinkSync(filePath); } catch {}
  }
}

module.exports = { parseInvoice };
