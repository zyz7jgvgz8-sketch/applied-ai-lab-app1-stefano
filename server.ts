import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initializing the Gemini AI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface CalculationPayload {
  mostChangedRegion: {
    region: string;
    q2Revenue: number;
    q3Revenue: number;
    dollarChange: number;
    pctChange: number;
    absDollarChange: number;
    direction: 'increase' | 'decrease';
    q2Units: number;
    q3Units: number;
    unitChange: number;
    q2AvgDiscountPct: number;
    q3AvgDiscountPct: number;
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
  };
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

// Fallback deterministic summary generator in case API key is missing or service unreachable
function generateDeterministicSummary(data: CalculationPayload['mostChangedRegion']): string {
  const formatCur = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
  const dirVerb = data.dollarChange >= 0 ? 'surged' : 'contracted';
  const dirWord = data.dollarChange >= 0 ? 'increase' : 'decrease';
  const sign = data.dollarChange >= 0 ? '+' : '-';

  const sentence1 = `${data.region} registered the largest financial variance between Q2 and Q3, as quarterly revenue ${dirVerb} by ${formatCur(data.dollarChange)} (${sign}${Math.abs(data.pctChange).toFixed(1)}%), moving from ${formatCur(data.q2Revenue)} in Q2 to ${formatCur(data.q3Revenue)} in Q3.`;

  let sentence2 = '';
  if (data.topProductDrivers.length > 0 && data.topChannelDrivers.length > 0) {
    const p = data.topProductDrivers[0];
    const c = data.topChannelDrivers[0];
    const pSign = p.revChange >= 0 ? '+' : '-';
    const cSign = c.revChange >= 0 ? '+' : '-';
    sentence2 = `This shift was primarily driven by ${p.product} revenue shifting by ${pSign}${formatCur(p.revChange)} (from ${formatCur(p.q2Rev)} in Q2 to ${formatCur(p.q3Rev)} in Q3), paired with a ${cSign}${formatCur(c.revChange)} variance across the ${c.channel} distribution channel.`;
  } else if (data.topProductDrivers.length > 0) {
    const p = data.topProductDrivers[0];
    const pSign = p.revChange >= 0 ? '+' : '-';
    sentence2 = `This performance pivot was primarily anchored by ${p.product}, which saw sales shift by ${pSign}${formatCur(p.revChange)} from ${formatCur(p.q2Rev)} in Q2 to ${formatCur(p.q3Rev)} in Q3.`;
  } else {
    sentence2 = `This ${dirWord} reflected fundamental demand shifts across the regional portfolio between the two operational quarters.`;
  }

  const unitVerb = data.unitChange >= 0 ? 'expanded' : 'declined';
  const unitSign = data.unitChange >= 0 ? '+' : '-';
  const sentence3 = `Operationally, total sales volume ${unitVerb} by ${unitSign}${Math.abs(data.unitChange).toLocaleString('en-US')} units (from ${data.q2Units.toLocaleString('en-US')} in Q2 to ${data.q3Units.toLocaleString('en-US')} in Q3), alongside an average discount level moving from ${data.q2AvgDiscountPct.toFixed(1)}% to ${data.q3AvgDiscountPct.toFixed(1)}%.`;

  return `${sentence1} ${sentence2} ${sentence3}`;
}

app.post('/api/summarize', async (req: Request, res: Response) => {
  try {
    const { mostChangedRegion, allRegionsQ2Q3, totalQ2Revenue, totalQ3Revenue } = req.body as CalculationPayload;

    if (!mostChangedRegion || !mostChangedRegion.region) {
      res.status(400).json({ error: 'Missing calculation data for mostChangedRegion' });
      return;
    }

    const formatCurrency = (val: number) => `$${Math.round(val).toLocaleString('en-US')}`;

    // Compile strict calculation facts for the model
    const factsPrompt = `
CALCULATED METRICS BY THE SALES APP:
- Identified Region with Greatest Q2 to Q3 Dollar Change: "${mostChangedRegion.region}"
- Q2 Total Revenue for ${mostChangedRegion.region}: ${formatCurrency(mostChangedRegion.q2Revenue)}
- Q3 Total Revenue for ${mostChangedRegion.region}: ${formatCurrency(mostChangedRegion.q3Revenue)}
- Dollar Variance: ${mostChangedRegion.dollarChange >= 0 ? '+' : '-'}${formatCurrency(Math.abs(mostChangedRegion.dollarChange))}
- Percentage Variance: ${mostChangedRegion.pctChange >= 0 ? '+' : ''}${mostChangedRegion.pctChange.toFixed(1)}%
- Direction: ${mostChangedRegion.direction === 'increase' ? 'Growth / Expansion' : 'Decline / Contraction'}
- Total Units Sold: ${mostChangedRegion.q2Units.toLocaleString()} units in Q2 to ${mostChangedRegion.q3Units.toLocaleString()} units in Q3 (difference: ${mostChangedRegion.unitChange >= 0 ? '+' : ''}${mostChangedRegion.unitChange.toLocaleString()} units)
- Average Discount Percentage: ${mostChangedRegion.q2AvgDiscountPct.toFixed(1)}% in Q2 to ${mostChangedRegion.q3AvgDiscountPct.toFixed(1)}% in Q3
- Product Drivers in ${mostChangedRegion.region}:
${mostChangedRegion.topProductDrivers.map(p => `  * ${p.product}: Q2 revenue ${formatCurrency(p.q2Rev)}, Q3 revenue ${formatCurrency(p.q3Rev)}, variance ${p.revChange >= 0 ? '+' : '-'}${formatCurrency(Math.abs(p.revChange))} (units: ${p.q2Units} in Q2 vs ${p.q3Units} in Q3)`).join('\n')}
- Channel Drivers in ${mostChangedRegion.region}:
${mostChangedRegion.topChannelDrivers.map(c => `  * ${c.channel}: Q2 revenue ${formatCurrency(c.q2Rev)}, Q3 revenue ${formatCurrency(c.q3Rev)}, variance ${c.revChange >= 0 ? '+' : '-'}${formatCurrency(Math.abs(c.revChange))}`).join('\n')}

OTHER REGIONAL CONTEXT FOR COMPARISON:
${allRegionsQ2Q3.map(r => `- ${r.region}: Q2 ${formatCurrency(r.q2Revenue)} -> Q3 ${formatCurrency(r.q3Revenue)} (${r.dollarChange >= 0 ? '+' : '-'}${formatCurrency(Math.abs(r.dollarChange))}, ${r.pctChange >= 0 ? '+' : ''}${r.pctChange.toFixed(1)}%)`).join('\n')}
- Overall Company Total Revenue: Q2 ${formatCurrency(totalQ2Revenue)} -> Q3 ${formatCurrency(totalQ3Revenue)}
`;

    // Attempt Gemini API call if valid key is available
    const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, '');
    const isValidKey = Boolean(
      apiKey &&
      apiKey !== 'MY_GEMINI_API_KEY' &&
      !apiKey.startsWith('MY_') &&
      apiKey.length > 20
    );

    if (isValidKey) {
      try {
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `You are an executive financial and sales analyst.
You must write an executive summary answering: "Which region changed most from Q2 to Q3, and why?"

Strictly adhere to the following rules:
1. Write EXACTLY THREE SENTENCES. Do not output fewer than 3 sentences or more than 3 sentences.
2. Use ONLY the calculated numbers provided below. Do not fabricate, round differently, or invent outside data.
3. Sentence 1: State clearly which region changed most from Q2 to Q3, citing its exact Q2 revenue, Q3 revenue, and dollar/percentage change.
4. Sentence 2: Explain why it changed, citing the top product and channel drivers with their exact calculated dollar figures.
5. Sentence 3: Describe the supporting volume or operational driver (e.g. units sold change from Q2 to Q3 or discount percentage shift) using only the given figures.
6. Return plain text only. Do not add markdown headers, bullet points, asterisks, or quotes around sentences.

${factsPrompt}`,
          config: {
            temperature: 0.1,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 3000)
        );

        const response = await Promise.race([geminiPromise, timeoutPromise]);
        const text = response.text?.trim();
        if (text) {
          res.json({
            summary: text,
            source: 'gemini',
            facts: mostChangedRegion,
          });
          return;
        }
      } catch (geminiError) {
        console.warn('Gemini API call returned error, using verified deterministic summary:', geminiError);
      }
    }

    // Fallback: verified deterministic computation matching the exact 3-sentence structure
    const fallbackText = generateDeterministicSummary(mostChangedRegion);
    res.json({
      summary: fallbackText,
      source: 'deterministic',
      facts: mostChangedRegion,
    });
  } catch (err: any) {
    console.error('Error generating summary:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
