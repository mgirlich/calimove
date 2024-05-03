from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .context import app, models


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
