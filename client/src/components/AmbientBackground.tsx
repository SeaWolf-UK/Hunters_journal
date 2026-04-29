export default function AmbientBackground() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 6}s`,
      animationDuration: `${4 + Math.random() * 6}s`,
      width: `${2 + Math.random() * 3}px`,
      height: `${2 + Math.random() * 3}px`,
    }
  }));

  return (
    <div className="ambient-bg">
      <div className="ambient-bg__fog" />
      <div className="ambient-bg__vignette" />
      <div className="ambient-bg__particles">
        {particles.map(p => (
          <div key={p.id} className="ambient-bg__particle" style={p.style} />
        ))}
      </div>
    </div>
  );
}
