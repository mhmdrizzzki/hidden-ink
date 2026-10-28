[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

# 🖋️ hidden-ink — secret messages inside AI images

A Pollinations LLM writes a secret sentence, **flux** draws an ordinary-looking picture, and the message hides inside the image pixels — only someone using this tool can pull it back out.

Inspired by the quest reading: [How does Fable 5.1 hide messages in images?](https://www.lesswrong.com/posts/WHEQps5PK8LrrcTAb/how-does-fable-5-1-hide-messages-in-images)

## How it uses Pollinations
- **The secret comes from a Pollinations LLM** — `POST https://gen.pollinations.ai/v1/chat/completions`, model `deepseek/deepseek-v4-flash`. `PolliClient.writeSecret(topic)` asks the model for one concealable sentence; the LLM is what produces the hidden payload.
- **The cover comes from a Pollinations image model** — `POST https://gen.pollinations.ai/v1/images/generations`, model `flux`. `PolliClient.drawCover(prompt)`.
- Both live in the root-level [`pollinations-client.js`](./pollinations-client.js).

## BYOP — scoped authorization, no pasted secrets
The app ships the official widget:

```html
<polli-connect app-key="pk_…" budget="5" expiry="7" models="text,image"></polli-connect>
```

Visitors approve a **scoped key** (5 Pollen, 7 days, text + image only) on the Pollinations consent screen. Every LLM and image call bills **their own** Pollen, and they can revoke the key any time from their Keys page.

## How hiding works
1. The LLM sentence is encoded as `HINK` + a 4-byte length + UTF-8 payload.
2. Those bits are written into the least-significant bits of the cover image's RGB channels — 1 to 4 bits per channel, chosen by the depth slider. Deeper embedding gives more capacity and slightly more tolerance to pixel noise, but **the message only survives lossless formats**: share the PNG as-is. Any lossy re-encode (JPEG, WebP lossy, a screenshot of the image, a chat app that recompresses) rewrites the low bits and destroys the payload. This is a property of LSB steganography, not a bug.
3. Extraction reads the LSBs back, checks the `HINK` magic marker, and decodes the payload at whichever strength matches.
4. Export is always lossless PNG (`canvas.toDataURL('image/png')`).
5. Capacity is `width × height × 3 × bitsPerChannel` bits — a 512×512 cover fits ~96 KB at strength 1.

## Run
Open the live app, or `python3 -m http.server` locally. Everything else is client-side.

Quest: #18367
