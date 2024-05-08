export interface FlowBase {
  flow_id: number;
  level: number;
  name: string;
}

export interface ExerciseBase {
  exercise_id: number;
  lecture_id: number;
  name: string;
  mod_lecture_id?: number;
}

export interface Exercise extends ExerciseBase {
  flows: Array<FlowBase>;
}

export interface WorkoutExercise extends ExerciseBase {
  duration: number;
}

export interface Flow extends FlowBase {
  exercises: Array<ExerciseBase>
}

export interface Execution {
  execution_id: number;
  level: number;
  name: string;
  finished_at: Date;
}
