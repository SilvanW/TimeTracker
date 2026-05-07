type NumericProps = {
  value: number | "";
  label: string;
  min?: number;
  onChange: (value: number | "") => void;
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
