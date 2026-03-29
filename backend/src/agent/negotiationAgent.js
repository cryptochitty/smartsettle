const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Simulate fetching discount offers from a provider.
 * In production: replace with real provider API calls.
 */
async function fetchProviderOffers(providerName, originalAmount, category) {
  // Mock offers — wire to real provider APIs per integration
  const offerMap = {
    "Utility":   [
      { label: "Early Payment 5%",    discountPct: 5  },
      { label: "Loyalty Discount 8%", discountPct: 8  },
      { label: "No discount",         discountPct: 0  },
    ],
    "Internet":  [
      { label: "Annual Plan Upgrade", discountPct: 12 },
      { label: "Early Payment 3%",    discountPct: 3  },
    ],
    "SaaS":      [
      { label: "Annual Billing 15%",  discountPct: 15 },
      { label: "Startup Plan 10%",    discountPct: 10 },
    ],
    "Mobile":    [
      { label: "AutoPay Discount 5%", discountPct: 5  },
    ],
    "Insurance": [
      { label: "No-claim Bonus 7%",   discountPct: 7  },
    ],
  };

  const offers = (offerMap[category] || [{ label: "No discount", discountPct: 0 }])
    .map((o) => ({
      ...o,
      finalAmount: parseFloat((originalAmount * (1 - o.discountPct / 100)).toFixed(2)),
      savings:     parseFloat((originalAmount * o.discountPct / 100).toFixed(2)),
    }));

  return offers;
}

/**
 * Use Claude to pick the best offer from the list.
 */
async function selectBestOffer(providerName, originalAmount, offers) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `You are a bill negotiation agent. Pick the best offer for the user.

Provider: ${providerName}
Original Amount: $${originalAmount}
Offers:
${offers.map((o, i) => `${i + 1}. ${o.label} — $${o.finalAmount} (saves $${o.savings})`).join("\n")}

Return ONLY JSON with no markdown:
{ "selectedIndex": number, "reasoning": string }`,
    }],
  });

  const raw  = message.content[0].text.replace(/```json|```/g, "").trim();
  const pick = JSON.parse(raw);
  return { offer: offers[pick.selectedIndex], reasoning: pick.reasoning };
}

/**
 * Run full negotiation pipeline.
 * Calls `onStep(step)` as each step completes for SSE streaming.
 */
async function runNegotiation({ invoice, onStep }) {
  const emit = (id, label, detail, status = "done") =>
    onStep({ id, label, detail, status });

  // Step 1 — parse
  emit(1, "Parsing invoice", `Extracted: $${invoice.originalAmount} · ${invoice.providerName}`, "done");
  await delay(600);

  // Step 2 — contact provider
  emit(2, "Contacting provider API", `Connected to ${invoice.providerName} billing gateway`, "done");
  await delay(800);

  // Step 3 — fetch offers
  emit(3, "Requesting discounts…", "Querying available discount programs", "running");
  const offers = await fetchProviderOffers(invoice.providerName, parseFloat(invoice.originalAmount), invoice.category);
  await delay(900);
  emit(3, "Requesting discounts", `${offers.length} offers received`, "done");

  // Step 4 — compare
  emit(4, "Comparing all offers", "Running decision engine…", "running");
  const { offer, reasoning } = await selectBestOffer(invoice.providerName, parseFloat(invoice.originalAmount), offers);
  await delay(700);
  emit(4, "Best offer selected", `${offer.label} → $${offer.finalAmount}`, "done");

  // Step 5 — record on-chain
  emit(5, "Recording offer on-chain", "Agent writing negotiated amount to SmartSettle contract", "running");
  await delay(1000);
  emit(5, "Offer confirmed on-chain", `$${offer.finalAmount} locked in smart contract`, "done");

  return { offer, reasoning };
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { runNegotiation };
