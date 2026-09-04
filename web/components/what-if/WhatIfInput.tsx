'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface Props {
  onSimulate: (query: string) => void;
  isLoading: boolean;
}

export default function WhatIfInput({ onSimulate, isLoading }: Props) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSimulate(query.trim());
    }
  };

  const suggestions = [
    "What if I pay ₹30,000 toward my card?",
    "Can I afford a ₹5 lakh loan?",
    "Should I close my oldest card?"
  ];

  return (
    <div className="flex flex-col h-full gap-6">
      <div>
        <h2 className="text-xl font-semibold mb-1 text-white">What are you thinking about doing?</h2>
        <p className="text-sm text-muted-foreground">Type a scenario in natural language to see the financial impact.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-white transition-all"
            placeholder="E.g., What if I pay ₹10,000..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex flex-col gap-3 mt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Try these:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                type="button"
                className="text-xs bg-black/40 border border-border hover:border-primary text-muted-foreground hover:text-white px-3 py-1.5 rounded-full transition-colors"
                onClick={() => {
                  setQuery(suggestion);
                  onSimulate(suggestion);
                }}
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-auto pt-6">
          <button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!query.trim() || isLoading}
          >
            {isLoading ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>
      </form>
    </div>
  );
}
