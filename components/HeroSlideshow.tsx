"use client";

import { useEffect, useState } from "react";

const SLIDES = [
  { src: "/images/aliou-hero.jpg", position: "center bottom" },
  { src: "/images/aliou-kb-swing.jpg", position: "center 35%" },
  { src: "/images/aliou-court.jpg", position: "center center" },
  { src: "/images/aliou-wall.jpg", position: "center center" },
  { src: "/images/aliou-stretch.jpg", position: "center bottom" },
] as const;

const ROTATE_MS = 7000;

export function HeroSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          style={{
            backgroundImage: `url('${slide.src}')`,
            backgroundPosition: slide.position,
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(135deg, rgba(46,16,101,0.72), rgba(124,58,237,0.40))",
        }}
      />
      <div className="absolute inset-0 bg-white/35" />
    </div>
  );
}
