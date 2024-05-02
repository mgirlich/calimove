from pydantic import BaseModel
from enum import Enum, auto
from typing import Literal

FlowName = Literal['A', 'B', 'C', 'D']


class SectionType(Enum):
    other = auto()
    workout = auto()
    flow = auto()
    mod = auto()


class LectureBase(BaseModel):
    lecture_id: int
    title: str
    duration: int


class Section(BaseModel):
    title: str
    type: SectionType
    lectures: list[LectureBase]


class Mod(BaseModel):
    name: str
    lecture_id: int


class Exercise(BaseModel):
    name: str
    lecture_id: int
    duration: int
    mod_lecture_id: int | None = None


class NumberedExercise(Exercise):
    position: int


class FlowId(BaseModel, frozen=True):
    level: int
    name: FlowName


class Flow(FlowId):
    numbered_exercises: list[NumberedExercise]


class Workout(BaseModel):
    lecture_id: int
    flow_id: FlowId
    day: int
    duration: int


class Curriculum(BaseModel):
    mods: list[Mod]
    flows: list[Flow]
    workouts: list[LectureBase]
