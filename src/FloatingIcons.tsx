const ICONS = ["⚽", "🏆", "🥅", "🟨", "🎉", "⚽", "🏆", "🎊", "⚽", "🥇"];

export default function FloatingIcons() {
  return (
    <div className="floating-icons">
      {ICONS.map((icon, i) => (
        <span
          key={i}
          className="floating-icon"
          style={{
            left: `${(i * 97) % 100}%`,
            animationDuration: `${12 + (i % 5) * 3}s`,
            animationDelay: `${i * 1.3}s`,
            fontSize: `${1.5 + (i % 3) * 0.8}rem`,
          }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}
