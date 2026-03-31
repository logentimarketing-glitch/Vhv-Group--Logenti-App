export type CandidateStage = "Nuevo" | "Filtro IA" | "Entrevista" | "Descartado";

export type Candidate = {
  id: string;
  name: string;
  email: string;
  role: string;
  stage: CandidateStage;
  score: number;
  tags: string[];
  notes: string;
};
