export interface CategoryFilterProps {
  readonly categories: readonly string[];
  readonly selectedCategory: string;
  readonly onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 shrink-0">
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`whitespace-nowrap px-6 py-2 rounded-full font-bold text-[14px] transition-all duration-200 active:scale-95 cursor-pointer border ${
              isSelected
                ? 'bg-[#805062] text-white border-transparent shadow-sm'
                : 'bg-[#E0F7FA] text-[#37697d] border-outline-warm/30 hover:bg-[#E0F7FA]/80'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
