// Shared scoring rules. Used by the server for live rooms and by the browser for solo play.

export const CHEST_EVERY = 5; // a treasure chest pops every 5 correct answers in a row

export function newPlayerStats() {
  return { score: 0, correct: 0, answered: 0, skipped: 0, streak: 0, bestStreak: 0, mult: 1, multLeft: 0 };
}

// Answers typed faster than this earn a speed bonus (scaled down to 0 at the limit).
export const SPEED_WINDOW_MS = 20000;

// Points for one correct answer: base + streak bonus + speed bonus, then any active multiplier.
export function pointsFor(streak, ms) {
  const streakBonus = Math.min(Math.max(streak - 1, 0), 10) * 10;
  const speedBonus = Math.max(0, Math.round(50 * (1 - Math.min(ms, SPEED_WINDOW_MS) / SPEED_WINDOW_MS)));
  return 100 + streakBonus + speedBonus;
}

export function scoreAnswer(stats, { correct, ms = 10000 }) {
  stats.answered++;
  if (!correct) {
    stats.streak = 0;
    return { gained: 0, chest: null };
  }
  stats.correct++;
  stats.streak++;
  stats.bestStreak = Math.max(stats.bestStreak, stats.streak);

  let gained = pointsFor(stats.streak, ms);
  if (stats.multLeft > 0) {
    gained *= stats.mult;
    stats.multLeft--;
    if (stats.multLeft === 0) stats.mult = 1;
  }
  stats.score += gained;

  let chest = null;
  if (stats.streak % CHEST_EVERY === 0) {
    chest = openChest(stats);
    gained += chest.amount;
  }
  return { gained, chest };
}

/** Skipping is allowed but costs your streak (so you can't skip hard ones to farm chests). */
export function scoreSkip(stats) {
  stats.skipped++;
  stats.streak = 0;
  return { gained: 0, chest: null };
}

export function openChest(stats, roll = Math.random()) {
  let chest;
  if (roll < 0.4) {
    chest = { type: 'gold', icon: '🪙', label: 'Gold Pile!', detail: '+150 points', amount: 150 };
  } else if (roll < 0.65) {
    stats.mult = 2;
    stats.multLeft = 3;
    chest = { type: 'double', icon: '⚡', label: 'Double Power!', detail: '2× points on your next 3 answers', amount: 0 };
  } else if (roll < 0.88) {
    const amount = Math.max(100, Math.round(stats.score * 0.1));
    chest = { type: 'bonus', icon: '💎', label: 'Gem Bonus!', detail: `+10% of your score (+${amount})`, amount };
  } else {
    chest = { type: 'jackpot', icon: '👑', label: 'JACKPOT!', detail: '+500 points', amount: 500 };
  }
  stats.score += chest.amount;
  return chest;
}
