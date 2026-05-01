"use client";

type PrivateCircleProps = {
  circleId: string | null;
  feedback: string;
  onCreate: () => void;
  onCopy: () => void;
};

export function PrivateCircle({
  circleId,
  feedback,
  onCreate,
  onCopy,
}: PrivateCircleProps) {
  return (
    <div className="omna-circle">
      <div>
        <span>{circleId ? "Приватный круг" : "Круг для двоих"}</span>
        <strong>{circleId ? `omna-${circleId}` : "держать звук вместе"}</strong>
      </div>
      <button
        type="button"
        onClick={circleId ? onCopy : onCreate}
        aria-label={circleId ? "Скопировать ссылку круга" : "Создать приватный круг"}
        title={circleId ? "Скопировать круг" : "Создать круг"}
      >
        Круг
      </button>
      {feedback ? <small>{feedback}</small> : null}
    </div>
  );
}
