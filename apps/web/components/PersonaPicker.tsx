'use client';

import React from 'react';
import { User, Check } from 'lucide-react';
import { Persona } from '@/lib/types';
import { bandBadgeClass } from '@/lib/format';

interface Props {
  personas: Persona[];
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export default function PersonaPicker({ personas, selectedId, onSelect, isLoading }: Props) {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Step 1 · Select Demo Persona
          </h2>
          <p className="text-xs text-zinc-400">Try real scenarios instantly with pre-seeded financial profiles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {personas.map((p) => {
          const isSelected = p.id === selectedId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              disabled={isLoading}
              className={`liquid-glass rounded-2xl p-5 text-left transition-all relative flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'border-primary shadow-[0_0_25px_rgba(147,51,234,0.25)] bg-white/[0.06]'
                  : 'hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? 'bg-primary text-white' : 'bg-white/10 text-zinc-300'}`}>
                    <User size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{p.display_name}</h3>
                    <span className="text-xs text-muted-foreground block">{p.occupation || p.tagline.split('·')[1]}</span>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>

              <div className="flex items-end justify-between border-t border-border/40 pt-3">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Health Score</span>
                  <span className="font-orbitron font-bold text-2xl text-white">{p.overall_score}</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${bandBadgeClass(p.band)}`}>
                  {p.band}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
