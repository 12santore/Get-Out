import { Category } from "@/lib/types";

export function CategoryChip({ value, selected, onClick }: { value: Category; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={selected ? "chip-pill chip-pill-active" : "chip-pill"}>
      {value}
    </button>
  );
}
