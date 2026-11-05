import { SalesOrder, RegionQuarterMatrix, RegionVarianceAnalysis, SummaryCalculationFacts } from '../types/sales';
import { normalizeCategoryName } from './csvParser';

/**
 * Standard quarter sorter (Q1 -> Q2 -> Q3 -> Q4 ...)
 */
export function sortQuarters(quarters: string[]): string[] {
  const quarterRank = (q: string): number => {
    const m = q.match(/Q?([1-4])/i);
    if (m) return parseInt(m[1], 10);
    return 99;
  };
  return [...quarters].sort((a, b) => quarterRank(a) - quarterRank(b));
}

/**
 * Build the complete Region x Quarter matrix from sales orders
 */
export function buildRegionQuarterMatrix(orders: SalesOrder[]): RegionQuarterMatrix {
  const regionsSet = new Set<string>();
  const quartersSet = new Set<string>();

  orders.forEach(order => {
    const region = normalizeCategoryName(order.region);
    if (region) regionsSet.add(region);
    if (order.quarter) quartersSet.add(order.quarter);
  });

  const regions = Array.from(regionsSet).sort();
  const quarters = sortQuarters(Array.from(quartersSet));

  const data: Record<string, Record<string, number>> = {};
  const unitsData: Record<string, Record<string, number>> = {};
  const discountData: Record<string, Record<string, { totalDiscountTimesRev: number; totalRev: number }>> = {};

  const regionTotals: Record<string, number> = {};
  const quarterTotals: Record<string, number> = {};
  let grandTotal = 0;

  // Initialize data structures
  regions.forEach(r => {
    data[r] = {};
    unitsData[r] = {};
    discountData[r] = {};
    regionTotals[r] = 0;
    quarters.forEach(q => {
      data[r][q] = 0;
      unitsData[r][q] = 0;
      discountData[r][q] = { totalDiscountTimesRev: 0, totalRev: 0 };
    });
  });

  quarters.forEach(q => {
    quarterTotals[q] = 0;
  });

  // Aggregate orders
  orders.forEach(order => {
    const region = normalizeCategoryName(order.region);
    const { quarter, revenue, units, discount_pct } = order;
    if (!data[region]) return;

    data[region][quarter] = (data[region][quarter] || 0) + revenue;
    unitsData[region][quarter] = (unitsData[region][quarter] || 0) + units;

    const discObj = discountData[region][quarter];
    if (discObj) {
      discObj.totalDiscountTimesRev += (discount_pct * Math.max(0, revenue));
      discObj.totalRev += Math.max(0, revenue);
    }

    regionTotals[region] = (regionTotals[region] || 0) + revenue;
    quarterTotals[quarter] = (quarterTotals[quarter] || 0) + revenue;
    grandTotal += revenue;
  });

  return {
    regions,
    quarters,
    data,
    unitsData,
    discountData,
    regionTotals,
    quarterTotals,
    grandTotal,
  };
}

/**
 * Analyze Q2 to Q3 changes across all regions and identify the top changing region
 */
export function analyzeQ2ToQ3Variance(orders: SalesOrder[]): {
  analyses: RegionVarianceAnalysis[];
  mostChangedRegion: RegionVarianceAnalysis | null;
  calculationFacts: SummaryCalculationFacts | null;
} {
  const matrix = buildRegionQuarterMatrix(orders);
  const { regions } = matrix;

  const hasQ2 = matrix.quarters.includes('Q2');
  const hasQ3 = matrix.quarters.includes('Q3');

  if (!hasQ2 || !hasQ3 || regions.length === 0) {
    return {
      analyses: [],
      mostChangedRegion: null,
      calculationFacts: null,
    };
  }

  // Aggregate product & channel details specifically for Q2 and Q3
  const productMap: Record<string, Record<string, { q2Rev: number; q3Rev: number; q2Units: number; q3Units: number }>> = {};
  const channelMap: Record<string, Record<string, { q2Rev: number; q3Rev: number }>> = {};

  orders.forEach(o => {
    if (o.quarter !== 'Q2' && o.quarter !== 'Q3') return;

    const region = normalizeCategoryName(o.region);
    const product = normalizeCategoryName(o.product);
    const channel = normalizeCategoryName(o.channel);

    if (!productMap[region]) productMap[region] = {};
    if (!productMap[region][product]) {
      productMap[region][product] = { q2Rev: 0, q3Rev: 0, q2Units: 0, q3Units: 0 };
    }

    if (!channelMap[region]) channelMap[region] = {};
    if (!channelMap[region][channel]) {
      channelMap[region][channel] = { q2Rev: 0, q3Rev: 0 };
    }

    if (o.quarter === 'Q2') {
      productMap[region][product].q2Rev += o.revenue;
      productMap[region][product].q2Units += o.units;
      channelMap[region][channel].q2Rev += o.revenue;
    } else if (o.quarter === 'Q3') {
      productMap[region][product].q3Rev += o.revenue;
      productMap[region][product].q3Units += o.units;
      channelMap[region][channel].q3Rev += o.revenue;
    }
  });

  const analyses: RegionVarianceAnalysis[] = regions.map(region => {
    const q2Revenue = matrix.data[region]?.['Q2'] || 0;
    const q3Revenue = matrix.data[region]?.['Q3'] || 0;
    const dollarChange = q3Revenue - q2Revenue;
    const absDollarChange = Math.abs(dollarChange);

    let pctChange = 0;
    if (q2Revenue !== 0) {
      pctChange = (dollarChange / q2Revenue) * 100;
    } else if (q3Revenue > 0) {
      pctChange = 100;
    }

    const direction: 'increase' | 'decrease' | 'neutral' =
      dollarChange > 0 ? 'increase' : dollarChange < 0 ? 'decrease' : 'neutral';

    const q2Units = matrix.unitsData[region]?.['Q2'] || 0;
    const q3Units = matrix.unitsData[region]?.['Q3'] || 0;
    const unitChange = q3Units - q2Units;

    // Weighted discount calculation
    const q2DiscObj = matrix.discountData[region]?.['Q2'];
    const q3DiscObj = matrix.discountData[region]?.['Q3'];

    const q2AvgDiscountPct = q2DiscObj && q2DiscObj.totalRev > 0
      ? (q2DiscObj.totalDiscountTimesRev / q2DiscObj.totalRev)
      : 0;

    const q3AvgDiscountPct = q3DiscObj && q3DiscObj.totalRev > 0
      ? (q3DiscObj.totalDiscountTimesRev / q3DiscObj.totalRev)
      : 0;

    const discountChangePctPoints = q3AvgDiscountPct - q2AvgDiscountPct;

    // Top product drivers
    const productsInRegion = productMap[region] || {};
    const productDrivers = Object.entries(productsInRegion).map(([product, d]) => ({
      product,
      q2Rev: d.q2Rev,
      q3Rev: d.q3Rev,
      revChange: d.q3Rev - d.q2Rev,
      q2Units: d.q2Units,
      q3Units: d.q3Units,
    })).sort((a, b) => Math.abs(b.revChange) - Math.abs(a.revChange));

    // Top channel drivers
    const channelsInRegion = channelMap[region] || {};
    const channelDrivers = Object.entries(channelsInRegion).map(([channel, d]) => ({
      channel,
      q2Rev: d.q2Rev,
      q3Rev: d.q3Rev,
      revChange: d.q3Rev - d.q2Rev,
    })).sort((a, b) => Math.abs(b.revChange) - Math.abs(a.revChange));

    return {
      region,
      q2Revenue,
      q3Revenue,
      dollarChange,
      pctChange,
      absDollarChange,
      direction,
      q2Units,
      q3Units,
      unitChange,
      q2AvgDiscountPct,
      q3AvgDiscountPct,
      discountChangePctPoints,
      topProductDrivers: productDrivers.slice(0, 3),
      topChannelDrivers: channelDrivers.slice(0, 3),
    };
  });

  // Sort by absolute dollar change descending
  analyses.sort((a, b) => b.absDollarChange - a.absDollarChange);

  const mostChangedRegion = analyses.length > 0 ? analyses[0] : null;

  const totalQ2Revenue = matrix.quarterTotals['Q2'] || 0;
  const totalQ3Revenue = matrix.quarterTotals['Q3'] || 0;

  const calculationFacts: SummaryCalculationFacts | null = mostChangedRegion ? {
    mostChangedRegion,
    allRegionsQ2Q3: analyses.map(a => ({
      region: a.region,
      q2Revenue: a.q2Revenue,
      q3Revenue: a.q3Revenue,
      dollarChange: a.dollarChange,
      pctChange: a.pctChange,
      absDollarChange: a.absDollarChange,
    })),
    totalQ2Revenue,
    totalQ3Revenue,
  } : null;

  return {
    analyses,
    mostChangedRegion,
    calculationFacts,
  };
}

/**
 * Currency formatter with zero decimals
 */
export function formatCurrency(amount: number): string {
  const isNeg = amount < 0;
  const abs = Math.abs(amount);
  return `${isNeg ? '-' : ''}$${Math.round(abs).toLocaleString('en-US')}`;
}

/**
 * Currency formatter with compact millions / thousands
 */
export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}k`;
  }
  return formatCurrency(amount);
}
