import { useEffect, useState } from "react";

interface Props {
  onFinish: () => void;
}

export function PS5Intro({ onFinish }: Props) {
  const [phase, setPhase] = useState<"logo" | "fade" | "done">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("fade"), 2200);
    const t2 = setTimeout(() => {
      setPhase("done");
      onFinish();
    }, 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onFinish]);

  if (phase === "done") return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      transition: "opacity 1s ease",
      opacity: phase === "fade" ? 0 : 1,
    }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{
        opacity: phase === "fade" ? 0 : 1,
        transition: "opacity 0.8s ease 0.3s, transform 1s ease",
        transform: phase === "fade" ? "scale(0.95)" : "scale(1)",
        filter: "drop-shadow(0 0 30px rgba(255,255,255,0.5)) drop-shadow(0 0 60px rgba(255,255,255,0.2))",
      }}>
        <circle cx="60" cy="60" r="54" fill="none" stroke="white" strokeWidth="2" opacity="0.15" />
        <text x="60" y="72" textAnchor="middle" fill="white" fontSize="52" fontWeight="700" fontFamily="Arial, sans-serif" letterSpacing="4">PS</text>
      </svg>
      <div style={{
        marginTop: 24,
        fontSize: 13,
        color: "rgba(255,255,255,0.3)",
        fontWeight: 500,
        letterSpacing: "6px",
        textTransform: "uppercase",
        fontFamily: "Arial, sans-serif",
      }}>
        Launcher
      </div>
    </div>
  );
}
