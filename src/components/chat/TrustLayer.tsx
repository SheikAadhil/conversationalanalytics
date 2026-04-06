import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { TrustLayer as TrustLayerType } from '../../data/types';

interface TrustLayerProps {
  trustLayer: TrustLayerType;
  isOpen: boolean;
  onToggle: () => void;
}

export function TrustLayer({ trustLayer, isOpen, onToggle }: TrustLayerProps) {
  return (
    <div className="mt-4">
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-[11px] font-bold text-text-tertiary hover:text-text-secondary transition-colors group"
      >
        <HelpCircle
          size={13}
          strokeWidth={2}
          className="opacity-60 group-hover:opacity-100 transition-opacity"
        />
        <span className="opacity-60 group-hover:opacity-100 transition-opacity">
          How was this calculated?
        </span>
        {isOpen ? (
          <ChevronUp size={12} strokeWidth={2.5} className="opacity-50" />
        ) : (
          <ChevronDown size={12} strokeWidth={2.5} className="opacity-50" />
        )}
      </button>

      {/* Expandable panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-4">
              {/* Metrics */}
              {trustLayer.metricDefinitions.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 opacity-70">
                    Metrics
                  </h5>
                  <div className="space-y-2">
                    {trustLayer.metricDefinitions.map((metric, i) => (
                      <div key={i} className="bg-bg-subtle rounded-xl p-3 border border-border-light">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-[12px] font-bold text-text-primary">{metric.name}</span>
                          {metric.formula && (
                            <code className="text-[10px] font-mono font-bold text-primary bg-primary-soft px-1.5 py-0.5 rounded-md border border-primary/20">
                              {metric.formula}
                            </code>
                          )}
                        </div>
                        <p className="text-[11px] text-text-secondary leading-relaxed">{metric.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters */}
              {trustLayer.filters.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 opacity-70">
                    Filters Applied
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {trustLayer.filters.map((filter, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-semibold text-text-secondary bg-bg-subtle px-2.5 py-1 rounded-lg border border-border-light"
                      >
                        {filter.field}{' '}
                        <span className="text-text-tertiary font-normal">{filter.operator}</span>{' '}
                        <span className="font-bold text-text-primary">{filter.value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Data freshness */}
              <div>
                <h5 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 opacity-70">
                  Data Source
                </h5>
                <div className="bg-bg-subtle rounded-xl p-3 border border-border-light space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-secondary">Range</span>
                    <span className="text-[11px] font-bold text-text-primary">{trustLayer.dataFreshness.range}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-secondary">Source</span>
                    <span className="text-[11px] font-bold text-text-primary">{trustLayer.dataFreshness.source}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-secondary">Last updated</span>
                    <span className="text-[11px] font-bold text-text-primary font-mono">
                      {new Date(trustLayer.dataFreshness.lastUpdated).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              {trustLayer.reasoning && (
                <div>
                  <h5 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 opacity-70">
                    Why this chart?
                  </h5>
                  <p className="text-[12px] text-text-secondary leading-relaxed bg-bg-subtle rounded-xl p-3 border border-border-light italic">
                    {trustLayer.reasoning}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
