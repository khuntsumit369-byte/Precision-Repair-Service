# RepairFlow - Service & Parts Billing Application

A comprehensive workshop management, multi-unit repair service billing, spare parts management, unit tracking barcode/stickers, and customer ledger accounting web app built with React, TypeScript, and Tailwind CSS.

## 🚀 Getting Started

Follow these steps to run the application locally on your computer:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (version 18 or higher) installed on your system.

### 2. Install Dependencies
Open your terminal inside this project folder and run:
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to the local URL (usually `http://localhost:3000` or `http://localhost:5173`).

### 4. Build for Production
```bash
npm run build
```

## 🌐 Deploying to Vercel (Step-by-Step)

This application is ready to deploy directly to [Vercel](https://vercel.com):

1. **Push or Upload to GitHub**:
   - Push this project to your GitHub repository (or use the Vercel CLI `vercel`).
2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select your GitHub repository.
3. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Deploy**:
   - Click **Deploy**. Vercel will build and host your application with automatic SSL (`https://your-project.vercel.app`).
   - The included `vercel.json` already configures single-page application (SPA) rewrites.

## ☁️ Multi-Device Cloud Sync

- **Powered by Google Cloud Firestore**: Real-time cross-device synchronization for phones, tablets, and desktops.
- Any invoice, stock purchase, payment, or expense created on mobile instantly updates on your desktop counter PC and vice versa.
- Automatic offline caching in browser LocalStorage ensures continuous operation even when the internet is temporarily disconnected.

## ✨ Key Features
- **Invoices & Billing**: Multi-unit repair billing, GST slabs, cash/credit tracking, instant print preview (A4 & A5 formats).
- **Parts & Stock Management**: Inventory tracking, purchasing, part master, low-stock alerts.
- **Cash Flow & Expense Tracking**: Workshop daily expenses, income vs expense analysis.
- **Unit History Tracker**: Trace machine/unit serials, service logs, barcode stickers generator.
- **Customer Ledger**: Track dues, payments, advance amounts, customer statement generation.
- **Bilingual Interface**: Gujarati (ગુજરાતી) & English.
