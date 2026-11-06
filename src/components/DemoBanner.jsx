import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DemoBanner({ message }) {
  return (
    <div className="demo-banner mb-4">
      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
      <span>{message || '⚠️ DEMO DATA — All information shown is fictional and for demonstration only. This is not medical advice.'}</span>
    </div>
  );
}

