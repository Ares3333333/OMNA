"use client";

type ReminderControlProps = {
  feedback: string;
  onEnable: () => void;
};

export function ReminderControl({ feedback, onEnable }: ReminderControlProps) {
  return (
    <div className="omna-reminder">
      <span>Вечерний Ом в 22:00</span>
      <button type="button" onClick={onEnable}>
        Напомнить
      </button>
      {feedback ? <small>{feedback}</small> : null}
    </div>
  );
}
