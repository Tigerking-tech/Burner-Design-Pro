export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: string;
  coverImage?: string;
  author: string;
  readingTime: string;
  content: string;
  excerpt: string;
  keywords?: string;
}

const markdownFiles = import.meta.glob('../content/blog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export function parseFrontmatter(rawContent: string): {
  frontmatter: Record<string, any>;
  content: string;
} {
  const frontmatter: Record<string, any> = {};
  let content = rawContent;

  const match = rawContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);

  if (match) {
    const rawFm = match[1];
    content = rawContent.slice(match[0].length);

    const lines = rawFm.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;

      const key = trimmed.slice(0, colonIndex).trim();
      let value = trimmed.slice(colonIndex + 1).trim();

      if (!key) continue;

      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
        frontmatter[key] = value;
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
        frontmatter[key] = value;
      } else if (value.includes(',') && !value.startsWith('[') && !value.startsWith('{')) {
        const parts = value.split(',').map((p) => {
          let part = p.trim();
          if (part.startsWith('"') && part.endsWith('"')) part = part.slice(1, -1);
          else if (part.startsWith("'") && part.endsWith("'")) part = part.slice(1, -1);
          return part;
        }).filter((p) => p.length > 0);
        frontmatter[key] = parts;
      } else if (value.startsWith('[') && value.endsWith(']')) {
        const inner = value.slice(1, -1).trim();
        if (inner.length === 0) {
          frontmatter[key] = [];
        } else {
          const parts = inner.split(',').map((p) => {
            let part = p.trim();
            if (part.startsWith('"') && part.endsWith('"')) part = part.slice(1, -1);
            else if (part.startsWith("'") && part.endsWith("'")) part = part.slice(1, -1);
            return part;
          }).filter((p) => p.length > 0);
          frontmatter[key] = parts;
        }
      } else if (value === 'true' || value === 'false') {
        frontmatter[key] = value === 'true';
      } else if (value === '' || value === 'null' || value === 'undefined') {
        frontmatter[key] = null;
      } else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        frontmatter[key] = value;
      } else if (/^-?\d+(\.\d+)?$/.test(value)) {
        frontmatter[key] = Number(value);
      } else {
        frontmatter[key] = value;
      }
    }
  }

  return { frontmatter, content };
}

function generateExcerpt(markdownContent: string, maxLength: number = 160): string {
  let text = markdownContent;
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/`[^`]*`/g, ' ');
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');
  text = text.replace(/^\s*>\s+/gm, '');
  text = text.replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/\s+/g, ' ');
  text = text.trim();

  if (text.length <= maxLength) return text;

  let truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0) {
    truncated = truncated.slice(0, lastSpace);
  }

  return truncated + '...';
}

function calculateReadingTime(content: string): string {
  const plainText = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_\-~`]/g, ' ');
  const words = plainText.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function extractSlugFromPath(filePath: string): string {
  const start = filePath.lastIndexOf('/') + 1;
  const end = filePath.lastIndexOf('.md');
  return filePath.slice(start, end !== -1 ? end : filePath.length);
}

function buildPosts(): BlogPost[] {
  const posts: BlogPost[] = [];

  for (const [filePath, rawContent] of Object.entries(markdownFiles)) {
    const { frontmatter, content } = parseFrontmatter(rawContent);
    const slug = extractSlugFromPath(filePath);

    const title = typeof frontmatter.title === 'string' ? frontmatter.title : slug;
    const description = typeof frontmatter.description === 'string' ? frontmatter.description : '';
    const date = typeof frontmatter.date === 'string' ? frontmatter.date : new Date().toISOString().slice(0, 10);

    let tags: string[] = [];
    if (Array.isArray(frontmatter.tags)) {
      tags = frontmatter.tags.map((t: any) => String(t));
    } else if (typeof frontmatter.tags === 'string') {
      tags = frontmatter.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
    }

    let category = typeof frontmatter.category === 'string' ? frontmatter.category : '';

    const coverImage = typeof frontmatter.coverImage === 'string' ? frontmatter.coverImage : undefined;
    const author = typeof frontmatter.author === 'string' ? frontmatter.author : 'BurnerDesignPro Team';
    const keywords = typeof frontmatter.keywords === 'string' ? frontmatter.keywords : undefined;

    const readingTime = calculateReadingTime(content);
    const excerpt = generateExcerpt(content, 160);

    posts.push({
      slug,
      title,
      description,
      date,
      tags,
      category,
      coverImage,
      author,
      readingTime,
      content,
      excerpt,
      keywords,
    });
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const allPostsCache: BlogPost[] = buildPosts();

export function getAllPosts(): BlogPost[] {
  return allPostsCache;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return allPostsCache.find((post) => post.slug === slug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return allPostsCache.filter((post) => post.category === category);
}

export function getAllCategories(): { name: string; count: number }[] {
  const categoryMap = new Map<string, number>();
  for (const post of allPostsCache) {
    if (!post.category) continue;
    const current = categoryMap.get(post.category) ?? 0;
    categoryMap.set(post.category, current + 1);
  }
  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAllTags(): { name: string; count: number }[] {
  const tagMap = new Map<string, number>();
  for (const post of allPostsCache) {
    for (const tag of post.tags) {
      if (!tag) continue;
      const current = tagMap.get(tag) ?? 0;
      tagMap.set(tag, current + 1);
    }
  }
  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function searchPosts(query: string): BlogPost[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  return allPostsCache.filter((post) => {
    if (post.title.toLowerCase().includes(trimmed)) return true;
    if (post.description.toLowerCase().includes(trimmed)) return true;
    if (post.excerpt.toLowerCase().includes(trimmed)) return true;
    if (post.content.toLowerCase().includes(trimmed)) return true;
    if (post.category.toLowerCase().includes(trimmed)) return true;
    if (post.keywords && post.keywords.toLowerCase().includes(trimmed)) return true;
    for (const tag of post.tags) {
      if (tag.toLowerCase().includes(trimmed)) return true;
    }
    return false;
  });
}
