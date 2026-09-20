import { useEffect, useRef, useState } from "react";

// Reveal-once visibility. Flips to true the first time the element enters the
// viewport and then stops observing — content never fades back out on scroll.
export function useInView(options) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;

    // No element yet, or a browser without IntersectionObserver: show it.
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setInView(true);
        observer.disconnect();
      }
    }, { rootMargin: "0px 0px -10% 0px", ...options });

    observer.observe(node);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}
