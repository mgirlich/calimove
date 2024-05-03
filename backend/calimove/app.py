from typing import Annotated

import sqlalchemy as sa
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from starlette import status

import calimove.models as models
import calimove.schemas as schemas
from calimove.db import SessionLocal

app = FastAPI()

origins = [
    'http://localhost:9000',
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]


@app.get("/exercises", status_code=status.HTTP_200_OK)
def route_exercises(db: db_dependency) -> list[schemas.Exercise]:
    exercise_models = db.execute(
        sa.select(models.Exercise)
        .options(sa.orm.immediateload(models.Exercise.flows))
    ).scalars().all()
    exercises = [schemas.Exercise.model_validate(model, from_attributes=True) for model in exercise_models]

    exercises = sorted(exercises, key=lambda elt: elt.name)
    for exercise in exercises:
        exercise.flows = sorted(exercise.flows, key=lambda elt: (elt.level, elt.name))

    return exercises


@app.get("/flows", status_code=status.HTTP_200_OK)
def route_flows(db: db_dependency) -> list[schemas.Flow]:
    flow_models = db.execute(
        sa.select(models.Flow)
        .options(sa.orm.immediateload(models.Flow.exercises))
    ).scalars().all()
    flows = [schemas.Flow.model_validate(model, from_attributes=True) for model in flow_models]

    flows = sorted(flows, key=lambda elt: elt.flow_id)
    return flows
