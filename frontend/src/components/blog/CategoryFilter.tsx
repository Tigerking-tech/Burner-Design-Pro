interface CategoryFilterProps {
  categories: { name: string; count: number }[];
  selectedCategory?: string | null;
  selected?: string | null;
  onSelect: (name: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, selected, onSelect }: CategoryFilterProps) {
  const activeSelected = selectedCategory !== undefined ? selectedCategory : selected;
  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);
  const isAllSelected = activeSelected === null;

  const allItems = [{ name: 'All', count: totalCount }, ...categories];

  return (
    <div className="flex flex-wrap sm:flex-nowrap gap-2 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
      {allItems.map((item) => {
        const isSelected = item.name === 'All' ? isAllSelected : activeSelected === item.name;

        return (
          <button
            key={item.name}
            onClick={() => onSelect(item.name === 'All' ? null : item.name)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
              isSelected
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{item.name}</span>
            <span
              className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-2 text-xs font-semibold rounded-full ${
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-white/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
              }`}
            >
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default CategoryFilter;
