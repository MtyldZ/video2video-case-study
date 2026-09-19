# API reference

Part of the [Video to Video README](../README.md). See [Webhook and async processing](../README.md#webhook-and-async-processing) for how these endpoints work together.

`upload`, `transform`, `history` and `credits` return JSON, with errors as `{ "error": "<user-facing message>" }`. The webhook, called only by Magic Hour, replies with a status code and plain text.

## `POST /api/upload`
Copies a video already uploaded to Uploadcare into Cloudinary.

```json
// request
{ "uploadcareUrl": "https://<prefix>.ucarecd.net/<uuid>/" }
// 200
{ "url": "https://res.cloudinary.com/…/video2video/sources/<id>.mp4", "publicId": "video2video/sources/<id>",
  "duration": 13.4, "width": 854, "height": 480, "bytes": 9094354, "frameRate": 29.97 }
```
Errors: `400` invalid or non-Uploadcare URL, or unreachable file · `413` over 100 MB · `415` not MP4/MOV · `502` Cloudinary failure.

## `POST /api/transform`
Starts a Magic Hour job. `params` mirrors Magic Hour's request body, so every model option is supported.

```json
// request
{
  "source": { "url": "https://res.cloudinary.com/<cloud>/video/upload/…", "publicId": "video2video/sources/<id>" },
  "params": {
    "name": "Skate park",                       // optional
    "start_seconds": 0, "end_seconds": 3,       // end > start, within the video
    "fps_resolution": "HALF",                   // HALF | FULL
    "style": {
      "art_style": "Pixar",                     // one of 75 styles
      "model": "default",                       // default | Dreamshaper | Absolute Reality | Flat 2D Anime | Soft Anime | Kaywaii | Western Anime | 3D Anime
      "version": "default",                     // default | v1 | v2
      "prompt_type": "default",                 // default | custom | append_default
      "prompt": "…"                             // required unless prompt_type is default
    }
  }
}
// 202
{ "id": "<record id>", "status": "processing" }
```
Errors: `400` invalid parameters, a source from another Cloudinary account, or Magic Hour rejected the parameters · `402` not enough Magic Hour credits · `429` rate limited · `500` Magic Hour key misconfigured · `502` Magic Hour unavailable · `503` database unavailable.

## `POST /api/webhook`
Magic Hour's callback. Requires the `magic-hour-event-signature` and `magic-hour-event-timestamp` headers.
Responses: `204` handled or ignored · `401` bad signature or stale timestamp · `400` malformed body · `404` unknown job (retried) · `500` processing failed or secret not configured (retried).

## `GET /api/credits`
The Magic Hour account's remaining credits (shared by everyone using the app).

```json
{ "credits": 510 }
```
Errors: `502` Magic Hour unavailable.

## `GET /api/history`
The current browser's 50 most recent transformations, newest first. Also runs the [fallback polling](../README.md#fallback-polling).

```json
{ "items": [ { "_id": "…", "status": "complete", "sourceUrl": "…", "resultUrl": "…", "params": { … },
               "mhJobId": "…", "creditsCharged": 30, "error": null, "createdAt": "…", "updatedAt": "…" } ] }
```
Errors: `503` database unavailable.
