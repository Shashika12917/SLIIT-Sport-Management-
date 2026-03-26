"use client";

type Props = {
  name?: string;
  id?: string;
  digits: string;
  onDigitsChange: (digits: string) => void;
};

export function StudentIdInput({
  name = "student_id",
  id = "student_id",
  digits,
  onDigitsChange,
}: Props) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = event.target.value.replace(/\D/g, "").slice(0, 8);
    onDigitsChange(onlyDigits);
  };

  const hiddenValue = digits ? `IT${digits}` : "";

  return (
    <>
      <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-base-100 px-3 shadow-sm transition-[border-color,box-shadow] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 dark:border-slate-600">
        <span className="select-none rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950/80 dark:text-blue-200">
          IT
        </span>
        <span className="text-slate-300 dark:text-slate-600" aria-hidden>
          |
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={digits}
          onChange={handleChange}
          maxLength={8}
          className="min-w-0 flex-1 bg-transparent font-mono text-sm tabular-nums tracking-widest text-base-content outline-none placeholder:text-base-content/35"
          placeholder="________"
          aria-label="Student ID digits (8 digits after IT)"
          title="Enter exactly 8 digits."
        />
        <span
          className={`text-xs tabular-nums ${
            digits.length === 8
              ? "font-medium text-blue-600 dark:text-blue-400"
              : "text-base-content/45"
          }`}
          aria-live="polite"
        >
          {digits.length}/8
        </span>
      </div>
      <input
        type="hidden"
        name={name}
        required
        pattern="IT\d{8}"
        title="Student ID must be IT followed by exactly 8 digits."
        value={hiddenValue}
        onChange={() => {}}
      />
    </>
  );
}
