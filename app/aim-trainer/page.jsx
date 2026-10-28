"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const TOTAL_TARGETS = 30;
const TARGET_SIZE = 100;

export default function AimTrainerPage() {
  const [status, setStatus] = useState("ready");
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const targetQueueRef = useRef([]);
  const [hits, setHits] = useState(0);
  const [times, setTimes] = useState([]);
  const [lastTime, setLastTime] = useState(null);
  const [bestTime, setBestTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const areaRef = useRef(null);
  const targetTimeRef = useRef(0);
  const startTimeRef = useRef(0);
  const timesRef = useRef([]);
  const hitsRef = useRef(0);

  const averageTime = times.length
    ? Math.round(times.reduce((sum, time) => sum + time, 0) / times.length)
    : 0;

  const generateTarget = useCallback(() => {
    const area = areaRef.current;
    if (!area) return { x: 0, y: 0 };

    const rect = area.getBoundingClientRect();
    const padding = 10;
    const headerHeight = 60;

    return {
      x:
        padding +
        Math.random() * Math.max(0, rect.width - TARGET_SIZE - padding * 2),
      y:
        headerHeight +
        padding +
        Math.random() *
          Math.max(0, rect.height - TARGET_SIZE - headerHeight - padding * 2),
    };
  }, []);

  const moveTarget = useCallback(() => {
    if (targetQueueRef.current.length === 0) {
      targetQueueRef.current.push(generateTarget());
    }

    const next = targetQueueRef.current.shift();
    setTarget(next);

    while (targetQueueRef.current.length < 3) {
      targetQueueRef.current.push(generateTarget());
    }
  }, [generateTarget]);

  const startGame = useCallback(() => {
    setHits(0);
    setTimes([]);
    setLastTime(null);
    setBestTime(null);
    setElapsed(0);

    hitsRef.current = 0;
    timesRef.current = [];

    targetQueueRef.current = [];

    const area = areaRef.current;
    if (area) {
      const rect = area.getBoundingClientRect();
      setTarget({
        x: (rect.width - TARGET_SIZE) / 2,
        y: (rect.height - TARGET_SIZE) / 2,
      });
    }

    setStatus("playing");
  }, []);

  useEffect(() => {
    if (status !== "playing") return;

    targetTimeRef.current = performance.now();
  }, [target, status]);

  const hitTarget = () => {
    const reactionTime = Math.round(performance.now() - targetTimeRef.current);
    const nextHits = hitsRef.current + 1;
    const nextTimes = [...timesRef.current, reactionTime];

    hitsRef.current = nextHits;
    timesRef.current = nextTimes;

    setHits(nextHits);
    setTimes(nextTimes);
    setLastTime(reactionTime);
    setBestTime((previous) =>
      previous === null ? reactionTime : Math.min(previous, reactionTime),
    );

    if (nextHits >= TOTAL_TARGETS) {
      setElapsed(Math.round(performance.now() - startTimeRef.current));
      setStatus("finished");
      return;
    }

    moveTarget();
  };

  useEffect(() => {
    if (status !== "playing") return;

    const interval = setInterval(() => {
      setElapsed(Math.round(performance.now() - startTimeRef.current));
    }, 50);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter" && status !== "playing") {
        startGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, startGame]);

  const formatTime = (milliseconds) => {
    if (milliseconds === null) return "—";
    return `${milliseconds.toLocaleString()} ms`;
  };

  return (
    <main className="min-h-screen bg-[#0c0e12] px-4 text-[#ece8e1] sm:px-6 sm:py-1">
      <div className="mx-auto">
        <header className="mb-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#e6a15a] inline-block">
            Human Benchmark style
          </p>
          <h1 className="mt-1 mx-5 font-serif text-3xl tracking-tight sm:text-4xl inline-block">
            Aim Trainer
          </h1>
          <p className="text-sm text-[#9a9388] inline-block">
            Click 30 targets as quickly as you can. How fast are your reflexes?
          </p>
        </header>

        <div
          ref={areaRef}
          className="relative h-[55vh] min-h-[320px] w-full overflow-hidden rounded-2xl border border-[#2a3038] bg-gray-800 sm:h-[500px] cursor-pointer select-none"
        >
          {status === "playing" && (
            <>
              <div className="m-3 flex  justify-center text-3xl text-[#9a9388]">
                <h2 className="font-medium text-[#ece8e1]">
                  Targets remaining :{" "}
                  <span className="font-mono text-[#e6a15a]">
                    {TOTAL_TARGETS - hits}/{TOTAL_TARGETS}
                  </span>
                </h2>
              </div>
              <motion.div
                aria-label="Hit target"
                onClick={hitTarget}
                initial={false}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.5 }}
                transition={{ type: "spring", stiffness: 50, damping: 40 }}
                className="absolute flex items-center justify-center rounded-full border-4 border-[#f6c58f] bg-[#e6a15a] shadow-[0_0_22px_rgba(230,161,90,0.25)] cursor-pointer select-none"
                style={{
                  width: TARGET_SIZE,
                  height: TARGET_SIZE,
                  left: target.x,
                  top: target.y,
                }}
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute h-18 w-[2px] bg-white" />
                  <span className="absolute h-[2px] w-18 bg-white" />
                  <span className="h-2 w-2 rounded-full bg-white" />
                </div>
              </motion.div>
            </>
          )}

          {status !== "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
              {status === "finished" ? (
                <>
                  <h2 className="font-serif text-3xl">Session complete!</h2>
                  <p className="mt-3 text-sm text-[#9a9388]">
                    Average reaction:{" "}
                  </p>
                  <span className="font-mono text-[#e6a15a] text-[4rem]">
                    {formatTime(averageTime)}
                  </span>
                  <p className="mt-1 text-sm text-[#9a9388]">
                    Total time: {(elapsed / 1000).toFixed(2)} seconds
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-serif text-2xl">Ready to aim?</h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#9a9388]">
                    Click the target each time it appears. Your reaction time is
                    measured from when each target appears until you hit it.
                  </p>
                </>
              )}

              <button
                type="button"
                onClick={startGame}
                className="mt-40 rounded-xl bg-gray-300 px-5 py-3 text-sm font-semibold text-[#0c0e12] transition duration-200 hover:scale-105 hover:bg-[#c4843a]"
              >
                {status === "finished" ? "Play again" : "Start training"}
              </button>
            </div>
          )}
        </div>

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6d675f]">
          <span>Time: {(elapsed / 1000).toFixed(2)}s</span>
          <span>30 targets · No data saved</span>
        </footer>

        <section className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Targets hit", value: `${hits}/${TOTAL_TARGETS}` },
            {
              label: "Average reaction",
              value: formatTime(averageTime || null),
            },
            { label: "Last hit", value: formatTime(lastTime) },
            { label: "Best reaction", value: formatTime(bestTime) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#2a3038] bg-[#171b22] p-3"
            >
              <p className="text-xs text-[#9a9388]">{stat.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#2a3038] bg-[#171b22]">
          <div className="border-b border-[#2a3038] p-4">
            <h2 className="font-serif text-xl">Click history</h2>
            <p className="mt-1 text-xs text-[#9a9388]">
              Reaction time for each target, from fastest to slowest in your
              actual click order.
            </p>
          </div>

          {times.length === 0 ? (
            <p className="p-5 text-center text-sm text-[#9a9388]">
              Your click times will appear here.
            </p>
          ) : (
            <div className="max-h-110 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[#101318] text-xs text-[#9a9388]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Target</th>
                    <th className="px-4 py-3 font-medium">Reaction time</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Comparison
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {times.map((time, index) => (
                    <tr key={index} className="border-t border-[#2a3038]">
                      <td className="px-4 py-3 text-[#9a9388]">#{index + 1}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums">
                        {time} ms
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={
                            time === Math.min(...times)
                              ? "text-[#e6a15a]"
                              : "text-[#9a9388]"
                          }
                        >
                          {time === Math.min(...times)
                            ? "Fastest"
                            : `${time} ms`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
