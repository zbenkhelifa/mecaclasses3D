export enum PartType {
  FRAME = 'FRAME',
  CRANK = 'CRANK',
  ROD = 'ROD',
  PISTON = 'PISTON',
  UNKNOWN = 'UNKNOWN'
}

export interface EquivalenceClass {
  id: PartType;
  name: string;
  color: string;
  description: string;
  parts: string[];
}

export interface CourseSection {
  id: string;
  title: string;
  content: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface StudentResult {
  id: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  date: string;
}

export enum JointType {
  PIVOT = 'PIVOT',
  GLISSIERE = 'GLISSIERE',
  PIVOT_GLISSANT = 'PIVOT_GLISSANT',
  ROTULE = 'ROTULE',
  ENCASTREMENT = 'ENCASTREMENT',
  APPUI_PLAN = 'APPUI_PLAN'
}

export interface DegreeOfFreedom {
  tx: boolean;
  ty: boolean;
  tz: boolean;
  rx: boolean;
  ry: boolean;
  rz: boolean;
}

export interface KinematicJoint {
  id: JointType;
  name: string;
  description: string;
  dof: DegreeOfFreedom; // Degrees of Freedom (1 = true, 0 = false)
}
