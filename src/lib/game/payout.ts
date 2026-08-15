/**
 * What the machine pays for a round taken all the way to {@link ROUND_CAP}.
 *
 * A fact about the machine rather than about this app, which is why it is a
 * constant and not a setting: it is what the thing pays, not something the
 * player tunes. If a different machine pays differently, this is the one number
 * to move — it is the only place the figure exists.
 *
 * In dollars, so it can be added straight to a spin's winnings; both are money
 * off the same visit.
 */
export const COMPLETED_ROUND_PAYOUT = 0.25;
