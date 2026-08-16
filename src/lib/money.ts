import { capReturn } from "@/lib/game/payout";
import { ROUND_CAP } from "@/lib/game/roundCap";
import type { Round, SessionStake } from "@/lib/store/gameStore";

/**
 * Money, with a thousands separator — a visit's balance runs to four figures
 * more readily than a single round's winnings do.
 *
 * Cents only appear when there are cents: a whole amount reads "$12", not
 * "$12.00". The machine deals in round numbers most of the time, and two zeros
 * on every figure is noise on the common case rather than precision. The test
 * is on the *rounded* cents, not on `amount % 1`, so a balance assembled from
 * several bets and returns can't land on 12.000000000000002 and sprout
 * decimals.
 *
 * Client-only, like the time formats, because the store rehydrates after mount.
 */
export function formatMoney(amount: number): string {
  const whole = Math.round(amount * 100) % 100 === 0;
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * A signed figure — "+$2.50", "−$3", "$0".
 *
 * A real minus (U+2212) rather than a hyphen: it is the same width and weight
 * as the plus it alternates with, which a hyphen is not, so the two readings
 * don't shift the digits beside them. Zero takes no sign, because it isn't
 * going either way.
 */
export function formatSignedMoney(amount: number): string {
  const cents = Math.round(amount * 100);
  if (cents === 0) return formatMoney(0);
  return `${cents > 0 ? "+" : "−"}${formatMoney(Math.abs(amount))}`;
}

/** What a visit is worth now, and how far that is from what it started with. */
export interface SessionMoney {
  balance: number;
  /** `balance` − the starting balance. Negative when the visit is down. */
  difference: number;
}

/**
 * What one round returned: nothing, unless it was carried to the cap or won on
 * the spin.
 *
 * Both are summed rather than picked between. They cannot both happen today —
 * the spin button banks its round on the spot, so a spin round has no dots to
 * reach the cap with — but adding them says "these are two ways to be paid"
 * rather than "these are alternatives", which is what they actually are.
 *
 * A skipped spin amount returns nothing rather than zero: the figure wasn't
 * recorded, so the balance can under-report but never invent.
 */
export function roundReturn(round: Round, bet: number): number {
  return (
    (round.dots >= ROUND_CAP ? capReturn(bet) : 0) + (round.spinWon ?? 0)
  );
}

/**
 * What one round did to the balance: what it returned, less the bet it cost.
 *
 * The visit's swing is the sum of these, which is all this is for. **The round
 * list shows the machine's own figures instead** — $5.25 won, or the $5 lost —
 * because that is what happens at the machine and what a player is reading the
 * list to check. The two are different sentences about the same round, and only
 * the balance needs the arithmetic one.
 */
function roundNet(round: Round, stake: SessionStake): number {
  const net = roundReturn(round, stake.denomination) - stake.denomination;
  return Math.round(net * 100) / 100;
}

/**
 * A visit's running balance: what it started with, minus a bet for every round
 * banked, plus whatever those rounds returned.
 *
 * **Every banked round costs the bet, including the ones that lost.** That is
 * the whole model — a round ended early needs no special case, because losing
 * *is* having staked and been paid nothing back. It is also why a completed
 * round is worth only five per cent: the bet comes off in the same sum that
 * pays it back.
 *
 * A spin round is staked like any other. Winning on the spin means the pattern
 * never had to be played, not that the round was free, and `spinWon` is what
 * the machine paid out rather than what was made on the deal.
 *
 * Pass the round in progress along with the banked ones and the balance reads
 * live — the bet comes off the moment a round opens, which is when it is
 * actually gone.
 */
export function sessionMoney(
  rounds: Round[],
  stake: SessionStake,
): SessionMoney {
  // Summed from the same per-round figure the round list prints, so the two
  // readings of the visit are one calculation and can't drift apart. The final
  // rounding only clears the float dust from adding whole cents together.
  const difference =
    Math.round(
      rounds.reduce((total, round) => total + roundNet(round, stake), 0) * 100,
    ) / 100;
  return { balance: stake.startingBalance + difference, difference };
}
