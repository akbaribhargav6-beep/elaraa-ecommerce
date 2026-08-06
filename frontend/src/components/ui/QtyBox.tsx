'use client';

interface QtyBoxProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QtyBox({ value, onChange, min = 1, max = 99 }: QtyBoxProps) {
  return (
    <div className="qty-box">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Decrease quantity">
        −
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
      />
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}
