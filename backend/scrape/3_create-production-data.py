import shutil

import sqlalchemy as sa
from pydantic import BaseModel, ConfigDict

import calimove.db as appdb
import calimove.models as appmodels
import db as rawdb
import models as rawmodels


class FlowExerciseInput(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    flow_id: int
    exercise_id: int
    position: int


class WorkoutInput(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    flow_id: int
    n_sets: int
    n_reps: int
    durations: str
    lecture_id: int


def fix_name(x: str):
    x = x.title()
    x = x.replace("Cc", "CC")
    x = x.replace("Oc", "OC")

    return x


if __name__ == "__main__":
    db_raw = rawdb.SessionLocal()
    db_production = appdb.SessionLocal()

    exercises_raw = db_raw.query(rawmodels.Exercise).all()
    exercise_dict = {}
    for exercise_raw in exercises_raw:
        exercise_model = appmodels.Exercise(
            lecture_id=exercise_raw.lecture_id,
            name=fix_name(exercise_raw.name),
            mod_lecture_id=exercise_raw.mod_lecture_id,
        )
        db_production.add(exercise_model)
        exercise_dict[exercise_raw.exercise_id] = exercise_model

    flows_raw = db_raw.query(rawmodels.Flow).all()
    flow_dict = {}
    for flow_raw in flows_raw:
        flow_model = appmodels.Flow(
            level=flow_raw.level,
            name=flow_raw.name,
        )
        db_production.add(flow_model)
        flow_dict[flow_raw.flow_id] = flow_model

    workouts_cte = (
        sa.select(
            rawmodels.Workout.workout_id,
            rawmodels.Workout.lecture_id,
            rawmodels.Workout.flow_id,
            rawmodels.Workout.n_sets,
            sa.func.min(rawmodels.WorkoutExercise.n_reps).label("n_reps"),
            sa.func.aggregate_strings(rawmodels.WorkoutExercise.duration, separator=";").label("durations"),
        )
        .select_from(rawmodels.Workout)
        .join(rawmodels.WorkoutExercise)
        .group_by(rawmodels.Workout.workout_id)
        .cte("workouts_prepped")
    )

    workouts = (
        db_raw.query(
            workouts_cte.c.flow_id,
            workouts_cte.c.n_sets,
            workouts_cte.c.n_reps,
            workouts_cte.c.durations,
            sa.func.min(workouts_cte.c.lecture_id).label("lecture_id"),
        )
        .group_by(
            workouts_cte.c.flow_id,
            workouts_cte.c.n_sets,
            workouts_cte.c.n_reps,
            workouts_cte.c.durations
        )
        .order_by(workouts_cte.c.lecture_id)
        .all()
    )

    for workout in workouts:
        workout_input = WorkoutInput.model_validate(workout)

        workout_model = appmodels.Workout(
            lecture_id=workout_input.lecture_id,
            flow=flow_dict[workout_input.flow_id],
            n_sets=workout_input.n_sets,
            n_reps=workout_input.n_reps,
            durations=workout_input.durations,
        )
        db_production.add(workout_model)

    db_production.commit()

    flow_exercises = (
        db_raw.query(
            rawmodels.Workout.flow_id,
            rawmodels.Exercise.exercise_id,
            rawmodels.WorkoutExercise.position
        )
        .select_from(rawmodels.Workout)
        .join(rawmodels.WorkoutExercise)
        .join(rawmodels.Exercise, onclause=(rawmodels.Exercise.name == rawmodels.WorkoutExercise.exercise_name))
        .distinct()
        .all()
    )

    for flow_exercise in flow_exercises:
        flow_exercise_input = FlowExerciseInput.model_validate(flow_exercise)
        flow_exercise_model = appmodels.FlowExercise(
            flow_id=flow_dict[flow_exercise_input.flow_id].flow_id,
            exercise_id=exercise_dict[flow_exercise_input.exercise_id].exercise_id,
            position=flow_exercise_input.position
        )
        db_production.add(flow_exercise_model)

    db_production.commit()

    query = (
        sa.select(
            rawmodels.Exercise.exercise_id,
            rawmodels.Workout.lecture_id,
            rawmodels.WorkoutExercise.position,
            sa.func.row_number().over(partition_by=rawmodels.Exercise.exercise_id).label("row")
        )
        .select_from(rawmodels.Exercise)
        .join(rawmodels.WorkoutExercise, rawmodels.WorkoutExercise.exercise_name == rawmodels.Exercise.name)
        .join(rawmodels.Workout)
        .subquery()
    )

    rows = db_raw.execute(sa.select(query).where(query.c.row == 1)).all()

    for row in rows:
        shutil.copy(
            f"../rawdata/images/examples/lecture-{row.lecture_id}-exercise-{row.position}.png",
            f"../../frontend/src/assets/exercise_images/exercise_{row.exercise_id}.png"
        )
