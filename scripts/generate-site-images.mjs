import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const publicDir = path.join(process.cwd(), "public");
const outputRoot = path.join(publicDir, "images/_generated/site");
const generatorMtime = (await fs.stat(fileURLToPath(import.meta.url))).mtimeMs;

const variants = [
  {
    source: path.join(publicDir, "images/audiofool-portrait.jpg"),
    // Grayscale subject matte with feathered edges, applied as the alpha channel.
    alpha: path.join(publicDir, "images/audiofool-portrait-matte.png"),
    name: "audiofool-portrait",
    widths: [320, 480, 640, 960, 1280],
    quality: 74,
    formats: { webp: 74, avif: 60 },
  },
  {
    // Light-theme homepage portrait: a film frame shown with its rebate intact.
    source: path.join(publicDir, "images/audiofool-film-portrait.jpg"),
    name: "audiofool-film-portrait",
    widths: [320, 480, 640, 960, 1280],
    quality: 78,
    formats: { webp: 78, avif: 62 },
  },
  {
    source: path.join(publicDir, "muse/muse.png"),
    outputDir: path.join(publicDir, "muse/_generated"),
    name: "muse-logo",
    widths: [240],
    quality: 82,
  },
  {
    source: path.join(publicDir, "muse/pipeline.png"),
    outputDir: path.join(publicDir, "muse/_generated"),
    name: "pipeline",
    widths: [720, 1200],
    quality: 78,
  },
  {
    source: path.join(publicDir, "muse/2D Density Heatmap.png"),
    outputDir: path.join(publicDir, "muse/_generated"),
    name: "latent-density",
    widths: [480, 800],
    quality: 78,
  },
];

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function isFresh(inputPaths, outputPath) {
  try {
    const [outputStat, ...inputStats] = await Promise.all(
      [outputPath, ...inputPaths].map((file) => fs.stat(file)),
    );
    const newestInput = Math.max(generatorMtime, ...inputStats.map((stat) => stat.mtimeMs));
    return outputStat.mtimeMs >= newestInput;
  } catch {
    return false;
  }
}

async function generateVariant({ source, alpha, outputDir, name }, width, format, quality) {
  const inputs = alpha ? [source, alpha] : [source];
  for (const input of inputs) {
    if (!(await exists(input))) {
      throw new Error(`Missing source image: ${input}`);
    }
  }

  const outputPath = path.join(outputDir || outputRoot, `${name}-${width}.${format}`);
  if (await isFresh(inputs, outputPath)) return false;

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  let image = sharp(source).rotate().resize({ width, withoutEnlargement: true });
  if (alpha) {
    const { info } = await image.clone().raw().toBuffer({ resolveWithObject: true });
    const matte = await sharp(alpha)
      .resize(info.width, info.height, { fit: "fill" })
      .toColourspace("b-w")
      .toBuffer();
    image = sharp(await image.removeAlpha().toBuffer()).joinChannel(matte);
  }
  await image.toFormat(format, { quality, effort: 4 }).toFile(outputPath);
  return true;
}

async function main() {
  let written = 0;
  for (const variant of variants) {
    for (const width of variant.widths) {
      for (const [format, quality] of Object.entries(variant.formats ?? { webp: variant.quality })) {
        if (await generateVariant(variant, width, format, quality)) written += 1;
      }
    }
  }

  console.log(`[site-images] ${written} generated variant(s) updated`);
}

main().catch((error) => {
  console.error("[site-images] failed", error);
  process.exit(1);
});
