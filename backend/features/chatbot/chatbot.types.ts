export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  context?: 'help' | 'menu-analysis';
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  timestamp: Date;
}

export interface MenuAnalysisData {
  itemName: string;
  date: string;
  dayOfWeek: string;
  quantitySold: number;
  revenue: number;
  costPerUnit: number;
  profitMargin: number;
}

export interface MenuSuggestion {
  itemName: string;
  reason: string;
  confidence: number;
  historicalData: {
    avgSales: number;
    bestDay: string;
    profitMargin: number;
  };
}
