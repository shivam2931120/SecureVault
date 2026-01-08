'use client';

import { motion } from 'framer-motion';

export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-surface rounded-lg" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-surface rounded w-1/3" />
          <div className="h-4 bg-surface rounded w-2/3" />
          <div className="flex gap-2">
            <div className="h-6 bg-surface rounded w-16" />
            <div className="h-6 bg-surface rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
