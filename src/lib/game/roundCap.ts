/**
 * The longest a round can get.
 *
 * It is both the number of slots the readout draws and the point at which the
 * board stops accepting taps — the two are the same number because the readout
 * exists to show a whole round at once.
 *
 * Lives in `lib` rather than on the board, because it is also what tells a
 * *banked* round apart: one that reached the cap went the distance, and one
 * that stopped short ended early. Nothing records why a round ended, so its
 * length is the only evidence there is.
 */
export const ROUND_CAP = 20;
