export type ToolType =
  | "pencil"
  | "rect"
  | "circle"
  | "line"
  | "arrow"
  | "text"
  | "eraser";

export interface Point {
  x: number;
  y: number;
}

export interface CanvasElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: Point[];
  text?: string;
  color: string;
  strokeWidth: number;
  fill?: boolean;
}

export interface WhiteboardProps {
  roomId: string;
  initialElements?: string;
  send: (type: string, payload: any) => void;
  on: (type: string, handler: (payload: any) => void) => () => void;
}
