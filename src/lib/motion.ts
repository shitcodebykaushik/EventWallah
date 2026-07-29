/**
 * Water-theme motion tokens — slow, fluid, hardware-friendly.
 * Prefer transform + opacity only (GPU accelerated).
 */

export const easeWater = [0.22, 1, 0.36, 1] as const;
export const easeTide = [0.16, 1, 0.3, 1] as const;
export const easeRipple = [0.33, 1, 0.68, 1] as const;

/** Soft spring — liquid feel without bounce flash */
export const springWater = {
  type: "spring" as const,
  stiffness: 120,
  damping: 22,
  mass: 0.9,
};

export const springSoft = {
  type: "spring" as const,
  stiffness: 180,
  damping: 28,
  mass: 0.75,
};

export const duration = {
  micro: 0.28,
  short: 0.45,
  medium: 0.7,
  long: 1.05,
  ambient: 12,
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.medium, ease: easeWater },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: duration.medium, ease: easeWater },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.medium, ease: easeTide },
  },
};

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.06,
    },
  },
};

export const buttonMotion = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: springSoft,
};

export const cardMotion = {
  whileHover: { y: -4, transition: springSoft },
  transition: springSoft,
};
