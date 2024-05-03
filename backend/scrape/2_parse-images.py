import easyocr
import sqlalchemy as sa
from PIL import Image
import db
import models as models
import pathlib
from pydantic import BaseModel

# convert `gif` to `png`
WIDTH = 1000
HEIGHT = 547
original_images_dir = "../rawdata/images/original"
names_images_dir = "../rawdata/images/exercise-names"
example_images_dir = "../rawdata/images/examples"
reps_images_dir = "../rawdata/images/reps"


class ExerciseImageData(BaseModel):
    name: str
    duration: int
    reps: int


def crop_exercise_image(img: Image,
                        path_new: pathlib.Path,
                        left: int,
                        upper: int,
                        right: int,
                        lower: int):
    img_cropped = img.crop((left, upper, right, lower))
    img_cropped.save(path_new, optimize=True, quality=70)

    return path_new


def detect_sets(reader: easyocr.Reader, filename: str):
    path = pathlib.Path(original_images_dir).joinpath(filename)
    _, text, _ = reader.readtext(str(path), allowlist='12X')[1]
    if text == "1X" or text == "IX":
        n_sets = 1
    elif text == "2X":
        n_sets = 2
    else:
        raise Exception(f"Invalid sets: {text}")

    return n_sets


def extract_exercise_image_data(reader: easyocr.Reader, filename) -> ExerciseImageData:
    path = pathlib.Path(original_images_dir).absolute().joinpath(filename)
    img = Image.open(path)

    num_col_width = 154
    name_row_height = 136
    path_exercise_name = pathlib.Path(names_images_dir).joinpath(filename).with_suffix(".png")
    name_img_path = crop_exercise_image(
        img,
        path_new=path_exercise_name,
        left=num_col_width,
        upper=0,
        right=WIDTH,
        lower=name_row_height,
    )
    _, name, _ = reader.readtext(str(name_img_path))[0]

    picture_width = 300
    picture_height = 378
    row2_upper = name_row_height + 2
    row2_lower = row2_upper + picture_height

    path_example = pathlib.Path(example_images_dir).joinpath(filename).with_suffix(".png")
    crop_exercise_image(
        img,
        path_new=path_example,
        left=num_col_width,
        upper=row2_upper,
        right=num_col_width + picture_width,
        lower=row2_lower,
    )

    path_reps = pathlib.Path(reps_images_dir).joinpath(filename).with_suffix(".png")
    reps_img_path = crop_exercise_image(
        img,
        path_new=path_reps,
        left=num_col_width + picture_width,
        upper=row2_upper,
        right=WIDTH,
        lower=row2_lower,
    )

    duration, reps, _ = reader.readtext(str(reps_img_path))

    duration = int(duration[1].split(" ")[0])
    if reps[1] == "IX" or reps[1] == "1X":
        reps = 1
    elif reps[1] == "2X":
        reps = 2
    elif reps[1] == "3X":
        reps = 3
    else:
        raise Exception(f"Invalid reps {reps}")

    return ExerciseImageData(name=name, duration=duration, reps=reps)


def check_similar_name(db_name: str, parsed_name: str):
    if len(db_name) != len(parsed_name):
        raise Exception(f"db nam {db_name} and parsed name {parsed_name} have different length")

    n_diff = sum(l1 != l2 for l1, l2 in zip(db_name, parsed_name))
    if n_diff > 2:
        raise Exception(f"db nam {db_name} and parsed name {parsed_name} are too different")


def ocr_images():
    with db.SessionLocal() as session:
        reader = easyocr.Reader(['en'])

        workouts_models = session.query(models.Workout).all()
        for workout_model in workouts_models:
            filename = f"lecture-{workout_model.lecture_id}-n_sets.png"
            n_sets = detect_sets(reader, filename)
            workout_model.n_sets = n_sets
        session.commit()

        flow_exercises = (
            session.query(
                models.Workout.lecture_id,
                models.FlowExercise.position,
                models.Exercise.name,
            )
            .select_from(models.Workout)
            .join(models.Flow)
            .join(models.FlowExercise)
            .join(models.Exercise)
            .order_by(models.Workout.lecture_id, models.FlowExercise.position)
        ).all()
        for flow_exercise in flow_exercises:
            lecture_id = flow_exercise.lecture_id
            position = flow_exercise.position

            filename = f"lecture-{lecture_id}-exercise-{position}.gif"
            image_data = extract_exercise_image_data(reader, filename)

            workout = session.query(models.Workout).filter_by(lecture_id=lecture_id).one()
            workout_exercise_model = models.WorkoutExercise(
                workout_id=workout.workout_id,
                position=position,
                exercise_name=image_data.name,
                duration=image_data.duration,
                n_reps=image_data.reps
            )
            session.add(workout_exercise_model)
            session.commit()


def detect_bad_names():
    with db.SessionLocal() as session:
        # Then do some manual corrections, in particular replace many `C` by `G`...
        bad_name_query = (
            sa.select(
                models.WorkoutExercise.exercise_name.label("ocr_name"),
                models.Exercise.name.label("exercise_name"),
            )
            .distinct()
            .select_from(models.WorkoutExercise)
            .join(models.Exercise, onclause=models.WorkoutExercise.exercise_name == models.Exercise.name, isouter=True)
            .filter(models.Exercise.name.is_(None))
            .order_by(models.WorkoutExercise.exercise_name)
        )

        bad_names = session.execute(bad_name_query).all()
        for set_name, exercise_name in bad_names:
            print(f"{set_name}")


def fix_names():
    with db.SessionLocal() as session:
        # And use the same names in the explanations and the parsed exercise images
        word_fixes = [
            {"from": "30", "to": "3D"},
            {"from": "BRIDCE", "to": "BRIDGE"},
            {"from": "BACKBRIDCE", "to": "BACK BRIDGE"},
            {"from": "BACKBRIDGE", "to": "BACK BRIDGE"},
            {"from": "DOC", "to": "DOG"},
            {"from": "EVE", "to": "EYE"},
            {"from": "FIC", "to": "FIGURE"},
            {"from": "FIG", "to": "FIGURE"},
            {"from": "FICURE", "to": "FIGURE"},
            {"from": "FROC", "to": "FROG"},
            {"from": "KNEELINC", "to": "KNEELING"},
            {"from": "LEC", "to": "LEG"},
            {"from": "LUNCE", "to": "LUNGE"},
            {"from": "LYINC", "to": "LYING"},
            {"from": "SCAP", "to": "SCAPULA"},
            {"from": "QUAD", "to": "QUADRUPED"},
            {"from": "QUADR.", "to": "QUADRUPED"},
            {"from": "SECMENT", "to": "SEGMENT"},
            {"from": "SINCLE", "to": "SINGLE"},
            {"from": "STANDINC", "to": "STANDING"},
            {"from": "TRIANCLE", "to": "TRIANGLE"},
            {"from": "WIRST", "to": "WRIST"},
        ]

        for word_fix in word_fixes:
            sql = sa.text(f"""
                UPDATE workout_exercises
                SET exercise_name = REPLACE(exercise_name, '{word_fix["from"]}', '{word_fix["to"]}') 
                WHERE LOWER(exercise_name) LIKE '%{word_fix["from"]} %' OR LOWER(exercise_name) LIKE '%{word_fix["from"]}'
                """)
            session.execute(sql)
        session.commit()

        name_fixes = [
            {'from': 'DOG TO PIKE REACH', 'to': 'DOG AND PIKE REACH'},
            {'from': 'EASY BRIDGE PIKE SIT', 'to': 'EASY BRIDGE TO PIKE SIT'},
            {'from': 'ELBOW CIRCLE CC', 'to': 'ELBOW CIRCLES CC'},
            {'from': 'ELBOW CIRCLE OC', 'to': 'ELBOW CIRCLES OC'},
            {'from': 'ELBOW PIT ROTATION CC', 'to': 'ELBOW PIT ROTATIONS CC'},
            {'from': 'ELBOW PIT ROTATION OC', 'to': 'ELBOW PIT ROTATIONS OC'},
            {'from': 'ELBOW SIDE CIRCLE', 'to': 'ELBOW SIDE CIRCLES'},
            {'from': 'HIp FIGURE 8', 'to': 'HIP FIGURE 8'},
            {'from': 'KTG LUNGE', 'to': 'KTG LUNGES'},
            {'from': 'LYING STICK DISLOCATION', 'to': 'LYING STICK DISLOCATIONS'},
            {'from': 'SEGMENT SPINE MOBILISATION', 'to': 'SEGMENT SPINE MOBILIZATION'},
            {'from': 'STANDING SCALE TOUCHES', 'to': 'STANDING SCALE TOUCH CIRCLE'},
        ]

        for name_fix in name_fixes:
            sql = sa.text(f"""
                UPDATE workout_exercises
                SET exercise_name = '{name_fix["to"]}' 
                WHERE exercise_name = '{name_fix["from"]}'
                """)
            session.execute(sql)
        session.commit()


def check_data():
    with db.SessionLocal() as session:
        # check that the parsed workout exercises always have the same order in a flow
        unique_workout_exercise_position_names = (
            sa.select(
                models.Flow.flow_id,
                models.WorkoutExercise.position,
                models.WorkoutExercise.exercise_name
            )
            .select_from(models.Workout)
            .join(models.WorkoutExercise)
            .join(models.Flow)
            .distinct()
            .subquery()
        )

        workout_exercise_duplicated_positions = session.execute(
            sa.select(unique_workout_exercise_position_names)
            .group_by(unique_workout_exercise_position_names.c["flow_id", "position"])
            .having(sa.func.count(1) > 1)
        ).all()
        print(workout_exercise_duplicated_positions)

        flow_workout_exercises_mismatch = session.execute(
            sa.select(
                models.FlowExercise.flow_id,
                models.FlowExercise.position,
                models.Exercise.name.label("flow_exercise"),
                models.WorkoutExercise.exercise_name.label("workout_exercise"),
                sa.func.min(models.Workout.lecture_id),
            )
            .select_from(models.FlowExercise)
            .join(models.Exercise)
            .join(models.Workout, onclause=models.Workout.flow_id == models.FlowExercise.flow_id)
            .join(models.WorkoutExercise, onclause=sa.and_(
                models.Workout.workout_id == models.WorkoutExercise.workout_id,
                models.WorkoutExercise.position == models.FlowExercise.position
            ))
            .filter(models.Exercise.name != models.WorkoutExercise.exercise_name)
            .group_by(
                models.FlowExercise.flow_id,
                models.FlowExercise.position,
                models.Exercise.name,
                models.WorkoutExercise.exercise_name,
            )
            .order_by(models.FlowExercise.flow_id, models.FlowExercise.position)
        ).all()

        for row in flow_workout_exercises_mismatch:
            print(row)


if __name__ == "__main__":
    ocr_images()
    detect_bad_names()
    fix_names()
    check_data()

    # the order in the curriculum doesn't fit the actual exercises -> use the order of the workout exercise for the flow
