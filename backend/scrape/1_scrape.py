from db import SessionLocal
import models
from scrape_curriculum import scrape_curriculum
from scrape_workout import scrape_workout
import schemas
from sqlalchemy.orm import Session


def ingest_flow(db: Session, flow: schemas.Flow):
    flow_model = models.Flow(name=flow.name, level=flow.level)

    flow_exercises = []
    for numbered_exercise in flow.numbered_exercises:
        exercise_model = db.query(models.Exercise).filter_by(name=numbered_exercise.name).one_or_none()
        if not exercise_model:
            exercise_model = models.Exercise(
                lecture_id=numbered_exercise.lecture_id,
                name=numbered_exercise.name,
                duration=numbered_exercise.duration,
                mod_lecture_id=numbered_exercise.mod_lecture_id
            )
            db.add(exercise_model)

        flow_exercise_model = models.FlowExercise(
            flow=flow_model,
            exercise=exercise_model,
            position=numbered_exercise.position
        )
        db.add(flow_exercise_model)
        flow_exercises.append(flow_exercise_model)

    flow_model.flow_exercises = flow_exercises
    db.add(flow_model)
    db.commit()


def ingest_mod(db: Session, mod: schemas.Mod):
    if mod.name == "BACKSIDE WRIST CIRCLES":
        mod.name = "WRIST BACKSIDE CIRCLES"

    exercise = db.query(models.Exercise).filter_by(name=mod.name).one_or_none()
    exercise.mod_lecture_id = mod.lecture_id


def ingest_workout(db: Session, workout: schemas.Workout):
    flow = db.query(models.Flow).filter_by(level=workout.flow_id.level, name=workout.flow_id.name).one()
    workout_model = models.Workout(
        lecture_id=workout.lecture_id,
        flow_id=flow.flow_id,
        day=workout.day,
        duration=workout.duration,
    )
    db.add(workout_model)


def ingest():
    curriculum = scrape_curriculum()
    with SessionLocal() as db:
        for flow in curriculum.flows:
            ingest_flow(db, flow)

        for mod in curriculum.mods:
            ingest_mod(db, mod)
        db.commit()

    with SessionLocal() as db:
        for lecture in curriculum.workouts:
            workout = scrape_workout(lecture)
            ingest_workout(db, workout)
        db.commit()


if __name__ == "__main__":
    ingest()
