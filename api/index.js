// ── Vercel Serverless: GET /api ──────────────────────────────────────────
// Health-check endpoint.
// ────────────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({ status: "ok", message: "Streaming LLM API is running" });
};
