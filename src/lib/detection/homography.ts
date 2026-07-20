/**
 * Maps the machine's grid onto the camera image.
 *
 * The phone is never square-on to a bar-top machine, so the 3x3 grid arrives as
 * a trapezoid: cells further away are smaller and closer together. A homography
 * is the transform that undoes exactly that kind of perspective distortion, and
 * four point correspondences are enough to pin one down.
 *
 * Calibration asks for the four *corner circles*, not the four corners of the
 * screen. Screen corners would mean assuming where the grid sits inside the
 * screen — an assumption that holds only for the machine it was measured on.
 * Corner circles carry that information themselves.
 */

import { CELL_POSITIONS, type CellPosition } from "./detector";

export interface Point {
  x: number;
  y: number;
}

/** The four corner circles' centres, in camera-image pixels. */
export interface GridCorners {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

/**
 * Row-major 3x3 matrix mapping grid space to image space. Grid space puts the
 * corner circle centres on the unit square, so the nine cell centres land on a
 * tidy lattice at every combination of 0, 0.5 and 1.
 */
export type Homography = readonly number[];

/**
 * Solves the 8x8 system by Gaussian elimination with partial pivoting.
 *
 * Partial pivoting rather than naive elimination because the matrix rows carry
 * wildly different magnitudes — pixel coordinates in the hundreds sit beside
 * unit-square coordinates and bare 1s. Without pivoting a near-zero pivot is
 * reachable with entirely reasonable input.
 */
function solve(matrix: number[][], rhs: number[]): number[] | null {
  const n = rhs.length;
  const a = matrix.map((row, i) => [...row, rhs[i]]);

  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    if (Math.abs(a[pivot][col]) < 1e-12) return null; // degenerate — no unique solution
    [a[col], a[pivot]] = [a[pivot], a[col]];

    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = a[row][col] / a[col][col];
      if (factor === 0) continue;
      for (let k = col; k <= n; k += 1) a[row][k] -= factor * a[col][k];
    }
  }

  return a.map((row, i) => row[n] / row[i]);
}

const cross = (o: Point, a: Point, b: Point) =>
  (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

/**
 * True when the four points form a convex quadrilateral in the given order.
 *
 * This is checked up front rather than left to the solver, because the solver
 * cannot be trusted to complain. Three collinear taps still yield a solvable
 * 8x8 system — it just describes a transform that collapses the grid onto a
 * line, and every cell centre comes back sitting on top of every other. A quad
 * seen through a camera is always convex, so anything else is bad input.
 *
 * It also rejects a bowtie, which is what tapping the corners out of order
 * produces — a mistake no amount of solving can detect.
 */
function isConvexQuad(quad: readonly Point[]): boolean {
  let sign = 0;
  for (let i = 0; i < 4; i += 1) {
    const c = cross(quad[i], quad[(i + 1) % 4], quad[(i + 2) % 4]);
    if (Math.abs(c) < 1e-9) return false; // collinear, or two taps coincide
    const s = Math.sign(c);
    if (sign === 0) sign = s;
    else if (s !== sign) return false; // turns both ways — not convex
  }
  return true;
}

/**
 * Builds the homography taking grid space to image space.
 *
 * Returns null when the four points cannot describe a plane seen through a
 * camera — three of them in a line, two tapped on top of each other, or tapped
 * out of order. That is a user tapping badly, not an exceptional condition, so
 * it is a value rather than a throw.
 */
export function createHomography(corners: GridCorners): Homography | null {
  const source: Point[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
  const target = [
    corners.topLeft,
    corners.topRight,
    corners.bottomRight,
    corners.bottomLeft,
  ];

  if (!isConvexQuad(target)) return null;

  // Two rows per correspondence: one for x, one for y. h33 is fixed at 1, since
  // a homography is only defined up to scale.
  const matrix: number[][] = [];
  const rhs: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const { x, y } = source[i];
    const { x: u, y: v } = target[i];
    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    rhs.push(u);
    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    rhs.push(v);
  }

  const h = solve(matrix, rhs);
  return h ? [...h, 1] : null;
}

/** Applies a homography to a point. */
export function project(h: Homography, { x, y }: Point): Point {
  const w = h[6] * x + h[7] * y + h[8];
  return {
    x: (h[0] * x + h[1] * y + h[2]) / w,
    y: (h[3] * x + h[4] * y + h[5]) / w,
  };
}

/** Where each cell sits in grid space — corner circles on the unit square. */
const GRID_SPACE: Record<CellPosition, Point> = {
  "top-left": { x: 0, y: 0 },
  "top-middle": { x: 0.5, y: 0 },
  "top-right": { x: 1, y: 0 },
  "middle-left": { x: 0, y: 0.5 },
  center: { x: 0.5, y: 0.5 },
  "middle-right": { x: 1, y: 0.5 },
  "bottom-left": { x: 0, y: 1 },
  "bottom-middle": { x: 0.5, y: 1 },
  "bottom-right": { x: 1, y: 1 },
};

/**
 * The nine cell centres in image pixels, in `CELL_POSITIONS` order — ready to
 * hand straight to the sampler.
 */
export function cellCentres(corners: GridCorners): Point[] | null {
  const h = createHomography(corners);
  if (!h) return null;
  return CELL_POSITIONS.map((position) => project(h, GRID_SPACE[position]));
}
