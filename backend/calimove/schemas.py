from pydantic import BaseModel, ConfigDict


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
