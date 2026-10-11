import botanical from "@/assets/art-botanical.jpg";
import marbled from "@/assets/art-marbled.jpg";
import floral from "@/assets/art-floral.jpg";
import abstract from "@/assets/art-abstract.jpg";
import ocean from "@/assets/art-ocean.jpg";
import watercolor from "@/assets/art-watercolor.jpg";
import nouveau from "@/assets/art-nouveau.jpg";
import type { Prompt } from "./journal";

/** Arcade print-pattern style. modelId stays null until real IDs are supplied by the backend. */
export interface PatternStyle {
  name: string;
  modelId: string | null;
}

export const ALL_STYLES: string[] = [
  "Indonesian Batik", "East Asian", "Arts and Crafts Floral", "Archival British Floral",
  "Archival French Floral", "Archival Hand Marbled", "Ukrainian Folk Art", "French Floral Wallpaper",
  "Art Nouveau", "Japanese Botanical", "Japanese Woodblock", "French Neoclassical", "Indian Textiles",
  "American Aesthetic Movement", "Gilded Age Frieze", "Gilded Age", "Austrian Biedermeier",
  "Estonian Watercolor", "Toile", "Impressionism", "Nonpareil Hand Marbled", "French Rococo",
  "European Tapestry", "Italian Silk", "Meiji Period", "Mughal Watercolor",
];

export const CURATED_STYLES = [
  "Japanese Botanical", "Archival Hand Marbled", "French Floral Wallpaper",
  "Estonian Watercolor", "Art Nouveau", "Japanese Woodblock",
];

export const DIRECTIONS = [
  { label: "Soft botanicals", style: "Japanese Botanical", prompt: "Delicate sage-green botanical leaves and small wildflowers on a warm ivory background. Soft, spacious, natural, and quietly hopeful." },
  { label: "Vintage florals", style: "French Floral Wallpaper", prompt: "Romantic vintage roses and trailing vines in dusty pink and sage on a soft cream ground, gentle and nostalgic." },
  { label: "Ocean-inspired", style: "Japanese Woodblock", prompt: "Calm rolling ocean waves in coastal blues and cream, rhythmic and steady like a slow breath." },
  { label: "Marbled paper", style: "Archival Hand Marbled", prompt: "Flowing hand-marbled paper swirls in dusty rose, terracotta and soft blue, organic and fluid." },
  { label: "Dreamy watercolor", style: "Estonian Watercolor", prompt: "A dreamy watercolor wash of lavender, peach and pale sage with tiny scattered gold stars." },
  { label: "Bold and expressive", style: "American Aesthetic Movement", prompt: "Bold, joyful organic shapes and arches in terracotta, mustard, sage and lavender on warm sand." },
];

export const PALETTES = [
  { name: "Sage and cream", colors: ["#F6F1E7", "#E4E7D5", "#B8C4A4", "#8A9C79", "#5E7356", "#3F5240", "#D9CBB0"] },
  { name: "Dusty rose", colors: ["#FBF2EE", "#F0D5CF", "#DDAFA6", "#C48A82", "#9E655F", "#6E4644", "#E9C9A9"] },
  { name: "Coastal blue", colors: ["#F4F3EE", "#D6E2E6", "#A9C3CD", "#6F98AB", "#3F6C86", "#22445E", "#E4D8C3"] },
  { name: "Warm earth", colors: ["#F7EEDF", "#EBCFA8", "#D9A46B", "#C17A45", "#94532F", "#5E3826", "#B9A07A"] },
  { name: "Lavender dusk", colors: ["#F6F2F7", "#E2D8E9", "#C3B2D4", "#9E8AB8", "#74668F", "#4C4566", "#F0D8C8"] },
  { name: "Forest green", colors: ["#F2EFE4", "#C9D3B9", "#93A684", "#5D7A58", "#3B5A3E", "#233A28", "#D8B76A"] },
];

/** Locally bundled mock artwork pool used by the mock Arcade adapter. */
export const ART_POOL = [
  { key: "botanical", src: botanical, tags: ["botanical", "leaf", "leaves", "sage", "wildflower", "green", "natural", "japanese botanical", "plant"] },
  { key: "marbled", src: marbled, tags: ["marble", "marbled", "swirl", "fluid", "rose", "hand marbled", "nonpareil", "paper"] },
  { key: "floral", src: floral, tags: ["floral", "rose", "roses", "vintage", "wallpaper", "pink", "french", "rococo", "toile", "biedermeier"] },
  { key: "abstract", src: abstract, tags: ["abstract", "bold", "shape", "shapes", "expressive", "mustard", "terracotta", "aesthetic", "modern"] },
  { key: "ocean", src: ocean, tags: ["ocean", "wave", "waves", "sea", "blue", "coastal", "woodblock", "meiji", "east asian"] },
  { key: "watercolor", src: watercolor, tags: ["watercolor", "dreamy", "lavender", "peach", "star", "stars", "impressionism", "soft", "estonian", "mughal"] },
  { key: "nouveau", src: nouveau, tags: ["nouveau", "fern", "lily", "forest", "ochre", "arts and crafts", "gilded", "tapestry", "batik", "indian"] },
] as const;

export const TITLE_SUGGESTIONS = [
  "Room to Grow", "A Softer Place to Land", "Little by Little", "Becoming", "Notes to Myself", "My Quiet Place",
];

export const LIBRARY_PROMPTS: Prompt[] = [
  { id: "lib-1", chapter: 1, title: "A Day in Full", body: "Choose an ordinary day from recent weeks and write about it from morning to night. Notice the moments of tension and ease, when you felt hungry or full, rested or depleted, and what each part of the day asked of you.", fromLibrary: true },
  { id: "lib-2", chapter: 1, title: "Weather Report", body: "If your inner world had weather today, what would it be? Describe it in detail, and explore what tends to shift your inner weather over the course of a week.", fromLibrary: true },
  { id: "lib-3", chapter: 2, title: "Comforts From Childhood", body: "Think back to the things that soothed you as a child — a place, a voice, a smell, a ritual. Write about what they gave you, and which of those feelings you still look for today.", fromLibrary: true },
  { id: "lib-4", chapter: 2, title: "A Soft Evening", body: "Describe what a genuinely restoring evening would look like for you, without any rules about what it should include. Explore what makes evenings like this easier or harder to create.", fromLibrary: true },
  { id: "lib-5", chapter: 3, title: "Words You Needed to Hear", body: "Write down the words you wish someone had said to you during a difficult time. Consider how it might feel to offer those words to yourself now.", fromLibrary: true },
  { id: "lib-6", chapter: 3, title: "Neutral Ground", body: "Reflect on a food you have strong feelings about. Explore where those feelings came from, and what it might be like to meet that food with curiosity rather than judgment.", fromLibrary: true },
  { id: "lib-7", chapter: 4, title: "Your Comfort Map", body: "Map out the people, places, activities, and small rituals that help you feel cared for. Notice which ones are close at hand and which ones you'd like to make more room for.", fromLibrary: true },
  { id: "lib-8", chapter: 4, title: "Gentle Transitions", body: "Explore the moment you arrive home after a long day. Write about what you carry through the door, and imagine a small ritual that could help you shift from doing into being.", fromLibrary: true },
  { id: "lib-9", chapter: 5, title: "Things I Know Now", body: "Make a list of the things you understand about yourself today that you didn't when you started. Choose one and write about how you came to know it.", fromLibrary: true },
  { id: "lib-10", chapter: 5, title: "Gratitude for Your Body", body: "Reflect on what your body has carried you through, during stressful times and calm ones. Write to your body as you might to a friend who has stayed by your side.", fromLibrary: true },
];

export interface DecorativeSticker {
  id: string;
  name: string;
  category: "Flowers and plants" | "Stars and celestial" | "Hearts" | "Little objects" | "Abstract shapes" | "Gentle words";
  svg: string;
}

const w = (body: string, vb = "0 0 100 100") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`;

/** Artwork assets — hard-coded fills here are illustration content, not UI theme colors. */
export const DECORATIVE_STICKERS: DecorativeSticker[] = [
  { id: "sprig", name: "Olive sprig", category: "Flowers and plants", svg: w(`<path d="M50 95 C50 60 52 30 60 8" stroke="#5E7356" stroke-width="3" fill="none" stroke-linecap="round"/>${[20, 35, 50, 65, 80].map((y, i) => `<ellipse cx="${i % 2 ? 62 : 40}" cy="${y}" rx="11" ry="5" fill="${i % 2 ? "#8A9C79" : "#A9B892"}" transform="rotate(${i % 2 ? -35 : 35} ${i % 2 ? 62 : 40} ${y})"/>`).join("")}`) },
  { id: "daisy", name: "Daisy", category: "Flowers and plants", svg: w(`${Array.from({ length: 10 }, (_, i) => `<ellipse cx="50" cy="24" rx="8" ry="20" fill="#FBF6EC" stroke="#E3D6BE" stroke-width="1.5" transform="rotate(${i * 36} 50 50)"/>`).join("")}<circle cx="50" cy="50" r="11" fill="#E0B455"/>`) },
  { id: "tulip", name: "Tulip", category: "Flowers and plants", svg: w(`<path d="M50 95 V50" stroke="#5E7356" stroke-width="3"/><path d="M50 80 C35 70 30 60 32 55 C42 60 48 68 50 80Z" fill="#8A9C79"/><path d="M30 25 C30 45 38 55 50 55 C62 55 70 45 70 25 L60 35 L50 18 L40 35Z" fill="#DDAFA6"/>`) },
  { id: "star", name: "Soft star", category: "Stars and celestial", svg: w(`<path d="M50 8 L58 40 L92 50 L58 60 L50 92 L42 60 L8 50 L42 40Z" fill="#D8B76A"/>`) },
  { id: "moon", name: "Crescent moon", category: "Stars and celestial", svg: w(`<path d="M62 10 A42 42 0 1 0 90 70 A34 34 0 1 1 62 10Z" fill="#E9D7A8"/>`) },
  { id: "sparkles", name: "Sparkles", category: "Stars and celestial", svg: w(`<path d="M35 15 L40 35 L60 40 L40 45 L35 65 L30 45 L10 40 L30 35Z" fill="#C3B2D4"/><path d="M72 50 L75 63 L88 66 L75 69 L72 82 L69 69 L56 66 L69 63Z" fill="#D8B76A"/>`) },
  { id: "heart", name: "Heart", category: "Hearts", svg: w(`<path d="M50 88 C20 65 8 48 8 32 C8 18 19 10 30 10 C40 10 46 16 50 24 C54 16 60 10 70 10 C81 10 92 18 92 32 C92 48 80 65 50 88Z" fill="#C48A82"/>`) },
  { id: "heart-line", name: "Drawn heart", category: "Hearts", svg: w(`<path d="M50 85 C22 64 12 48 12 34 C12 22 21 14 31 14 C40 14 46 20 50 28 C54 20 60 14 69 14 C79 14 88 22 88 34 C88 48 78 64 50 85Z" fill="none" stroke="#9E655F" stroke-width="4" stroke-linecap="round"/>`) },
  { id: "teacup", name: "Teacup", category: "Little objects", svg: w(`<path d="M20 40 H72 V58 C72 74 60 84 46 84 C32 84 20 74 20 58Z" fill="#F0D5CF"/><path d="M72 46 C88 46 88 66 72 64" fill="none" stroke="#DDAFA6" stroke-width="5"/><path d="M38 30 C34 22 42 18 38 10 M52 30 C48 22 56 18 52 10" stroke="#B8C4A4" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="46" cy="88" rx="32" ry="4" fill="#DDAFA6"/>`) },
  { id: "candle", name: "Candle", category: "Little objects", svg: w(`<rect x="38" y="40" width="24" height="50" rx="4" fill="#F6F1E7" stroke="#D9CBB0" stroke-width="2"/><path d="M50 12 C58 24 58 32 50 36 C42 32 42 24 50 12Z" fill="#E0B455"/>`) },
  { id: "blob", name: "Soft shape", category: "Abstract shapes", svg: w(`<path d="M20 30 C30 5 75 8 85 30 C95 55 80 90 50 88 C20 86 8 55 20 30Z" fill="#B8C4A4"/>`) },
  { id: "arch", name: "Arch", category: "Abstract shapes", svg: w(`<path d="M15 90 V50 A35 35 0 0 1 85 50 V90 H68 V50 A18 18 0 0 0 32 50 V90Z" fill="#D9A46B"/>`) },
  { id: "word-gently", name: "gently", category: "Gentle words", svg: w(`<text x="100" y="58" text-anchor="middle" font-family="Caveat, cursive" font-size="54" fill="#5E7356">gently</text>`, "0 0 200 80") },
  { id: "word-breathe", name: "breathe", category: "Gentle words", svg: w(`<text x="100" y="58" text-anchor="middle" font-family="Caveat, cursive" font-size="54" fill="#9E655F">breathe</text>`, "0 0 200 80") },
  { id: "word-enough", name: "you are enough", category: "Gentle words", svg: w(`<text x="150" y="56" text-anchor="middle" font-family="Caveat, cursive" font-size="50" fill="#74668F">you are enough</text>`, "0 0 300 80") },
];

export const svgToDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
