export interface MapColumn {
  id: string;
  columnType: "average" | "total" | "header";
  max?: number;
  min?: number;
  average?: number;
  total?: number;
}
