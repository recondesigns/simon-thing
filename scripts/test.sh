#!/usr/bin/env bash
#
# `pnpm test`, with its output kept.
#
# This exists for #83: the suite intermittently fails whole story files with
# *zero* failed assertions, and both sightings so far lost the evidence because
# the run was repeated before anyone read it. A re-run can't destroy output that
# was already written to disk.
#
# It has to be stdout, not a reporter. The only line that says *why* a file
# failed to load is Vite's own:
#
#   [vite] Internal server error: Failed to resolve import "..." from "..."
#
# and it is printed mid-run, interleaved with the passing files. Vitest's
# "Failed Suites" section and its `json` reporter both stop at "Failed to import
# test file" / "Failed to fetch dynamically imported module", which names the
# casualty and not the cause. Verified by inducing a load failure and reading
# both — the JSON knew which file, and nothing else.
#
# The cost of the pipe is that vitest sees no TTY and prints its results as
# plain lines instead of a live-updating tree. Everything is still there; it
# just doesn't redraw. On a six-second suite that is a fair price for never
# losing the one run in forty that matters.

set -uo pipefail

LOG=".test-output.log"
ISSUE="https://github.com/recondesigns/simon-thing/issues/83"

vitest run "$@" 2>&1 | tee "$LOG"
code=${PIPESTATUS[0]}

if [ "$code" -ne 0 ]; then
  files=$(grep -E "^ Test Files" "$LOG" | tail -1)
  tests=$(grep -E "^ +Tests " "$LOG" | tail -1)

  # Files failed but nothing asserted wrongly: the test bodies never ran, so
  # this is a load/startup failure rather than a regression. That is #83's
  # signature, and it is worth saying out loud — it looks exactly like a real
  # break at the moment you least want to doubt the suite.
  if echo "$files" | grep -q "failed" && ! echo "$tests" | grep -q "failed"; then
    cat <<EOF

────────────────────────────────────────────────────────────────────
  Test files failed, but no assertion did.

  The test bodies never ran, so this is a load/startup failure, not a
  regression in the code under test. It is the signature of #83.

  The full output is saved at $LOG.
  Please attach it to the issue BEFORE re-running — every sighting so
  far has been lost to an immediate re-run, and the cause only appears
  in that output.

  $ISSUE
────────────────────────────────────────────────────────────────────
EOF
  fi
fi

exit "$code"
