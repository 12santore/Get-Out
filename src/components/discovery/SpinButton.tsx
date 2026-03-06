export function SpinButton({ onClick, spinning }: { onClick: () => void; spinning: boolean }) {
  return (
    <button className={spinning ? "spin-cta spin-cta-active" : "spin-cta"} onClick={onClick}>
      <span className="inline-flex items-center gap-2">
        <span>🎲🎲</span>
        <span>{spinning ? "Rolling..." : "Roll the Dice"}</span>
      </span>
    </button>
  );
}
