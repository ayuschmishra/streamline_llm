// ── Vercel Serverless: POST /api/stream ─────────────────────────────────
// Streams OpenAI chat-completion tokens to the client via SSE.
// ────────────────────────────────────────────────────────────────────────

const OpenAI = require("openai");

const openai = new OpenAI({
    baseURL: "https://aipipe.org/openai/v1",
    apiKey: process.env.AIPIPE_TOKEN,
});

module.exports = async function handler(req, res) {
    // ── CORS ────────────────────────────────────────────────────────────
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    const { prompt } = req.body || {};

    if (!prompt) {
        return res.status(400).json({ error: "prompt is required" });
    }

    // ── SSE headers ───────────────────────────────────────────────────
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            stream: true,
            temperature: 0.7,
            max_tokens: 2048,
            messages: [
                {
                    role: "system",
                    content:
                        "You are a senior financial analyst. When the user asks for insights, " +
                        "provide exactly 9 clearly numbered key insights about the topic. " +
                        "For each insight provide concrete evidence or data points. " +
                        "Use professional language. Be detailed — each insight should be " +
                        "at least 2-3 sentences long so the total response is substantial.",
                },
                { role: "user", content: prompt },
            ],
        });

        for await (const chunk of completion) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
                const payload = JSON.stringify({
                    choices: [{ delta: { content } }],
                });
                res.write(`data: ${payload}\n\n`);
            }
        }

        res.write("data: [DONE]\n\n");
        res.end();
    } catch (err) {
        console.error("Stream error:", err.message);
        const errorPayload = JSON.stringify({
            error: {
                message: err.message || "Internal server error",
                type: err.type || "server_error",
            },
        });
        res.write(`data: ${errorPayload}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
    }
};
