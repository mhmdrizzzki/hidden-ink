/**
 * pollinations-client.js — Pollinations LLM + image (BYOP, scoped authorization).
 * hidden-ink: the LLM writes the secret, the image model draws the cover.
 * Scoped key comes from the official <polli-connect> widget (OAuth consent).
 */
(async function (root) {
    const CHAT_URL = "https://gen.pollinations.ai/v1/chat/completions";
    const IMAGE_URL = "https://gen.pollinations.ai/v1/images/generations";
    const CHAT_MODEL = "deepseek/deepseek-v4-flash";
    const IMAGE_MODEL = "flux";

    function headers(apiKey) {
        if (!apiKey) throw new Error("Not connected — click Connect with Pollinations first");
        return { "Content-Type": "application/json", Authorization: "Bearer " + apiKey };
    }

    root.PolliClient = {
        /** Ask the Pollinations LLM to write a concealed message. */
        async writeSecret(topic, { apiKey, maxTokens = 120 } = {}) {
            const res = await fetch(CHAT_URL, {
                method: "POST",
                headers: headers(apiKey),
                body: JSON.stringify({
                    model: CHAT_MODEL,
                    messages: [{
                        role: "user",
                        content: `Write one short secret sentence (max 20 words, no quotes, no preamble) that could be hidden inside a picture about: ${topic}`,
                    }],
                    max_tokens: maxTokens,
                }),
            });
            if (!res.ok) {
                let d = ""; try { d = (await res.json()).error?.message || ""; } catch (_e) {}
                throw new Error("LLM error " + res.status + " " + d);
            }
            return ((await res.json()).choices?.[0]?.message?.content || "").trim();
        },

        /** Draw a normal-looking cover image with the Pollinations image model. */
        async drawCover(prompt, { apiKey, width = 512, height = 512 } = {}) {
            const res = await fetch(IMAGE_URL, {
                method: "POST",
                headers: headers(apiKey),
                body: JSON.stringify({ model: IMAGE_MODEL, prompt: String(prompt).slice(0, 900), width, height }),
            });
            if (!res.ok) {
                let d = ""; try { d = (await res.json()).error?.message || ""; } catch (_e) {}
                throw new Error("Image error " + res.status + " " + d);
            }
            return res.blob();
        },

        /** Extract the plain text of a response for chat-compatible callers. */
        async chatCompletion(prompt, { apiKey, model = CHAT_MODEL, maxTokens = 200 } = {}) {
            const res = await fetch(CHAT_URL, {
                method: "POST",
                headers: headers(apiKey),
                body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: maxTokens }),
            });
            if (!res.ok) {
                let d = ""; try { d = (await res.json()).error?.message || ""; } catch (_e) {}
                throw new Error("Pollinations LLM error " + res.status + " " + d);
            }
            return ((await res.json()).choices?.[0]?.message?.content || "").trim();
        },
    };

    if (typeof module === "object" && module.exports) module.exports = root.PolliClient;
})(typeof self !== "undefined" ? self : globalThis);
