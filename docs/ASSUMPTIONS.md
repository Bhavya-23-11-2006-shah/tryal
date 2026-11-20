# SaathiBus Verified Facts & Technical Assumptions (ASSUMPTIONS.md)

Documenting verified architectural specifications, browser API capabilities, SDK behaviors, and hardware dependencies.

## 1. Verified Official Technical Facts

### A. Gemini SDK & Model Selection
- **Official SDK**: `@google/genai` (v3.6.1+).
- **Initialization**: `new GoogleGenAI({ apiKey })`.
- **Inference Method**: `client.models.generateContent({ model, contents, config: { systemInstruction, responseMimeType: 'application/json' } })`.
- **Default Recommended Model**: `gemini-2.5-flash` (fast, low-latency, structured JSON output for agentic workflows) with fallback to `gemini-2.0-flash`.
- **Resilience Standard**: If Gemini API is unreachable, quota is exhausted, or network is down, the system immediately cascades to the zero-dependency deterministic rule-based assistant without throwing unhandled exceptions.

### B. Web Speech API (Speech Recognition)
- **Engine**: `window.SpeechRecognition || window.webkitSpeechRecognition`.
- **Browser Support**:
  - Chrome / Chromium (Desktop & Mobile): **Supported** (requires microphone user permission prompt).
  - Microsoft Edge: **Supported**.
  - Mozilla Firefox: Disabled by default behind `media.webspeech.recognition.enable`.
  - Apple Safari (iOS / macOS): SpeechRecognition available in modern Safari (iOS 14.5+); requires secure context (`https://` or `localhost`).
- **Graceful Fallback**: If `SpeechRecognition` is absent or permission is denied, SaathiBus seamlessly routes user queries through visual text dialog / keyboard Spacebar prompt with zero disruption.

### C. Web Speech API (Speech Synthesis)
- **Engine**: `window.speechSynthesis` and `SpeechSynthesisUtterance`.
- **Browser Support**: Universal across all modern browsers (Chrome, Firefox, Safari, Edge).
- **Supported Accents**: `hi-IN` (Hindi - India), `bn-IN` (Bengali - India), `en-IN` (Indian English).
- **Fallback**: Screen readers automatically parse the persistent live caption container (`role="status" aria-live="polite"`).

---

## 2. Assumptions & Human Hardware Verification Constraints

The following items cannot be fully verified inside a virtual container sandbox and require real physical execution (see Human TODO in `RELEASE_REPORT.md`):

1. **Physical Microphone Hardware Quality**:
   - Noise cancellation performance in noisy Kolkata bus depots (ambient bus horns, crowd noise).
   - Real-world mic gain and audio clipping on varied budget Android handsets.
2. **Cellular Network Intermittency**:
   - Web Speech API cloud recognition latency during transit through low-connectivity zones or subway tunnels.
3. **Physical Conductor Hardware**:
   - Conductor console haptic feedback vibration strength on handheld ruggedized POS terminals.
