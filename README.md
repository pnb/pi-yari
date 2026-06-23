# YARI: Yet Another Repetition Intervention

YARI is a [pi](https://github.com/earendil-works/pi) extension that detects when the agent might be stuck looping, and intervenes. Other extensions do this but I found them to be overly complicated for my use case. This one does only two things:

- Loop detection: If the same tool is called with identical arguments `threshold` times in a row (default 3), it sends a warning message.
- Thinking cap: If reasoning (thinking) output exceeds `thinkingMaxChars` between tool calls, it interrupts and sends a warning.

YARI is intended to be short (<100 lines of code right now) so that you can easily see what it does. It also supports customizable messages (one will be randomly chosen) so that you can avoid repetition in the warnings themselves, and have a bit of fun with it.

## Config options

YARI will look for a project `.pi/extensions/pi-yari.json` configuration first, or `~/.pi/agent/extensions/pi-yari.json` if that doesn't exist. The config file is optional and all keys are optional. These are the defaults:

```json
{
  "threshold": 3,            // tool calls before warning
  "thinkingMaxChars": 25000, // interrupt thinking at this length
  "messages": [              // custom warning messages (randomly picked)
    "Repetition warning: It seems like you might be stuck in a loop.",
    "Are you stuck? Maybe try a different approach."
  ]
}
```

## Install

Place `pi-yari.ts` (and optionally `pi-yari.json`) in one of pi's extension directories:

- **Project-local:** `.pi/extensions/`
- **Global:** `~/.pi/agent/extensions/`

Reload with `/reload`.
