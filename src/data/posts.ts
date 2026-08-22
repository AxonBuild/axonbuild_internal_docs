export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
};

export const posts: PostMeta[] = [
  {
    slug: "voicebox-runpod",
    title: "Deploying Voicebox on RunPod",
    date: "2026-08-22",
    description: "A persistent, restart-safe, and password-protected GPU deployment.",
  },
  {
    slug: "team-sops-current",
    title: "Team SOPs",
    date: "2026-08-19",
    description: "The current operating procedures for every project.",
  },
  {
    slug: "technical-guidance-claude",
    title: "Technical guidance — CLAUDE.md",
    date: "2026-08-19",
    description: "A short CLAUDE.md template for maintainable, secure project work.",
  },
  {
    slug: "team-sops",
    title: "Team SOPs (Obsolete)",
    date: "2026-04-08",
    description: "Archived SOPs. Use the current Team SOPs instead.",
  },
  {
    slug: "welcome",
    title: "Using this handbook",
    date: "2026-04-08",
    description: "How to add posts, images, and deploy this site.",
  },
  {
    slug: "code-quality",
    title: "Technical guidance & code quality (Obsolete)",
    date: "2025-06-03",
    description: "Archived guidance. Use Technical guidance — CLAUDE.md instead.",
  },
].sort((a, b) => (a.date < b.date ? 1 : -1));

export function getPost(slug: string | undefined): PostMeta | undefined {
  if (!slug) return undefined;
  return posts.find((p) => p.slug === slug);
}
