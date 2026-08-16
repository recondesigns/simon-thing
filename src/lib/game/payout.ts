/**
 * The stakes the machine can be played at, in dollars.
 *
 * A property of the *visit*, not of the app: you choose a denomination when you
 * sit down and every round of that visit is played at it. It is recorded per
 * session rather than as a preference for the same reason a round's end reason
 * is recorded on the round — a bare "current denomination" would relabel
 * history the moment it changed.
 */
export const DENOMINATIONS = [0.25, 0.5, 1, 2, 3, 4, 5] as const;

export type Denomination = (typeof DENOMINATIONS)[number];

/**
 * What the stake prompt opens on. $5 is the denomination this app has actually
 * been played at, so it is the one answer that is usually already right.
 *
 * A default rather than an assumption: the control shows it, and it is changed
 * before saving like any other field. Nothing is ever recorded from it without
 * the player passing over it.
 */
export const DEFAULT_DENOMINATION: Denomination = 5;

/**
 * What a round taken all the way to {@link ROUND_CAP} returns, as a multiple of
 * the bet — the whole stake back plus five per cent.
 *
 * A fact about the machine rather than about this app, which is why it is a
 * constant and not a setting. It is a *return*, not a profit: at the $5
 * denomination a completed round pays $5.25 back on the $5 that was staked, so
 * the visit is 25¢ better off, not $5.25.
 */
export const CAP_RETURN_RATE = 1.05;

/**
 * What one completed round pays back at a given bet, rounded to the cent.
 *
 * The rounding matters at the quarter: 0.25 × 1.05 is 26.25¢, which no machine
 * can pay. Rounding here rather than at the point of display keeps the balance
 * a real amount of money at every step, instead of a figure that only looks
 * like one once it is formatted.
 */
export function capReturn(bet: number): number {
  return Math.round(bet * CAP_RETURN_RATE * 100) / 100;
}

/**
 * What a completed round paid before denominations were recorded.
 *
 * Kept only so visits banked before the stake prompt existed still read as they
 * did. It is the *profit* on a capped round at $5 — five per cent of the bet —
 * which is the one figure those visits can still be given, because what they
 * were played at was never written down. New visits don't go near it: they know
 * their denomination and use {@link capReturn}.
 */
export const COMPLETED_ROUND_PAYOUT = 0.25;
