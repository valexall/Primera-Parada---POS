

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  created_at: string;
}



export interface CreateExpenseRequest {
  description: string;
  amount: number;
  category: string;
}

export interface ExpenseFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
}
