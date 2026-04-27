"use client";

type Props = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
  labelOn?: string;
  labelOff?: string;
};

/**
 * 슬라이딩 토글 스위치.
 * labelOn/labelOff 지정 시 라벨+토글 버튼으로, 미지정 시 토글 pill만 렌더링.
 */
export function ToggleSwitch({
  checked,
  onCheckedChange,
  loading = false,
  disabled = false,
  labelOn,
  labelOff,
}: Props) {
  const isDisabled = disabled || loading;
  const hasLabel = Boolean(labelOn || labelOff);

  const pill = (
    <span
      className={`relative h-4 w-8 shrink-0 overflow-hidden rounded-full transition-colors ${
        checked ? "bg-emerald-500" : "bg-muted-foreground/25"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </span>
  );

  if (hasLabel) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        disabled={isDisabled}
        className="inline-flex h-7 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-2 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted/40 disabled:opacity-60"
      >
        <span className={checked ? "text-foreground" : "text-muted-foreground"}>
          {checked ? (labelOn ?? "ON") : (labelOff ?? "OFF")}
        </span>
        {pill}
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      disabled={isDisabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-emerald-500" : "bg-muted-foreground/25"
      }`}
    >
      <span
        className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
