import { Search, X } from 'lucide-react';

interface BlogSearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

export function BlogSearchBar({ value, onChange }: BlogSearchBarProps) {
  return (
    <div className="relative w-full max-w-xl">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Search size={18} className="text-slate-400 dark:text-slate-500" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search articles, topics, keywords..."
        className="w-full pl-12 pr-12 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 flex items-center justify-center pr-3 pl-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors z-10 cursor-pointer"
          aria-label="Clear search"
        >
          <span className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} />
          </span>
        </button>
      )}
    </div>
  );
}

export default BlogSearchBar;
