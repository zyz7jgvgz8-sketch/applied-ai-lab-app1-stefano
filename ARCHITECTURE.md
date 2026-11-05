# Application Architecture

The Sales Revenue & Regional Variance Analyzer is an executive financial intelligence application designed to help commercial leaders, operations teams, and finance directors rapidly ingest sales order data, monitor regional revenue performance across fiscal quarters, and pinpoint the root causes of business variances. Users can upload their own CSV sales order records or explore built-in enterprise sample data through interactive revenue pivot tables, multi-quarter variance charts, and searchable order records. The system mathematically analyzes quarterly performance—specifically isolating the region experiencing the greatest dollar variance between Q2 and Q3—and produces a grounded, three-sentence executive summary powered by Google Gemini AI (with an automatic deterministic mathematical fallback) alongside a transparent calculation audit modal to give decision-makers complete trust in the reported figures.

## File Catalog

| File | Description |
| :--- | :--- |
| `.env.example` | Documents the required environment variables for the application, including server port settings and the Gemini API key. |
| `.gitignore` | Defines files, build directories, and temporary local dependencies that Git version control should exclude from tracking. |
| `ARCHITECTURE.md` | Provides an executive-level overview of the application and a comprehensive functional catalog of every file in the project. |
| `bun.lock` | Records pinned package dependency versions generated during Bun package resolution. |
| `index.html` | Serves as the web application entry page, defining HTML head metadata, responsive viewport tags, and typography links. |
| `metadata.json` | Specifies project configuration and permissions for the AI Studio runtime, including server-side Gemini API capabilities. |
| `package.json` | Declares application dependencies, project metadata, and development, build, and production execution scripts. |
| `server.ts` | Hosts an Express backend server that serves the client application and provides a secure server-side endpoint for Gemini AI summary generation. |
| `src/App.tsx` | Serves as the primary application controller, orchestrating global state, navigation tabs, KPI calculations, and data workflows. |
| `src/components/AiSummaryCard.tsx` | Renders the executive variance summary card highlighting the 3-sentence narrative, generation source, and calculation audit action. |
| `src/components/CalculationAuditModal.tsx` | Provides an audit dialogue that reveals the exact formulas, driver figures, and calculation metrics used to generate the executive report. |
| `src/components/FileUploader.tsx` | Presents an intuitive file drop zone and upload interface enabling users to ingest custom CSV sales order datasets. |
| `src/components/RawOrdersTable.tsx` | Displays an interactive, filterable, and paginated table allowing users to inspect individual transaction-level sales order records. |
| `src/components/RevenueChart.tsx` | Visualizes regional revenue distribution and multi-quarter comparison metrics through interactive SVG charting components. |
| `src/components/RevenueTable.tsx` | Presents a regional revenue matrix table detailing quarterly totals, percentage variance, and regional revenue share. |
| `src/components/TopBar.tsx` | Displays the application header bar with branding, navigation tabs, sample data loading triggers, and file upload controls. |
| `src/index.css` | Configures global application typography, Tailwind CSS styling rules, and monospaced numeric formatting utilities. |
| `src/main.tsx` | Initializes the client application by mounting the root React component tree into the web page DOM. |
| `src/types/sales.ts` | Defines TypeScript data models and interfaces for orders, regional matrices, variance analyses, and calculation facts. |
| `src/utils/calculations.ts` | Contains core financial calculation algorithms that aggregate regional matrices, compute quarterly variances, and determine primary drivers. |
| `src/utils/csvParser.ts` | Parses and validates uploaded CSV text data into strongly-typed sales order structures with comprehensive error checking. |
| `src/utils/sampleData.ts` | Supplies a realistic multi-region, multi-product enterprise sales order CSV dataset for out-of-the-box demonstration. |
| `tsconfig.json` | Configures TypeScript compiler settings, target output standards, and import path aliases for the codebase. |
| `vite.config.ts` | Defines Vite frontend tooling settings, including React plugin integration, Tailwind CSS support, and path alias resolutions. |
