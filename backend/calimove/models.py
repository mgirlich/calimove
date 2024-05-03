from datetime import datetime
from typing import Optional, Literal

import sqlalchemy as sa
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from calimove.db import Base

FlowName = Literal['A', 'B', 'C', 'D']


class Workout(Base):
    __tablename__ = "workouts"

    workout_id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True)
    lecture_id: Mapped[int] = mapped_column(unique=True)
    flow_id = mapped_column(ForeignKey("flows.flow_id"))
    n_sets: Mapped[int]
    n_reps: Mapped[int]
    # an array would fit better but SQLite doesn't support arrays and DuckDB isn't properly supported by SQLAlchemy
    durations: Mapped[str]
    skip: Mapped[bool] = mapped_column(server_default=sa.false())

    flow: Mapped["Flow"] = relationship(back_populates="workouts_all")

    UniqueConstraint("flow_id", "n_sets", "n_reps", "durations")


class Flow(Base):
    __tablename__ = "flows"

    flow_id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True)
    level: Mapped[int]
    name: Mapped[FlowName]

    workouts_all: Mapped[list["Workout"]] = relationship(back_populates="flow")
    workouts: Mapped[list["Workout"]] = relationship(
        primaryjoin="and_(Workout.flow_id == Flow.flow_id, Workout.skip == False)",
        viewonly=True
    )
    exercises: Mapped[list["Exercise"]] = relationship(
        secondary="flow_exercises",
        order_by="FlowExercise.position",
        viewonly=True
    )

    UniqueConstraint("level", "name")


class FlowExercise(Base):
    __tablename__ = "flow_exercises"

    flow_id = mapped_column(ForeignKey("flows.flow_id"), primary_key=True)
    exercise_id = mapped_column(ForeignKey("exercises.exercise_id"), primary_key=True)
    position: Mapped[int]

    flow: Mapped["Flow"] = relationship()
    exercise: Mapped["Exercise"] = relationship()


class Exercise(Base):
    __tablename__ = "exercises"

    exercise_id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True)
    lecture_id: Mapped[int] = mapped_column(unique=True)
    name: Mapped[str] = mapped_column(unique=True)
    mod_lecture_id: Mapped[Optional[int]] = mapped_column(unique=True)

    flows: Mapped[list["Flow"]] = relationship(back_populates="exercises", secondary="flow_exercises", viewonly=True)


class Execution(Base):
    __tablename__ = "executions"

    execution_id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True)
    workout_id = mapped_column(ForeignKey("workouts.workout_id"))
    finished_at: Mapped[datetime] = mapped_column(server_default=sa.func.now())

    workout: Mapped["Workout"] = relationship()
