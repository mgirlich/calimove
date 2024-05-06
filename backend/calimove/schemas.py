from typing import Annotated

from pydantic import BaseModel, ConfigDict, BeforeValidator, computed_field

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
