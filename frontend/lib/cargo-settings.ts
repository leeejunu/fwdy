export type CargoCalculationSettings = {
  volumeDivisor: string;
  roundUnit: "1" | "0.5" | "0.1" | "none";
  cwMethod: "max" | "gross" | "volume";
  stackability: "from_mail" | "stackable" | "non_stackable";
  thcAmount: string;
  thcBasis: "bl" | "awb" | "kg" | "rt" | "shipment";
};

export const DEFAULT_CARGO_CALCULATION_SETTINGS: CargoCalculationSettings = {
  volumeDivisor: "6000",
  roundUnit: "1",
  cwMethod: "max",
  stackability: "from_mail",
  thcAmount: "",
  thcBasis: "bl",
};

export function parseCargoCalculationSettings(value: string | null): CargoCalculationSettings {
  if (!value) return DEFAULT_CARGO_CALCULATION_SETTINGS;

  try {
    const candidate = JSON.parse(value) as Partial<CargoCalculationSettings>;
    const divisor = Number(candidate.volumeDivisor);
    return {
      volumeDivisor: Number.isFinite(divisor) && divisor > 0 ? String(divisor) : DEFAULT_CARGO_CALCULATION_SETTINGS.volumeDivisor,
      roundUnit: ["1", "0.5", "0.1", "none"].includes(candidate.roundUnit ?? "")
        ? candidate.roundUnit as CargoCalculationSettings["roundUnit"]
        : DEFAULT_CARGO_CALCULATION_SETTINGS.roundUnit,
      cwMethod: ["max", "gross", "volume"].includes(candidate.cwMethod ?? "")
        ? candidate.cwMethod as CargoCalculationSettings["cwMethod"]
        : DEFAULT_CARGO_CALCULATION_SETTINGS.cwMethod,
      stackability: ["from_mail", "stackable", "non_stackable"].includes(candidate.stackability ?? "")
        ? candidate.stackability as CargoCalculationSettings["stackability"]
        : DEFAULT_CARGO_CALCULATION_SETTINGS.stackability,
      thcAmount: typeof candidate.thcAmount === "string" ? candidate.thcAmount : DEFAULT_CARGO_CALCULATION_SETTINGS.thcAmount,
      thcBasis: ["bl", "awb", "kg", "rt", "shipment"].includes(candidate.thcBasis ?? "")
        ? candidate.thcBasis as CargoCalculationSettings["thcBasis"]
        : DEFAULT_CARGO_CALCULATION_SETTINGS.thcBasis,
    };
  } catch {
    return DEFAULT_CARGO_CALCULATION_SETTINGS;
  }
}
