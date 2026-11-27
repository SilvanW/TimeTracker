import { useId } from "react";

type ProjectFilterProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
};

// Text filter with a red clear-× — shared by every filter input.
export function ProjectFilter({
  value,
  onChange,
  label,
  placeholder = "(all)",
}: ProjectFilterProps) {
  const id = useId();
  return (
    <div className="flex items-center gap-4">
      {label && (
        <label htmlFor={id} className="font-medium text-zinc-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border border-zinc-300 rounded px-3 py-1 pr-8 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200 w-48"
        />
        {value !== "" && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear filter"
            className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-red-500 transition hover:text-red-700"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

type NumericProps = {
  value: number;
  label: string;
  min?: number;
  onChange: (value: number) => void;
};

export function Numeric({ value, label, min, onChange }: NumericProps) {
  return (
    <div className="mb-4 flex items-center gap-4">
      <label htmlFor="numeric-input" className="font-medium text-zinc-700">
        {label}
      </label>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          onChange(Number(val));
        }}
        className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200 w-28"
      />
    </div>
  );
}

type YearFilterProps = {
  value: number;
  onChange: (value: number) => void;
  onEnter?: () => void;
};

export function YearFilter({ value, onChange, onEnter }: YearFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="year-input" className="font-medium text-zinc-700">
        Year:
      </label>
      <input
        id="year-input"
        type="number"
        min="0"
        placeholder="(all)"
        value={value === 0 ? "" : value}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "" || (/^\d+$/.test(val) && Number(val) >= 0)) {
            onChange(Number(val));
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) onEnter();
        }}
        className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200 w-28"
      />
    </div>
  );
}
