export type HourCondition = "Clear" | "Clouds" | "Rain" | "Snow" | "Thunder" | "Unknown";

export type HourDatum = {
  iso: string;
  hourLabel: string;
  tempF: number;
  condition: HourCondition;
};

export type Intent = string;