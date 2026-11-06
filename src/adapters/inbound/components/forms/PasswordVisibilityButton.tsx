import { EyeIcon } from "../icons";

export function PasswordVisibilityButton({
  visible,
  onToggle,
  fieldLabel = "contraseña",
}: {
  visible: boolean;
  onToggle: () => void;
  fieldLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`${visible ? "Ocultar" : "Mostrar"} ${fieldLabel}`}
      onClick={onToggle}
      className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm text-text-secondary hover:text-text-primary"
    >
      <EyeIcon crossed={visible} />
    </button>
  );
}
