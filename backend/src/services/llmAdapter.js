/**
 * LLM Adapter — provider-agnostic text completion.
 *
 * Auto-detects whichever API key is present (priority: Anthropic → OpenAI → Gemini).
 * Callers just do:  const text = await complete(prompt, maxTokens)
 *
 * To add a new provider:
 *  1. Add its env key to PROVIDERS
 *  2. Add its handler to the switch block
 *  3. npm install the SDK
 */

const PROVIDERS = [
  { name: "anthropic", envKey: "ANTHROPIC_API_KEY", model: "claude-sonnet-4-6"    },
  { name: "openai",    envKey: "OPENAI_API_KEY",    model: "gpt-4o-mini"           },
  { name: "gemini",    envKey: "GEMINI_API_KEY",    model: "gemini-1.5-flash"      },
];

function detectProvider() {
  const found = PROVIDERS.find((p) => !!process.env[p.envKey]);
  if (!found) {
    throw new Error(
      "No LLM API key found. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in your .env"
    );
  }
  return found;
}

/**
 * Send a single user prompt to whichever LLM provider is configured.
 * @param {string} prompt     - The user message / instruction
 * @param {number} maxTokens  - Max tokens for the response (default 512)
 * @returns {Promise<string>} - Raw text response from the model
 */
async function complete(prompt, maxTokens = 512) {
  const provider = detectProvider();

  switch (provider.name) {
    case "anthropic": {
      const Anthropic = require("@anthropic-ai/sdk");
      const client    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg       = await client.messages.create({
        model:      provider.model,
        max_tokens: maxTokens,
        messages:   [{ role: "user", content: prompt }],
      });
      return msg.content[0].text;
    }

    case "openai": {
      const OpenAI = require("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res    = await client.chat.completions.create({
        model:      provider.model,
        max_tokens: maxTokens,
        messages:   [{ role: "user", content: prompt }],
      });
      return res.choices[0].message.content;
    }

    case "gemini": {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model  = genAI.getGenerativeModel({ model: provider.model });
      const result = await model.generateContent(prompt);
      return result.response.text();
    }

    default:
      throw new Error(`Unknown provider: ${provider.name}`);
  }
}

/** Convenience: log which provider will be used (call at startup) */
function logActiveProvider() {
  try {
    const p = detectProvider();
    console.log(`[LLM] Using provider: ${p.name} (${p.model})`);
  } catch (e) {
    console.warn(`[LLM] WARNING: ${e.message}`);
  }
}

module.exports = { complete, logActiveProvider };
