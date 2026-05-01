"use client";

type ProductPathProps = {
  onSupport: () => void;
};

export function ProductPath({ onSupport }: ProductPathProps) {
  return (
    <div className="omna-product-path" aria-label="Планы Omna">
      <span>Следующий слой Omna</span>
      <div>
        <button type="button" onClick={onSupport}>
          Supporter $5
        </button>
        <button type="button" onClick={onSupport}>
          Plus $9
        </button>
        <button type="button" onClick={onSupport}>
          Circle $19
        </button>
      </div>
      <small>Платежи ещё не включены. Сейчас это карта будущего продукта.</small>
    </div>
  );
}
