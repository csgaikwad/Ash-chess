"use client";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a]">
      {" "}
      <img
        src="/favicon.png"
        alt="Ash Chess"
        className="h-32 w-32 animate-[heartbeat_1.2s_ease-in-out_infinite]"
      />
      <style jsx>{`
        @keyframes heartbeat {
          0% {
            transform: scale(1);
          }
          14% {
            transform: scale(1.25);
          }
          28% {
            transform: scale(1);
          }
          42% {
            transform: scale(1.25);
          }
          70% {
            transform: scale(1);
          }
        }
      `}</style>
    </main>
  );
}
