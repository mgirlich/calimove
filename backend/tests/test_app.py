import datetime

import fastapi
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .context import app, models, schemas

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=True
)
models.Base.metadata.create_all(engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
lecture_id = 0


def create_exercise(name: str, mod_lecture_id=None):
    global lecture_id
    lecture_id = lecture_id + 1
    return models.Exercise(lecture_id=lecture_id, name=name)


def create_flow_exercises(flow, n: int, positions: [int] = None):
    if not positions:
        positions = range(1, n + 1)
    return [models.FlowExercise(flow=flow, exercise=create_exercise(str(i)), position=positions[i]) for i in range(n)]


def test_route_exercises():
    with SessionLocal() as session:
        assert len(app.route_exercises(session)) == 0, "Should be 0 exercises"

        ex1 = create_exercise("b", mod_lecture_id=10)
        ex2 = create_exercise("c")

        flow1 = models.Flow(level=1, name="A")
        flow2 = models.Flow(level=1, name="B")

        session.add_all([
            models.FlowExercise(flow=flow1, exercise=ex1, position=1),
            models.FlowExercise(flow=flow1, exercise=ex2, position=2),
            models.FlowExercise(flow=flow2, exercise=ex1, position=1),
        ])
        session.flush()

        exercises_is = app.route_exercises(session)
        assert len(exercises_is) == 2, "Should be 2 exercises"
        assert exercises_is[0].name == ex1.name, "Wrong first exercise"
        assert len(exercises_is[0].flows) == 2, "First exercise should have 2 flows"
        assert (exercises_is[0].flows[0].name == flow1.name and
                exercises_is[0].flows[1].name == flow2.name), "Incorrect flows on first exercise"
        assert exercises_is[1].name == ex2.name, "Wrong second exercise"
        assert len(exercises_is[1].flows) == 1, "Second exercise should have 1 flow"

        ex3 = create_exercise("a", mod_lecture_id=11)
        session.add(models.FlowExercise(flow=flow2, exercise=ex3, position=2))
        session.flush()

        result = app.route_exercises(session)
        assert len(result) == 3, "Should be 3 exercises now"
        assert result[0].name == ex3.name, "The exercises should be sorted alphabetically"


def test_route_flows():
    with SessionLocal() as session:
        flow1 = models.Flow(level=1, name="A")
        flow_exercises = create_flow_exercises(n=2, flow=flow1)
        session.add_all(flow_exercises)
        session.flush()

        flows_is = app.route_flows(session)
        assert len(flows_is) == 1

        exercises_is = flows_is[0].exercises
        assert len(exercises_is) == 2
        assert exercises_is[0].exercise_id == flow_exercises[0].exercise_id
        assert exercises_is[1].exercise_id == flow_exercises[1].exercise_id
        session.rollback()

        flow1 = models.Flow(level=1, name="A")
        flow_exercises = create_flow_exercises(n=3, flow=flow1, positions=[10, 2, 0])
        session.add_all(flow_exercises)
        session.flush()

        exercises_is = app.route_flows(session)[0].exercises
        assert len(exercises_is) == 3
        assert (exercises_is[0].exercise_id == flow_exercises[2].exercise_id and
                exercises_is[1].exercise_id == flow_exercises[1].exercise_id and
                exercises_is[2].exercise_id == flow_exercises[0].exercise_id), "Flow exercises not sorted by position"


def test_route_flow_detail():
    with SessionLocal() as session:
        flow1 = models.Flow(level=1, name="A")
        flow_exercises = create_flow_exercises(flow1, 2)
        w1 = models.Workout(lecture_id=1, n_sets=2, n_reps=1, durations="10;10", flow=flow1)
        w2 = models.Workout(lecture_id=2, n_sets=3, n_reps=3, durations="10;10", flow=flow1)
        w3 = models.Workout(lecture_id=3, n_sets=1, n_reps=1, durations="10;10", flow=flow1)

        session.add_all(flow_exercises + [w1, w2, w3])
        session.flush()

        flow_is_1 = app.route_flow_detail(1, session)
        assert flow_is_1.flow_id == flow1.flow_id
        assert flow_is_1.exercises[0].name == flow_exercises[0].exercise.name
        assert (flow_is_1.workouts[0].workout_id == w3.workout_id and
                flow_is_1.workouts[1].workout_id == w1.workout_id and
                flow_is_1.workouts[2].workout_id == w2.workout_id), "Workouts in flow detail not sorted by duration"

        with pytest.raises(fastapi.HTTPException) as err:
            app.route_flow_detail(99, session)
        assert err.value.status_code == 404


def test_get_next_flow_id():
    with SessionLocal() as session:
        flow1 = models.Flow(level=1, name="A")
        flow2 = models.Flow(level=1, name="B")
        workout1 = models.Workout(lecture_id=1, flow=flow1, n_sets=1, n_reps=1, durations="1;2")
        workout2 = models.Workout(lecture_id=2, flow=flow2, n_sets=1, n_reps=1, durations="1;2")
        session.add_all([workout1, workout2])
        session.flush()

        assert app.get_next_flow_id(session) == flow1.flow_id, "Should be first flow if there are no executions"

        t = datetime.datetime.now(datetime.UTC)
        session.add(models.Execution(workout=workout1, finished_at=t))
        session.flush()
        assert app.get_next_flow_id(session) == flow2.flow_id, "Should be 2nd flow when last execution was 1st flow"

        session.add(models.Execution(workout=workout2, finished_at=t + datetime.timedelta(seconds=1)))
        session.flush()
        assert app.get_next_flow_id(session) == flow1.flow_id, "Should be 1st flow when last execution was last flow"
        session.rollback()


def test_route_flow_detail_next():
    with SessionLocal() as session:
        flow1 = models.Flow(level=1, name="A")
        flow_exercises = create_flow_exercises(flow1, 2)
        w1 = models.Workout(lecture_id=1, n_sets=2, n_reps=1, durations="10;10", flow=flow1)

        session.add_all(flow_exercises + [w1])
        session.flush()

        flow_is = app.route_flow_detail_next(session)
        assert flow_is.flow_id == flow1.flow_id


def test_route_workouts_detail():
    with SessionLocal() as session:
        flow1 = models.Flow(level=1, name="A")
        flow_exercises = create_flow_exercises(flow1, 2)
        w1 = models.Workout(lecture_id=1, n_sets=2, n_reps=1, durations="10;10", flow=flow1)

        session.add_all(flow_exercises + [w1])
        session.flush()

        workout_is = app.route_workouts_detail(w1.workout_id, session)

        assert workout_is.workout_id == w1.workout_id
        assert workout_is.durations == [10, 10]
        assert workout_is.flow.exercises[0] == schemas.ExerciseBase.model_validate(flow_exercises[0].exercise)

        expected = schemas.ExerciseBase.model_validate(flow_exercises[0].exercise).model_dump()
        expected["duration"] = 10
        assert workout_is.model_dump()["exercises"][0] == expected

        with pytest.raises(fastapi.HTTPException) as err:
            app.route_workouts_detail(99, session)
        assert err.value.status_code == 404


def test_route_executions():
    with SessionLocal() as session:
        log_is = app.route_executions(session)
        assert log_is == schemas.Log(max_streak=0, cur_streak=0, weekday_count={i: 0 for i in range(7)}, total=0)

        flow1 = models.Flow(level=1, name="A")
        flow_exercises = create_flow_exercises(flow1, 2)
        w1 = models.Workout(lecture_id=1, n_sets=2, n_reps=1, durations="10;10", flow=flow1)
        w2 = models.Workout(lecture_id=2, n_sets=2, n_reps=2, durations="10;10", flow=flow1)

        time = datetime.datetime.now(datetime.UTC)
        ex1 = models.Execution(workout=w1, finished_at=time)
        ex2 = models.Execution(workout=w1, finished_at=time + datetime.timedelta(days=1))
        ex3 = models.Execution(workout=w2, finished_at=time + datetime.timedelta(days=3))

        session.add_all(flow_exercises + [ex1, ex2, ex3])
        session.flush()

        log_is = app.route_executions(session)
        assert log_is.max_streak == 2
        assert log_is.cur_streak == 1
        assert log_is.total == 3


def test_route_add_execution():
    with SessionLocal() as session:
        flow1 = models.Flow(level=1, name="A")
        flow_exercises = create_flow_exercises(flow1, 2)
        w1 = models.Workout(lecture_id=1, n_sets=2, n_reps=1, durations="10;10", flow=flow1)
        session.add_all(flow_exercises + [w1])
        session.flush()

        workout_post = schemas.WorkoutPost(workout_id=w1.workout_id)
        app.route_add_execution(workout_post, session)

        executions = session.query(models.Execution).all()
        assert len(executions) == 1
        assert executions[0].workout_id == w1.workout_id
