export interface FlowBase {
  flow_id: number;
  level: number;
  name: string;
}

export interface Exercise {
  exercise_id: number;
  lecture_id: number;
  name: string;
  mod_lecture_id: number;
  flows: Array<FlowBase>;
}
