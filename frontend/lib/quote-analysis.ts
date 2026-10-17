export type CargoPieceInfo = {
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  quantity: number | null;
  grossWeightKg: number | null;
  sourceText: string | null;
};

export type MailAnalysisResponse = {
  destination: string | null;
  cargo: {
    packageCount: number | null;
    grossWeightKg: number | null;
    cargoType: string | null;
    stackable: boolean | null;
    pieces: CargoPieceInfo[];
    sourceText: string | null;
  } | null;
  destinations: { name: string | null; code: string | null; sourceText: string | null }[];
  requestedWarehouseDate: string | null;
  quotes: {
    vendor: string | null;
    type: string | null;
    offers: {
      airline: string | null;
      rate: {
        basis: string | null;
        as_weight: number | null;
        unit_price: number | null;
        minimum: number | null;
        normal_rate: number | null;
        currency: string | null;
      } | null;
      surcharges: {
        fsc: { amount: number | null; unit: string | null } | null;
        thc: { amount: number | null; unit: string | null } | null;
        ams: { amount: number | null; currency: string | null; basis: string | null } | null;
        mcc: { amount: number | null; currency: string | null; condition: string | null } | null;
        other: { code: string | null; amount: number | null; currency: string | null; basis: string | null }[];
      } | null;
      routing: { transit: boolean | null; via: string | null } | null;
      schedule: { frequency: string | null; days: number[] } | null;
      transit_time: { min_days: number | null; max_days: number | null } | null;
      conditions: string[];
      raw: string | null;
    }[];
  }[];
  warnings: { field: string | null; source: string | null; message: string | null }[];
};

export type QuoteAnalysisSummary = {
  id: string;
  createdAt: string;
  title: string;
  detail: string;
};

export type QuoteAnalysisRecord = QuoteAnalysisSummary & {
  shipperMail: string;
  consoleMail: string;
  shipperImagePath: string | null;
  consoleImagePath: string | null;
  cargoSettings: string;
  analysis: MailAnalysisResponse;
};
