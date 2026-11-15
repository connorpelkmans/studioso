# Reel audio kit (owned, no licensing issues)

Music generated with vidIQ (royalty-free, Nov 2026). Sound effects are synthesised by `.claude/skills/studyboard-reels/scripts/make_sfx.sh`.

| File | Mood | Useful sections (seconds into the file) |
|---|---|---|
| `dramatic.wav` (164 s) | Ominous, comedic orchestral meme | **Hits exactly every 2.0 s from 33.0 to 49.0**, each preceded by near-silence. Start at 32.4 for hits at 0.6, 2.6, 4.6, 6.6 in the reel (an 8.0 s reel loops on the beat). Start at 33.0 for a hit on frame 0. Also: tension 10.8–12.5, hit at 13.0 |
| `lofi.wav` (162 s) | Warm, hopeful lo-fi, ~92 bpm | Filtered, quiet intro 0–21 s; **full beat drops at 21.0**. Start the file at 21.0 at the payoff moment |
| `quirky.wav` (65 s) | Playful pizzicato sitcom, ~100 bpm | Steady from 0; livelier from 24 s. For comedic, animated reels |
| `thud.wav` | Deep impact | Exam cards landing, a head hitting books |
| `whoosh.wav` | Air swell | Cuts and scene changes (vol 0.4–0.6) |
| `pop.wav` | UI blip | Taps, button presses, badge changes |
| `tick.wav` | Click | Typing, list items |
| `ding.wav` | Two-note chime | The payoff or the win |
| `alarm.wav` | Phone-style double beep | Alarms, wake-ups |

Mix with `mix_audio.py` (it normalises to about -14 LUFS, the platforms' playback loudness).
