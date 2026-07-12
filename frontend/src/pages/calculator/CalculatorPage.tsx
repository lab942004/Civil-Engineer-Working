import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { calculatorFunctions, calculatorMetadata } from '@/utils/calculations';
import type { CalcInput } from '@/utils/calculations';
import type { CalculationResult } from '@/types';
import { useList, useCreate } from '@/hooks/useApi';
import EngineeringDisclaimer from '@/components/shared/EngineeringDisclaimer';
import {
  Calculator,
  ArrowLeft,
  Download,
  Share2,
  Printer,
  Bookmark,
  ChevronRight,
  Ruler,
  Weight,
  Layers,
  HardHat,
  Building2,
  Droplets,
  Zap,
  Compass,
  Pipette,
  BrickWall,
  Gauge,
  Route,
  Waves,
  SlidersHorizontal,
  Loader2,
  History,
  Trash2,
} from 'lucide-react';

const calculatorIcons: Record<string, React.ReactNode> = {
  'concrete-mix': <Layers size={24} />,
  'steel-weight': <Weight size={24} />,
  'slab': <Ruler size={24} />,
  'beam': <Building2 size={24} />,
  'column': <Building2 size={24} />,
  'foundation': <HardHat size={24} />,
  'earthwork': <HardHat size={24} />,
  'brick': <BrickWall size={24} />,
  'water-tank': <Droplets size={24} />,
  'road-quantity': <Route size={24} />,
  'pipe-flow': <Waves size={24} />,
  'load': <Zap size={24} />,
  'slope': <SlidersHorizontal size={24} />,
  'cement': <Pipette size={24} />,
};

const categories = [
  {
    name: 'Concrete & Cement',
    items: ['concrete-mix', 'cement', 'brick'],
  },
  {
    name: 'Structural Design',
    items: ['slab', 'beam', 'column', 'foundation'],
  },
  {
    name: 'Steel & Materials',
    items: ['steel-weight', 'load'],
  },
  {
    name: 'Earthwork & Roads',
    items: ['earthwork', 'road-quantity'],
  },
  {
    name: 'Hydraulics',
    items: ['water-tank', 'pipe-flow'],
  },
  {
    name: 'General',
    items: ['slope'],
  },
];

export default function CalculatorPage() {
  const { calculatorType } = useParams();
  const [inputs, setInputs] = useState<CalcInput>({});
  // BUG FIX: text fields need their own string representation. Before, the
  // input's `value` was bound straight to the numeric `inputs` state, and
  // clearing the field ran `parseFloat('') || 0` which immediately wrote a
  // 0 back into state -> the controlled input snapped straight back to "0"
  // and the field could never actually be emptied to type a new value.
  // `rawInputs` holds exactly what's typed (including ''), so the field can
  // sit empty while the numeric `inputs` used for calculation defaults to 0.
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [selectedCalc, setSelectedCalc] = useState(calculatorType || '');
  const [showHistory, setShowHistory] = useState(false);

  const { data: categoriesResponse } = useList<any>('/calculators/categories', ['calculator-categories']);

  useEffect(() => {
    setSelectedCalc(calculatorType || '');
    setResult(null);
    setInputs({});
  }, [calculatorType]);

  const calculator = selectedCalc ? calculatorMetadata[selectedCalc] : null;
  const calculateFn = selectedCalc ? calculatorFunctions[selectedCalc] : null;

  // Saved calculations for the currently open calculator. Query key includes
  // the calculator name so different calculators don't share cached history,
  // and matches the key `useCreate` invalidates below — meaning the moment
  // you hit Save, this list refetches automatically. No page reload needed.
  const savedCalcsQuery = useList<any>(
    '/saved-calculations',
    ['saved-calculations', selectedCalc],
    calculator ? { calculator: calculator.name, limit: 5 } : undefined
  );
  const saveMutation = useCreate<any>(
    '/saved-calculations',
    ['saved-calculations', selectedCalc],
    'Calculation saved'
  );
  const queryClient = useQueryClient();

  // BUG FIX: the input fields showed `defaultValue` as if it were a real
  // starting value, but it was only ever passed to the DOM's uncontrolled
  // `defaultValue` prop — never into the `inputs` state, which is only
  // populated by onChange. So if you calculated without touching a field,
  // that field was actually `undefined` in the calculation, not the number
  // shown on screen. We now seed `inputs` from the calculator's defaults
  // whenever a calculator is opened, and the fields below are controlled,
  // so what you see is always what gets calculated (and saved).
  useEffect(() => {
    if (calculator) {
      const defaults: CalcInput = {};
      const rawDefaults: Record<string, string> = {};
      calculator.inputs.forEach((input) => {
        if (input.defaultValue !== undefined) {
          defaults[input.name] = input.defaultValue;
          rawDefaults[input.name] = String(input.defaultValue);
        }
      });
      setInputs(defaults);
      setRawInputs(rawDefaults);
      setResult(null);
    }
  }, [selectedCalc]);

  const handleInputChange = (name: string, value: string) => {
    // Keep the exact typed string (so the field can be empty) alongside a
    // parsed numeric value (so Calculate always has a real number to use).
    setRawInputs((prev) => ({ ...prev, [name]: value }));
    setInputs((prev) => ({ ...prev, [name]: value === '' ? 0 : parseFloat(value) || 0 }));
  };

  const handleCalculate = () => {
    if (calculateFn && Object.keys(inputs).length > 0) {
      const calcResult = calculateFn(inputs);
      setResult({
        result: calcResult.result,
        unit: calcResult.unit,
        formula: calcResult.formula,
        steps: calcResult.steps,
        details: calcResult.details,
      });
    }
  };

  const handleReset = () => {
    if (calculator) {
      const defaults: CalcInput = {};
      const rawDefaults: Record<string, string> = {};
      calculator.inputs.forEach((input) => {
        if (input.defaultValue !== undefined) {
          defaults[input.name] = input.defaultValue;
          rawDefaults[input.name] = String(input.defaultValue);
        }
      });
      setInputs(defaults);
      setRawInputs(rawDefaults);
    }
    setResult(null);
  };

  // Print: build a clean, standalone printable page (title, inputs, result,
  // steps) instead of calling window.print() on the whole app chrome/sidebar.
  const handlePrint = () => {
    if (!result || !calculator) return;
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) {
      toast.error('Please allow pop-ups to print');
      return;
    }
    const stepsHtml = result.steps
      .map((s, i) => `<div style="margin:6px 0;padding:8px;background:#f3f4f6;border-radius:6px;">
        <strong>${i + 1}.</strong> ${s.description}<br/><span style="font-weight:600;">${s.value}</span></div>`)
      .join('');
    const detailsHtml = result.details && Object.keys(result.details).length > 0
      ? `<h3>Detailed Breakdown</h3><table style="width:100%;border-collapse:collapse;">${Object.entries(result.details)
          .map(([k, v]) => `<tr><td style="padding:4px;border-bottom:1px solid #e5e7eb;">${k.replace(/([A-Z])/g, ' $1')}</td><td style="padding:4px;border-bottom:1px solid #e5e7eb;text-align:right;">${String(v)}</td></tr>`)
          .join('')}</table>`
      : '';
    win.document.write(`<!DOCTYPE html><html><head><title>${calculator.name} - Result</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#111827;}h1{font-size:20px;}h3{font-size:14px;margin-top:20px;}</style>
      </head><body>
      <h1>${calculator.name}</h1>
      <p>Formula: ${result.formula}</p>
      <h2>Result: ${result.result.toFixed(2)} ${result.unit}</h2>
      <h3>Step-by-Step Solution</h3>
      ${stepsHtml}
      ${detailsHtml}
      <p style="margin-top:24px;font-size:11px;color:#6b7280;">Generated on ${new Date().toLocaleString('en-IN')} — for guidance only, verify with a licensed engineer.</p>
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  // Share: use the native Web Share API where available (mobile browsers,
  // most desktop browsers over HTTPS); otherwise fall back to copying a
  // text summary to the clipboard so the button always does *something*.
  const handleShare = async () => {
    if (!result || !calculator) return;
    const shareText = `${calculator.name}\nResult: ${result.result.toFixed(2)} ${result.unit}\nFormula: ${result.formula}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: calculator.name, text: shareText });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        toast.success('Result copied to clipboard');
      } else {
        toast.error('Sharing is not supported on this browser');
      }
    } catch {
      // user cancelled the share sheet — not an error
    }
  };

  const handleSave = async () => {
    if (!result || !selectedCalc) return;
    try {
      await saveMutation.mutateAsync({
        calculator: calculator?.name || selectedCalc,
        input: inputs,
        result,
      });
      setShowHistory(true);
      // So the Dashboard's totalCalculations / recent-activity numbers
      // reflect this save immediately, not just on next full page load.
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    } catch {
      // useCreate already toasts the error
    }
  };

  // If calculator type is selected, show calculator interface
  if (selectedCalc && calculator) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Link to="/calculator" onClick={() => { setSelectedCalc(''); setResult(null); }}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} className="mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{calculator.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator size={18} />
                Input Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {calculator.inputs.map((input) => (
                <Input
                  key={input.name}
                  label={`${input.label}${input.unit ? ` (${input.unit})` : ''}`}
                  type="number"
                  placeholder={`Enter ${input.label.toLowerCase()}`}
                  value={rawInputs[input.name] ?? ''}
                  onChange={(e) => handleInputChange(input.name, e.target.value)}
                />
              ))}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleCalculate} className="flex-1">
                  <Calculator className="mr-2" size={16} />
                  Calculate
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Results</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  {['slab', 'beam', 'column', 'foundation'].includes(selectedCalc) && (
                    <EngineeringDisclaimer />
                  )}
                  {/* Main Result */}
                  <div className="p-4 rounded-xl bg-[hsl(221.2,83.2%,53.3%)]/10 text-center">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Result</p>
                    <p className="text-3xl font-bold text-[hsl(221.2,83.2%,53.3%)]">
                      {result.result.toFixed(2)} {result.unit}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      Formula: {result.formula}
                    </p>
                  </div>

                  {/* Step-by-Step Solution */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Step-by-Step Solution</h3>
                    <div className="space-y-2">
                      {result.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[hsl(var(--secondary))]">
                          <span className="text-xs font-bold text-[hsl(221.2,83.2%,53.3%)] min-w-5">
                            {i + 1}.
                          </span>
                          <div>
                            <p className="text-sm">{step.description}</p>
                            <p className="text-sm font-medium">{step.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  {result.details && Object.keys(result.details).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Detailed Breakdown</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(result.details).map(([key, value]) => (
                          <div key={key} className="p-2 rounded-lg border border-[hsl(var(--border))]">
                            <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize">
                              {key.replace(/([A-Z])/g, ' $1')}
                            </p>
                            <p className="text-sm font-medium">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Bookmark size={14} className="mr-1" />}
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowHistory((v) => !v)}>
                      <History size={14} className="mr-1" /> History
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                      <Printer size={14} className="mr-1" /> Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 size={14} className="mr-1" /> Share
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                  <Calculator className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>Enter values and click Calculate</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Saved calculation history for this calculator — this is the
            panel that never existed before: saving previously wrote to the
            DB but nothing anywhere ever read it back. It shares the
            ['saved-calculations', selectedCalc] query key with the save
            mutation above, so it updates the instant a save succeeds. */}
        {showHistory && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History size={18} />
                Saved Calculations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {savedCalcsQuery.isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin h-5 w-5" />
                </div>
              ) : (savedCalcsQuery.data?.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-center py-6 text-[hsl(var(--muted-foreground))]">
                  No saved calculations yet for {calculator.name}.
                </p>
              ) : (
                <div className="space-y-2">
                  {savedCalcsQuery.data!.data!.map((saved: any) => (
                    <div key={saved.id} className="flex items-center justify-between p-3 rounded-lg border border-[hsl(var(--border))]">
                      <div>
                        <p className="text-sm font-medium">
                          {saved.result?.result?.toFixed?.(2)} {saved.result?.unit}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {saved.createdAt ? new Date(saved.createdAt).toLocaleString('en-IN') : ''}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (saved.input) {
                            setInputs(saved.input);
                            const raw: Record<string, string> = {};
                            Object.entries(saved.input as CalcInput).forEach(([k, v]) => { raw[k] = String(v); });
                            setRawInputs(raw);
                          }
                          if (saved.result) setResult(saved.result);
                        }}
                      >
                        Load
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show calculator browser/grid
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Engineering Calculators</h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          Professional engineering calculations based on IS Codes and standard formulas
        </p>
      </div>

      {categories.map((category) => (
        <div key={category.name}>
          <h2 className="text-lg font-semibold mb-3">{category.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {category.items.map((calcKey) => {
              const meta = calculatorMetadata[calcKey];
              if (!meta) return null;
              return (
                <motion.div
                  key={calcKey}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={`/calculator/${calcKey}`}
                    onClick={() => {
                      setSelectedCalc(calcKey);
                      setResult(null);
                      setInputs({});
                    }}
                  >
                    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-[hsl(221.2,83.2%,53.3%)]/10 text-[hsl(221.2,83.2%,53.3%)] group-hover:scale-110 transition-transform">
                            {calculatorIcons[calcKey] || <Calculator size={24} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm">{meta.name}</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">
                              {meta.description}
                            </p>
                            <p className="text-xs text-[hsl(221.2,83.2%,53.3%)] mt-2">
                              {meta.inputs.length} parameters
                            </p>
                          </div>
                          <ChevronRight
                            size={16}
                            className="mt-1 text-[hsl(var(--muted-foreground))] group-hover:translate-x-1 transition-transform"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}