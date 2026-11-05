export interface SalesOrder {
  id: string;
  quarter: string;
  region: string;
  channel: string;
  product: string;
  units: number;
  discount_pct: number;
  revenue: number;
}

export interface CSVParseResult {
  orders: SalesOrder[];
  errors: string[];
  warnings: string[];
  rawRowCount: number;
  validRowCount: number;
}

export interface RegionQuarterMatrix {
  regions: string[];
  quarters: string[];
  data: Record<string, Record<string, number>>; // [region][quarter] = revenue
  unitsData: Record<string, Record<string, number>>; // [region][quarter] = units
  discountData: Record<string, Record<string, { totalDiscountTimesRev: number; totalRev: number }>>;
  regionTotals: Record<string, number>;
  quarterTotals: Record<string, number>;
  grandTotal: number;
}

export interface ProductChannelShift {
  name: string;
  q2Revenue: number;
  q3Revenue: number;
  revenueChange: number;
  pctChange: number;
  q2Units: number;
  q3Units: number;
  unitChange: number;
}

export interface RegionVarianceAnalysis {
  region: string;
  q2Revenue: number;
  q3Revenue: number;
  dollarChange: number;
  pctChange: number;
  absDollarChange: number;
  direction: 'increase' | 'decrease' | 'neutral';
  q2Units: number;
  q3Units: number;
  unitChange: number;
  q2AvgDiscountPct: number;
  q3AvgDiscountPct: number;
  discountChangePctPoints: number;
  topProductDrivers: Array<{
    product: string;
    q2Rev: number;
    q3Rev: number;
    revChange: number;
    q2Units: number;
    q3Units: number;
  }>;
  topChannelDrivers: Array<{
    channel: string;
    q2Rev: number;
    q3Rev: number;
    revChange: number;
  }>;
}

export interface SummaryCalculationFacts {
  mostChangedRegion: RegionVarianceAnalysis;
  allRegionsQ2Q3: Array<{
    region: string;
    q2Revenue: number;
    q3Revenue: number;
    dollarChange: number;
    pctChange: number;
    absDollarChange: number;
  }>;
  totalQ2Revenue: number;
  totalQ3Revenue: number;
}
