# Discipline vs Motivation (25 s short)

Made with the cartoon-3d-short skill pipeline (three.js inside Remotion): flat cartoon characters in a 3D toon world.
Final video: `../../videos/discipline_vs_motivation_1080.mp4`.

- `src/videos/climb/`: story.ts (timeline, cameras, DOF), world.ts (hill, path, village, rain), cast.ts (Max, Sam, the star),
  plus the skill's look modules (toon, shade, cardshade, ink, lensblur, grade, lights, paint, build).
- `voice/`: ElevenLabs narration (Brian) + word timings.
- `audio/build.py`: original score + SFX, ducked under the voice, -14 LUFS -> `audio/mix.wav`.

Render (needs `npm i`, Chromium, ffmpeg):
```
./render_part.sh 0 749 all          # jpeg frames into out/frames (720x1280; drop --scale/--props dpr for full size on a GPU)
cd audio && python3 build.py
ffmpeg -framerate 30 -i out/frames/element-%03d.jpeg -i audio/mix.wav -map 0:v -map 1:a -vf scale=1080:1920:flags=lanczos,format=yuv420p -c:v libx264 -crf 17 -c:a aac -shortest out.mp4
```
