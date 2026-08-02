'use client';

import React from 'react';

export function SkeletonCard() {
  return (
    <div className="border border-border p-5 animate-pulse font-mono">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-border" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-border w-1/3" />
          <div className="h-2 bg-border w-1/2" />
        </div>
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-8 bg-border w-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return <SkeletonCard />;
}

export function VaultListSkeleton() {
  return <SkeletonList count={5} />;
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4 font-mono">
      <div className="h-4 bg-border w-1/4" />
      <div className="h-3 bg-border w-1/2" />
      <div className="space-y-2 mt-6">
        <div className="h-8 bg-border" />
        <div className="h-8 bg-border" />
        <div className="h-8 bg-border" />
      </div>
    </div>
  );
}
