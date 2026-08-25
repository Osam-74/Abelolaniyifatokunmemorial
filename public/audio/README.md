# Background music

Drop an audio file in this folder. Any name works — the build picks up
whatever is here, so you do not have to match a particular filename.

Supported: .mp3, .m4a, .aac, .ogg, .wav, .flac

## Important: how you upload matters

Do NOT rename or add audio through GitHub's web editor. It opens files as
text, and saving replaces the audio with a couple of bytes. A 9 MB track
becomes a 2-byte file that looks fine in the file list and plays nothing.

Use one of these instead:

- GitHub web: "Add file" -> "Upload files", then drag the file in. Never the
  pencil/edit icon, and never the rename field on an existing binary.
- Git: `git add public/audio/track.mp3 && git commit && git push`
- The admin dashboard: Website settings -> Background music -> upload.

The build checks every file here. Anything under 20 KB is reported as broken
in the build log and flagged on the admin Overview page.

## Licensing

Use music you have the right to use: a licensed track, a recording made by
the family, or something released under a permissive licence. Do not upload a
commercial recording you do not have permission for.
