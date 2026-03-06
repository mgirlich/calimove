#!/usr/bin/env bash
# Extract static data from the old SQLite database into JSON files for seeding.
#
# Usage:
#   bash scripts/extract.sh /path/to/calimove-mobility.sqlite
#
# Output:
#   scripts/data/exercises.json
#   scripts/data/flows.json
#   scripts/data/flow_exercises.json
#   scripts/data/workouts.json      (skip=1 rows excluded)
#   scripts/data/executions.json    (includes flow_id via join)
#
# Review the output files before running seed.

set -euo pipefail

DB="${1:-}"
OUT="$(dirname "$0")/data"

if [[ -z "$DB" ]]; then
  echo "Usage: $0 /path/to/calimove-mobility.sqlite" >&2
  exit 1
fi

if [[ ! -f "$DB" ]]; then
  echo "File not found: $DB" >&2
  exit 1
fi

mkdir -p "$OUT"

echo "Extracting exercises..."
sqlite3 -json "$DB" \
  "SELECT exercise_id, lecture_id, name, mod_lecture_id FROM exercises ORDER BY exercise_id" \
  > "$OUT/exercises.json"

echo "Extracting flows..."
sqlite3 -json "$DB" \
  "SELECT flow_id, level, name FROM flows ORDER BY flow_id" \
  > "$OUT/flows.json"

echo "Extracting flow_exercises..."
sqlite3 -json "$DB" \
  "SELECT flow_id, exercise_id, position FROM flow_exercises ORDER BY flow_id, position" \
  > "$OUT/flow_exercises.json"

echo "Extracting workouts (skip=0 only)..."
sqlite3 -json "$DB" \
  "SELECT workout_id, lecture_id, flow_id, n_sets, n_reps, durations FROM workouts WHERE skip = 0 ORDER BY workout_id" \
  > "$OUT/workouts.json"

echo "Extracting executions (with flow_id via join)..."
sqlite3 -json "$DB" \
  "SELECT e.workout_id, w.flow_id, e.finished_at
   FROM executions e
   JOIN workouts w ON e.workout_id = w.workout_id
   ORDER BY e.finished_at" \
  > "$OUT/executions.json"

echo ""
echo "Done. Review files in $OUT/ before seeding:"
for f in "$OUT"/*.json; do
  count=$(python3 -c "import json,sys; print(len(json.load(open('$f'))))")
  echo "  $(basename "$f"): $count rows"
done
