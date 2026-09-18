"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlipFadeTextProps {
  words?: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
  letterDuration?: number;
  staggerDelay?: number;
  exitStaggerDelay?: number;
}

const defaultWords = ["RIVER", "MANGROVES", "WILDLIFE", "SUNSET"];

const Letter = memo(function Letter({ char, letterDuration }: { char: string; letterDuration: number }) {
  return (
    <motion.span
      style={{ transformStyle: "preserve-3d" }}
      variants={{
        initial: { rotateX: 90, y: 12, opacity: 0, filter: "blur(6px)" },
        animate: {
          rotateX: 0,
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          transition: { duration: letterDuration, ease: [0.2, 0.65, 0.3, 0.9] as const },
        },
        exit: {
          rotateX: -90,
          y: -12,
          opacity: 0,
          filter: "blur(6px)",
          transition: { duration: letterDuration * 0.67, ease: "easeIn" as const },
        },
      }}
      className="inline-block"
    >
      {char}
    </motion.span>
  );
});

const Word = memo(function Word({
  text,
  staggerDelay,
  exitStaggerDelay,
  letterDuration,
  textClassName,
}: {
  text: string;
  staggerDelay: number;
  exitStaggerDelay: number;
  letterDuration: number;
  textClassName?: string | undefined;
}) {
  const letters = useMemo(() => text.split(""), [text]);

  return (
    <motion.span
      className={cn("inline-flex", textClassName)}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 1 },
        animate: { opacity: 1, transition: { staggerChildren: staggerDelay } },
        exit: { opacity: 1, transition: { staggerChildren: exitStaggerDelay } },
      }}
    >
      {letters.map((char, i) => (
        <Letter key={`${char}-${i}`} char={char} letterDuration={letterDuration} />
      ))}
    </motion.span>
  );
});

export function FlipFadeText({
  words = defaultWords,
  interval = 2600,
  className,
  textClassName,
  letterDuration = 0.6,
  staggerDelay = 0.06,
  exitStaggerDelay = 0.03,
}: FlipFadeTextProps) {
  const [index, setIndex] = useState(0);

  const updateIndex = useCallback(() => setIndex((prev) => (prev + 1) % words.length), [words.length]);

  useEffect(() => {
    const timer = setInterval(updateIndex, interval);
    return () => clearInterval(timer);
  }, [updateIndex, interval]);

  const currentWord = words[index] ?? "";

  return (
    <span className={cn("inline-flex items-center", className)}>
      <span className="relative inline-flex" style={{ perspective: "1000px" }}>
        <AnimatePresence mode="wait">
          <Word
            key={currentWord}
            text={currentWord}
            staggerDelay={staggerDelay}
            exitStaggerDelay={exitStaggerDelay}
            letterDuration={letterDuration}
            textClassName={textClassName}
          />
        </AnimatePresence>
      </span>
    </span>
  );
}

export default FlipFadeText;
