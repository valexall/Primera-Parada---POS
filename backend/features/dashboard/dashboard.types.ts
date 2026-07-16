

export interface DailySummary {
  date: string;
  totalSales: number;
  totalExpenses: number;
  netIncome: number;
  breakdown: {
    cash: number;
    yape: number;
  };
}
