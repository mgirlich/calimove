from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from scrape.schemas import FlowName
from scrape.db import Base


class Workout(Base):
    __tablename__ = "workouts"

    workout_id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True)
    lecture_id: Mapped[int] = mapped_column(unique=True)
    flow_id = mapped_column(ForeignKey("flows.flow_id"))
    day: Mapped[int]
    duration: Mapped[int]
    n_sets: Mapped[Optional[int]]

    flow: Mapped["Flow"] = relationship(back_populates="workouts")
    workout_exercises: Mapped[list["WorkoutExercise"]] = relationship(back_populates="workout")


class Flow(Base):
    __tablename__ = "flows"
    __table_args__ = (
        UniqueConstraint('level', 'name'),
    )

    flow_id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True)
    level: Mapped[int]
    name: Mapped[FlowName]

    flow_exercises: Mapped[list["FlowExercise"]] = relationship(back_populates="flow")
    workouts: Mapped["Workout"] = relationship(back_populates="flow")


class FlowExercise(Base):
    __tablename__ = "flow_exercises"

    flow_id = mapped_column(ForeignKey("flows.flow_id"), primary_key=True)
    exercise_id = mapped_column(ForeignKey("exercises.exercise_id"), primary_key=True)
    position: Mapped[int]

    flow: Mapped["Flow"] = relationship(back_populates="flow_exercises")
    exercise: Mapped["Exercise"] = relationship(back_populates="flows")


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    workout_id = mapped_column(ForeignKey("workouts.workout_id"), primary_key=True)
    position: Mapped[int] = mapped_column(primary_key=True)
    exercise_name: Mapped[Optional[str]]
    duration: Mapped[Optional[int]]
    n_reps: Mapped[Optional[int]]

    workout: Mapped["Workout"] = relationship(back_populates="workout_exercises")


class Exercise(Base):
    __tablename__ = "exercises"

    exercise_id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True)
    lecture_id: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str] = mapped_column(unique=True)
    duration: Mapped[int]
    mod_lecture_id: Mapped[Optional[int]]

    flows: Mapped[list["FlowExercise"]] = relationship(back_populates="exercise")
