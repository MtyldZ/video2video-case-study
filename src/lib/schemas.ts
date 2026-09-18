import { z } from "zod";

// Enums copied from the Magic Hour OpenAPI spec (POST /v1/video-to-video).
export const ART_STYLES = [
  "3D Render", "Airbender", "Android", "Anime Warrior", "Armored Knight",
  "Assassin's Creed", "Avatar", "Black Spiderman", "Boba Fett", "Bold Anime",
  "Celestial Skin", "Chinese Swordsmen", "Clay", "Comic", "Cyberpunk", "Cypher",
  "Dark Fantasy", "Dragonball Z", "Future Bot", "Futuristic Fantasy", "GTA",
  "Ghibli Anime", "Ghost", "Gundam", "Hologram", "Illustration", "Impressionism",
  "Ink", "Ink Poster", "Jinx", "Knight", "Lego", "Link", "Marble", "Mario",
  "Master Chief", "Mech", "Minecraft", "Mystique", "Naruto", "Neon Dream",
  "No Art Style", "Oil Painting", "On Fire", "Origami", "Painterly Anime",
  "Pixar", "Pixel", "Power Armor", "Power Ranger", "Radiant Anime",
  "Realistic Anime", "Realistic Pixar", "Retro Anime", "Retro Sci-Fi", "Samurai",
  "Samurai Bot", "Sharp Anime", "Soft Anime", "Solid Snake", "Spartan",
  "Starfield", "Street Fighter", "Studio Ghibli", "Sub-Zero", "The Void",
  "Tomb Raider", "Underwater", "Van Gogh", "Viking", "Watercolor",
  "Western Anime", "Wu Kong", "Wuxia Anime", "Zelda",
] as const;

export const MODELS = [
  "default", "Dreamshaper", "Absolute Reality", "Flat 2D Anime", "Soft Anime",
  "Kaywaii", "Western Anime", "3D Anime",
] as const;

export const VERSIONS = ["default", "v1", "v2"] as const;
export const PROMPT_TYPES = ["default", "custom", "append_default"] as const;
export const FPS_RESOLUTIONS = ["HALF", "FULL"] as const;

// Mirrors the Magic Hour request body (minus `assets`, which the server fills
// with the Cloudinary URL), so it can be forwarded as-is.
export const transformParamsSchema = z
  .object({
    name: z.string().trim().max(100).optional(),
    start_seconds: z.number().min(0),
    end_seconds: z.number().min(0.1),
    fps_resolution: z.enum(FPS_RESOLUTIONS).default("HALF"),
    style: z.object({
      art_style: z.enum(ART_STYLES),
      version: z.enum(VERSIONS).default("default"),
      model: z.enum(MODELS).default("default"),
      prompt_type: z.enum(PROMPT_TYPES).default("default"),
      prompt: z.string().trim().max(1000).optional(),
    }),
  })
  .refine((p) => p.end_seconds > p.start_seconds, {
    message: "End time must be after start time",
    path: ["end_seconds"],
  })
  .refine((p) => p.style.prompt_type === "default" || !!p.style.prompt, {
    message: "Prompt is required for custom prompt types",
    path: ["style", "prompt"],
  });

export type TransformParams = z.infer<typeof transformParamsSchema>;

export const STATUSES = ["pending", "processing", "complete", "failed", "timed_out"] as const;
export type TransformStatus = (typeof STATUSES)[number];

// Shape of a `transformations` document (also returned by /api/history).
export interface Transformation {
  _id: string;
  uid: string;
  status: TransformStatus;
  sourceUrl: string;
  sourcePublicId: string;
  params: TransformParams;
  mhJobId?: string;
  creditsCharged?: number;
  resultUrl?: string;
  resultPublicId?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
