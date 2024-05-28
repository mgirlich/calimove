import collections
import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, BeforeValidator, computed_field, model_serializer

TIME_BETWEEN_EXERCISES = 15
TIME_BEFORE_FIRST_EXERCISE = 10 + 6
TIME_AFTER_LAST_EXERCISE = 3


class ExerciseBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    exercise_id: int
    lecture_id: int
    name: str
    mod_lecture_id: int | None


class Exercise(ExerciseBase):
    flows: list["FlowBase"] = []


class FlowBase(BaseModel):
    flow_id: int
    level: int
    name: str


class Flow(FlowBase):
    exercises: list[ExerciseBase]


class FlowDetail(Flow):
    workouts: list["WorkoutBase"]


def parse_durations(x):
    if isinstance(x, str):
        x = x.split(";")
    return x


class WorkoutBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    workout_id: int
    lecture_id: int
    n_sets: int
    n_reps: int
    durations: Annotated[list[int], BeforeValidator(parse_durations)]
    flow: "FlowBase"

    @computed_field
    @property
    def time_active(self) -> int:
        return self.n_sets * self.n_reps * sum(self.durations)

    @computed_field
    @property
    def time_break(self) -> int:
        n_breaks = self.n_sets * self.n_reps * len(self.durations) - 1
        return TIME_BEFORE_FIRST_EXERCISE + TIME_BETWEEN_EXERCISES * n_breaks + TIME_AFTER_LAST_EXERCISE


class WorkoutExercise(ExerciseBase):
    duration: int


class WorkoutDetail(WorkoutBase):
    flow: "Flow"

    @model_serializer
    def ser_model(self):
        exercises = [
            WorkoutExercise(**ex.model_dump(), duration=dur)
            for ex, dur in zip(self.flow.exercises, self.durations)
        ]
        return dict(
            workout_id=self.workout_id,
            lecture_id=self.lecture_id,
            n_sets=self.n_sets,
            n_reps=self.n_reps,
            flow=FlowBase.model_validate(self.flow.model_dump()),
            exercises=exercises
        )


class WorkoutPost(BaseModel):
    workout_id: int


class Execution(BaseModel):
    execution_id: int
    level: int
    name: str
    finished_at: datetime.datetime


class Log(BaseModel):
    max_streak: int
    cur_streak: int
    weekday_count: collections.OrderedDict[int, int]
    total: int
