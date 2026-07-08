import { AlertTriangle } from 'lucide-react';

/**
 * Mandatory disclaimer for any screen that displays structural design,
 * quantity, or cost-estimation output. This app performs guidance-level
 * calculations only — it is not a substitute for a licensed engineer's
 * sign-off, and must never be the sole basis for a real construction
 * decision. Every structural/BOQ/estimation view must render this.
 */
export default function EngineeringDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 ${compact ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
      <AlertTriangle size={compact ? 14 : 16} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
      <p className="text-amber-800 dark:text-amber-300">
        <strong>For guidance only.</strong> This output is a preliminary estimate based on simplified
        formulas and default assumptions. It has not been checked for every applicable IS Code
        clause (shear, deflection, seismic detailing, punching shear, etc.) and must be
        independently verified and stamped by a licensed structural/civil engineer before use in
        any real construction, tender, or safety decision.
      </p>
    </div>
  );
}
