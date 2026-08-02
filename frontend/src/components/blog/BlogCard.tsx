import { Link } from 'react-router-dom';
import { Clock, Calendar, User } from 'lucide-react';
import type { BlogPost } from '../../data/blogData';
import { TagPill } from './TagPill';

interface BlogCardProps {
  post: BlogPost;
}

const categoryColorMap: Record<string, { bg: string; text: string }> = {
  'Combustion Engineering': {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
  },
  'Emissions': {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  'Thermal Design': {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  'Industry Insights': {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
  },
  'Tutorials': {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
};

const defaultCategoryColors = {
  bg: 'bg-slate-100 dark:bg-slate-800',
  text: 'text-slate-600 dark:text-slate-300',
};

function getCategoryColors(category: string) {
  return categoryColorMap[category] ?? defaultCategoryColors;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function BlogCard({ post }: BlogCardProps) {
  const categoryColors = getCategoryColors(post.category);

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 hover:border-slate-300 dark:hover:border-slate-700"
    >
      <div className="p-6 md:p-7">
        <div className="flex items-start justify-between mb-4 gap-3">
          {post.category && (
            <span
              className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${categoryColors.bg} ${categoryColors.text}`}
            >
              {post.category}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 flex-shrink-0">
            <Clock size={14} />
            {post.readingTime}
          </span>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight tracking-tight">
          {post.title}
        </h3>

        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-4 line-clamp-2">
          {post.description || post.excerpt}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} />
            {formatDate(post.date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <User size={14} />
            {post.author}
          </span>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 4).map((tag) => (
              <TagPill key={tag} label={tag} color="slate" />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default BlogCard;
