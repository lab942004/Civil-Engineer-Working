// Engineering Calculation Formulas (Non-AI, pure mathematical formulas)
// All calculations follow IS Codes and standard engineering formulas

export interface CalcInput {
  [key: string]: number;
}

export interface CalcStep {
  description: string;
  value: string;
}

export interface CalcResult {
  result: number;
  unit: string;
  formula: string;
  steps: CalcStep[];
  details?: Record<string, any>;
}

// Concrete Mix Design (IS 456:2000)
export function calculateConcreteMix(input: CalcInput): CalcResult {
  const { cementGrade = 53, waterCementRatio = 0.45, aggregateSize = 20, slump = 100, exposure = 3 } = input;
  
  const steps: CalcStep[] = [];
  
  // Step 1: Target mean strength
  const fck = input.grade || 25; // M25 default
  const standardDeviation = 4; // N/mm² for M25
  const targetStrength = fck + 1.65 * standardDeviation;
  steps.push({ description: 'Target Mean Strength', value: `${targetStrength.toFixed(2)} N/mm²` });
  steps.push({ description: 'Formula', value: `f_target = f_ck + 1.65 × σ = ${fck} + 1.65 × ${standardDeviation} = ${targetStrength.toFixed(2)} N/mm²` });

  // Step 2: Water content
  const waterContent = 186 + (slump - 50) * 0.6; // Approximate for 20mm aggregate
  steps.push({ description: 'Water Content', value: `${waterContent.toFixed(0)} kg/m³` });

  // Step 3: Cement content
  const cementContent = waterContent / waterCementRatio;
  steps.push({ description: 'Cement Content', value: `${cementContent.toFixed(0)} kg/m³` });
  steps.push({ description: 'Formula', value: `Cement = Water / (W/C) = ${waterContent.toFixed(0)} / ${waterCementRatio} = ${cementContent.toFixed(0)} kg/m³` });

  // Step 4: Aggregate volume
  const totalAggregateVolume = 1 - (cementContent / (cementGrade * 1000)) - (waterContent / 1000);
  steps.push({ description: 'Total Aggregate Volume', value: `${totalAggregateVolume.toFixed(3)} m³` });

  // Step 5: Fine and coarse aggregate
  const fineAggPercent = aggregateSize === 20 ? 0.35 : 0.38;
  const fineAgg = totalAggregateVolume * fineAggPercent * 2.65 * 1000;
  const coarseAgg = totalAggregateVolume * (1 - fineAggPercent) * 2.68 * 1000;
  steps.push({ description: 'Fine Aggregate', value: `${fineAgg.toFixed(0)} kg/m³` });
  steps.push({ description: 'Coarse Aggregate', value: `${coarseAgg.toFixed(0)} kg/m³` });

  const concreteDensity = cementContent + waterContent + fineAgg + coarseAgg;

  return {
    result: concreteDensity,
    unit: 'kg/m³',
    formula: 'IS 456:2000 Concrete Mix Design',
    steps,
    details: {
      cement: cementContent,
      water: waterContent,
      fineAggregate: fineAgg,
      coarseAggregate: coarseAgg,
      waterCementRatio,
      targetStrength,
      concreteGrade: `M${fck}`,
    },
  };
}

// Steel Weight Calculator
export function calculateSteelWeight(input: CalcInput): CalcResult {
  const { diameter, length, quantity = 1 } = input;
  // Weight = (D²/162) × L (in kg/m)
  const weightPerMeter = (diameter * diameter) / 162;
  const totalWeight = weightPerMeter * length * quantity;
  
  const steps: CalcStep[] = [
    { description: 'Weight per meter', value: `${weightPerMeter.toFixed(3)} kg/m` },
    { description: 'Formula', value: `W = D²/162 = ${diameter}²/162 = ${weightPerMeter.toFixed(3)} kg/m` },
    { description: `Total weight for ${quantity} bar(s) of ${length}m`, value: `${totalWeight.toFixed(2)} kg` },
  ];

  return {
    result: totalWeight,
    unit: 'kg',
    formula: 'W = (D² × L) / 162',
    steps,
    details: { weightPerMeter, diameter, length, quantity },
  };
}

// Slab Design (One-way slab - IS 456:2000)
export function calculateSlab(input: CalcInput): CalcResult {
  const { span, width, liveLoad = 3, floorFinish = 1.5, fck = 25, fy = 500 } = input;
  
  const steps: CalcStep[] = [];

  // Step 1: Depth estimation (span/effective depth ratio)
  const spanToDepthRatio = 20; // For simply supported slab
  const effectiveDepth = (span * 1000) / spanToDepthRatio;
  const overallDepth = effectiveDepth + 25; // 25mm cover
  steps.push({ description: 'Effective Depth', value: `${effectiveDepth.toFixed(0)} mm` });
  steps.push({ description: 'Overall Depth', value: `${overallDepth.toFixed(0)} mm` });
  steps.push({ description: 'Formula', value: `d = span/(L/d ratio) = ${span * 1000}/${spanToDepthRatio} = ${effectiveDepth.toFixed(0)} mm` });

  // Step 2: Loads
  const selfWeight = (overallDepth / 1000) * 25; // 25 kN/m³ for RCC
  const totalLoad = selfWeight + liveLoad + floorFinish;
  const factoredLoad = totalLoad * 1.5;
  steps.push({ description: 'Self Weight', value: `${selfWeight.toFixed(2)} kN/m²` });
  steps.push({ description: 'Total Service Load', value: `${totalLoad.toFixed(2)} kN/m²` });
  steps.push({ description: 'Factored Load', value: `${factoredLoad.toFixed(2)} kN/m²` });

  // Step 3: Moments
  const moment = (factoredLoad * span * span) / 8;
  steps.push({ description: 'Maximum Moment', value: `${moment.toFixed(2)} kN-m` });
  steps.push({ description: 'Formula', value: `M = wl²/8 = ${factoredLoad.toFixed(2)} × ${span}²/8 = ${moment.toFixed(2)} kN-m` });

  // Step 4: Reinforcement
  const mu = moment * 1e6; // Convert to N-mm
  const b = 1000; // 1m width
  const d = effectiveDepth;
  const xuMax = 0.48 * d;
  const ast = (0.5 * fck * b * d / fy) * (1 - Math.sqrt(1 - (4.6 * mu) / (fck * b * d * d)));
  const minimumAst = 0.0012 * b * d;
  const providedAst = Math.max(ast, minimumAst);
  
  // Bar spacing for 10mm bars
  const barDiameter = 10;
  const barArea = (Math.PI * barDiameter * barDiameter) / 4;
  const spacing = (barArea * 1000) / providedAst;
  
  steps.push({ description: 'Required Reinforcement (Ast)', value: `${providedAst.toFixed(0)} mm²/m` });
  steps.push({ description: 'Provide 10mm Ø bars @', value: `${Math.round(spacing)} mm c/c` });
  steps.push({ description: '⚠ SAFETY WARNING', value: 'Depth is estimated from the span/depth ratio only (IS 456 Cl 23.2.1 basic ratio for simply supported slabs). This calculator does NOT verify actual deflection or check two-way action — confirm both with a structural engineer for spans over ~4m or non-simply-supported edge conditions.' });

  return {
    result: providedAst,
    unit: 'mm²/m',
    formula: 'IS 456:2000 - Slab Design',
    steps,
    details: {
      effectiveDepth,
      overallDepth,
      moment,
      reinforcement: providedAst,
      barDiameter,
      spacing: Math.round(spacing),
      totalLoad,
      factoredLoad,
    },
  };
}

// Beam Design (IS 456:2000)
export function calculateBeam(input: CalcInput): CalcResult {
  const { span, width = 230, load, fck = 25, fy = 500 } = input;
  
  const steps: CalcStep[] = [];
  
  // Step 1: Depth
  const spanToDepthRatio = 12; // For simply supported beam
  const effectiveDepth = (span * 1000) / spanToDepthRatio;
  const overallDepth = effectiveDepth + 40;
  steps.push({ description: 'Effective Depth', value: `${effectiveDepth.toFixed(0)} mm` });
  steps.push({ description: 'Overall Depth', value: `${overallDepth.toFixed(0)} mm` });

  // Step 2: Moments
  const selfWeight = (width / 1000) * (overallDepth / 1000) * 25;
  const totalUdl = load + selfWeight;
  const factoredUdl = totalUdl * 1.5;
  const moment = (factoredUdl * span * span) / 8;
  const shearForce = (factoredUdl * span) / 2;
  steps.push({ description: 'Self Weight', value: `${selfWeight.toFixed(2)} kN/m` });
  steps.push({ description: 'Maximum Moment', value: `${moment.toFixed(2)} kN-m` });
  steps.push({ description: 'Maximum Shear Force', value: `${shearForce.toFixed(2)} kN` });

  // Step 3: Main Reinforcement
  const mu = moment * 1e6;
  const d = effectiveDepth;
  const b = width;
  const muLimit = 0.138 * fck * b * d * d;
  const isSingleReinforced = mu <= muLimit;
  steps.push({ description: 'Limiting Moment (Mu,lim)', value: `${(muLimit / 1e6).toFixed(2)} kN-m` });
  steps.push({ description: 'Section Type', value: isSingleReinforced ? 'Singly Reinforced' : 'Doubly Reinforced' });

  const ast = (0.5 * fck * b * d / fy) * (1 - Math.sqrt(1 - (4.6 * mu) / (fck * b * d * d)));
  // IS 456:2000 Cl 26.5.1.1: Ast,min / (b·d) ≥ 0.85/fy  =>  Ast,min = (0.85/fy)×b×d
  const minimumAst = (0.85 / fy) * b * d;
  const providedAst = Math.max(ast, minimumAst);
  steps.push({ description: 'Minimum Reinforcement (Cl 26.5.1.1)', value: `${minimumAst.toFixed(0)} mm²` });
  steps.push({ description: 'Tension Reinforcement', value: `${providedAst.toFixed(0)} mm²` });

  const doublyReinforcedWarning = !isSingleReinforced
    ? 'Mu exceeds Mu,lim — this section requires compression reinforcement (doubly reinforced beam design), which this calculator does NOT compute. Increase depth/width or have a structural engineer design the compression steel.'
    : null;
  if (doublyReinforcedWarning) {
    steps.push({ description: '⚠ SAFETY WARNING', value: doublyReinforcedWarning });
  }

  return {
    result: providedAst,
    unit: 'mm²',
    formula: 'IS 456:2000 - Beam Design',
    steps,
    details: {
      effectiveDepth,
      overallDepth,
      moment,
      shearForce,
      reinforcement: providedAst,
      isSingleReinforced,
    },
  };
}

// Column Design (IS 456:2000)
export function calculateColumn(input: CalcInput): CalcResult {
  const { axialLoad, length, width = 300, depth = 300, fck = 25, fy = 500 } = input;
  
  const steps: CalcStep[] = [];
  
  // Step 1: Slenderness check
  const effectiveLength = 0.65 * length; // Fixed ends approximation
  const slendernessRatio = (effectiveLength * 1000) / Math.min(width, depth);
  const isShort = slendernessRatio <= 12;
  steps.push({ description: 'Effective Length', value: `${effectiveLength.toFixed(2)} m` });
  steps.push({ description: 'Slenderness Ratio', value: `${slendernessRatio.toFixed(1)}` });
  steps.push({ description: 'Column Type', value: isShort ? 'Short Column' : 'Slender Column' });

  // Step 2: Axial Load Capacity
  const area = width * depth;
  const factoredLoad = axialLoad * 1.5;
  const ag = area;
  const ac = ag; // Approximate for now
  const asc = 0.01 * ag; // Assume 1% reinforcement
  const pu = 0.4 * fck * ac + 0.67 * fy * asc; // Newtons (fck/fy in N/mm², ac/asc in mm²)
  const puKN = pu / 1000;
  const isSafe = puKN >= factoredLoad; // both sides now in kN
  steps.push({ description: 'Gross Area', value: `${ag.toFixed(0)} mm²` });
  steps.push({ description: 'Factored Load', value: `${factoredLoad.toFixed(2)} kN` });
  steps.push({ description: 'Axial Load Capacity', value: `${(pu / 1000).toFixed(2)} kN` });
  steps.push({ description: 'Status', value: isSafe ? 'SAFE ✓' : 'OVERLOADED ✗' });
  steps.push({ description: '⚠ ASSUMPTION', value: 'Reinforcement is assumed at 1% of gross area (not calculated from your actual load) purely to estimate a trial capacity — verify the real required percentage with a structural engineer.' });
  if (!isShort) {
    steps.push({ description: '⚠ SAFETY WARNING', value: 'This is a slender column (slenderness ratio > 12). The capacity formula used here (IS 456 Cl 39.3) is only valid for SHORT columns — additional moments from slenderness (Cl 39.7, 39.8) are NOT included and must be added by a structural engineer before this result can be relied on.' });
  }

  // Step 3: Reinforcement
  const reinforcement = asc;
  const minBars = 4;
  const barDiameter = Math.sqrt((reinforcement / minBars) * 4 / Math.PI);
  steps.push({ description: 'Required Reinforcement', value: `${reinforcement.toFixed(0)} mm²` });
  steps.push({ description: 'Minimum bars', value: `${minBars} bars of ${Math.max(12, Math.round(barDiameter))}mm Ø` });

  return {
    result: pu / 1000,
    unit: 'kN',
    formula: 'IS 456:2000 - Column Design',
    steps,
    details: { area: ag, loadCapacity: pu, reinforcement, isShort, isSafe },
  };
}

// Foundation Design (IS 456:2000)
export function calculateFoundation(input: CalcInput): CalcResult {
  const { columnLoad, bearingCapacity = 200, columnWidth = 300, columnDepth = 300, fck = 25, fy = 500 } = input;
  
  const steps: CalcStep[] = [];
  
  // Step 1: Area of footing
  const serviceLoad = columnLoad * 1.1; // 10% for self weight
  const requiredArea = serviceLoad / bearingCapacity;
  const size = Math.sqrt(requiredArea);
  steps.push({ description: 'Required Area', value: `${requiredArea.toFixed(2)} m²` });
  steps.push({ description: 'Footing Size', value: `${(size * 1000).toFixed(0)} mm × ${(size * 1000).toFixed(0)} mm` });

  // Step 2: Depth
  const netUpwardPressure = (columnLoad * 1.5) / (size * size); // kN/m²
  const projection = (size * 1000 - columnWidth) / 2; // mm, cantilever projection beyond column face
  const projectionM = projection / 1000; // must be in metres to match netUpwardPressure's m² units
  const momentKNmPerM = (netUpwardPressure * projectionM * projectionM) / 2; // kN·m per metre width
  const dRequired = Math.sqrt((momentKNmPerM * 1e6) / (0.138 * fck * 1000)); // 1e6: kN·m -> N·mm; b=1000mm/m width
  const overallDepth = dRequired + 50;
  steps.push({ description: 'Net Upward Pressure', value: `${netUpwardPressure.toFixed(2)} kN/m²` });
  steps.push({ description: 'Projection', value: `${projection.toFixed(0)} mm` });
  steps.push({ description: 'Required Depth (flexure, Cl 34.2.4.1)', value: `${dRequired.toFixed(0)} mm` });
  steps.push({ description: 'Overall Depth', value: `${overallDepth.toFixed(0)} mm` });
  steps.push({ description: '⚠ SAFETY WARNING', value: 'This calculator checks flexure only. It does NOT check one-way (beam) shear or two-way (punching) shear at the column face (IS 456 Cl 31.6), both of which frequently govern footing depth. Have a structural engineer verify shear before construction.' });

  return {
    result: size * 1000,
    unit: 'mm',
    formula: 'IS 456:2000 - Foundation Design',
    steps,
    details: { footingSize: size * 1000, depth: overallDepth, area: requiredArea, pressure: netUpwardPressure },
  };
}

// Earthwork Calculation
export function calculateEarthwork(input: CalcInput): CalcResult {
  const { length, width, depth, slopeFactor = 0.5 } = input;
  
  const steps: CalcStep[] = [];
  
  // Simple excavation volume with slope
  const topWidth = width + 2 * slopeFactor * depth;
  const topLength = length + 2 * slopeFactor * depth;
  const volume = (depth / 6) * (topLength * topWidth + (topLength + length) * (topWidth + width) + length * width);
  
  steps.push({ description: 'Bottom Dimensions', value: `${length}m × ${width}m` });
  steps.push({ description: 'Top Dimensions (with slope)', value: `${topLength.toFixed(2)}m × ${topWidth.toFixed(2)}m` });
  steps.push({ description: 'Excavation Volume', value: `${volume.toFixed(3)} m³` });
  steps.push({ description: 'Formula', value: `V = d/6[L_t×W_t + (L_t+L)(W_t+W) + L×W]` });

  return {
    result: volume,
    unit: 'm³',
    formula: 'Earthwork Volume Calculation',
    steps,
    details: { topLength, topWidth, volume },
  };
}

// Brick Calculation
export function calculateBricks(input: CalcInput): CalcResult {
  const { wallLength, wallHeight, wallThickness, mortarThickness = 10 } = input;
  
  const steps: CalcStep[] = [];
  
  // Standard brick size: 190mm × 90mm × 90mm (with mortar: 200×100×100)
  const brickLength = 0.19;
  const brickHeight = 0.09;
  const brickDepth = 0.09;
  const mortar = mortarThickness / 1000;
  
  const brickVolume = (brickLength + mortar) * (brickHeight + mortar) * (brickDepth + mortar);
  const wallVolume = wallLength * wallHeight * wallThickness;
  const numberOfBricks = wallVolume / brickVolume;
  const mortarVolume = wallVolume - numberOfBricks * (brickLength * brickHeight * brickDepth);
  const cementMortar = mortarVolume * 0.3; // 1:6 ratio cement part
  
  steps.push({ description: 'Wall Volume', value: `${wallVolume.toFixed(3)} m³` });
  steps.push({ description: 'Number of Bricks', value: `${Math.ceil(numberOfBricks)}` });
  steps.push({ description: 'Mortar Volume', value: `${mortarVolume.toFixed(3)} m³` });
  steps.push({ description: 'Cement Required (1:6)', value: `${cementMortar.toFixed(3)} m³ ≈ ${Math.ceil(cementMortar * 1440)} kg` });

  return {
    result: Math.ceil(numberOfBricks),
    unit: 'bricks',
    formula: 'Brickwork Calculation (IS 2212)',
    steps,
    details: { bricks: Math.ceil(numberOfBricks), mortarVolume, wallVolume },
  };
}

// Water Tank Design
export function calculateWaterTank(input: CalcInput): CalcResult {
  const { capacity, height, length, width } = input;
  
  const steps: CalcStep[] = [];
  
  const volume = capacity; // in liters
  const volumeM3 = volume / 1000;
  
  let tankLength = length || 0;
  let tankWidth = width || 0;
  let tankHeight = height || 0;
  
  if (!tankLength && !tankWidth && !tankHeight) {
    tankHeight = 2; // Default height 2m
    tankLength = Math.sqrt(volumeM3 / tankHeight);
    tankWidth = tankLength;
  }
  
  const actualVolume = tankLength * tankWidth * tankHeight;
  steps.push({ description: 'Capacity', value: `${volume} liters (${volumeM3.toFixed(2)} m³)` });
  steps.push({ description: 'Dimensions (L × W × H)', value: `${tankLength.toFixed(2)}m × ${tankWidth.toFixed(2)}m × ${tankHeight.toFixed(2)}m` });
  steps.push({ description: 'Actual Volume', value: `${actualVolume.toFixed(2)} m³ (${(actualVolume * 1000).toFixed(0)} liters)` });

  // Steel requirement (approximate)
  const steelPerM3 = 85; // kg/m³ for water tank
  const steelRequired = actualVolume * steelPerM3;
  steps.push({ description: 'Approximate Steel Required', value: `${steelRequired.toFixed(0)} kg` });

  return {
    result: actualVolume * 1000,
    unit: 'liters',
    formula: 'Water Tank Design',
    steps,
    details: { length: tankLength, width: tankWidth, height: tankHeight, volumeM3: actualVolume, steel: steelRequired },
  };
}

// Road Quantity (Bitumen)
export function calculateRoadQuantity(input: CalcInput): CalcResult {
  const { length, width, thickness, density = 2.35 } = input;
  
  const steps: CalcStep[] = [];
  const volume = length * width * (thickness / 1000);
  const weight = volume * density;
  
  steps.push({ description: 'Pavement Volume', value: `${volume.toFixed(3)} m³` });
  steps.push({ description: 'Material Quantity', value: `${weight.toFixed(2)} tonnes` });
  steps.push({ description: 'Formula', value: `Weight = Volume × Density = ${volume.toFixed(3)} × ${density} = ${weight.toFixed(2)} tonnes` });

  return {
    result: weight,
    unit: 'tonnes',
    formula: 'Road Quantity Calculation (MORTH)',
    steps,
    details: { volume, density, weight },
  };
}

// Pipe Flow (Hazen-Williams)
export function calculatePipeFlow(input: CalcInput): CalcResult {
  const { diameter, length, headLoss, roughness = 120 } = input;
  
  const steps: CalcStep[] = [];
  const d = diameter / 1000; // Convert to meters
  const area = Math.PI * d * d / 4;
  const slope = headLoss / length;
  const velocity = 0.849 * roughness * Math.pow(d / 4, 0.63) * Math.pow(slope, 0.54);
  const flow = area * velocity;
  
  steps.push({ description: 'Pipe Cross-sectional Area', value: `${(area * 10000).toFixed(2)} cm²` });
  steps.push({ description: 'Hydraulic Slope', value: `${slope.toFixed(4)}` });
  steps.push({ description: 'Flow Velocity', value: `${velocity.toFixed(3)} m/s` });
  steps.push({ description: 'Discharge (Flow Rate)', value: `${flow.toFixed(3)} m³/s` });

  return {
    result: flow,
    unit: 'm³/s',
    formula: 'Hazen-Williams Equation',
    steps,
    details: { velocity, area, discharge: flow, diameter: d },
  };
}

// Load Calculation
export function calculateLoad(input: CalcInput): CalcResult {
  const { deadLoad, liveLoad, windLoad, seismicLoad } = input;
  
  const steps: CalcStep[] = [];
  const totalServiceLoad = (deadLoad || 0) + (liveLoad || 0);
  const factoredLoad = 1.5 * (deadLoad || 0) + 1.5 * (liveLoad || 0);
  
  steps.push({ description: 'Dead Load (DL)', value: `${deadLoad || 0} kN` });
  steps.push({ description: 'Live Load (LL)', value: `${liveLoad || 0} kN` });
  steps.push({ description: 'Total Service Load', value: `${totalServiceLoad.toFixed(2)} kN` });
  steps.push({ description: 'Factored Load (1.5DL + 1.5LL)', value: `${factoredLoad.toFixed(2)} kN` });
  if (windLoad) {
    const withWind = 1.2 * (deadLoad! + liveLoad! + windLoad);
    steps.push({ description: 'With Wind Load', value: `${withWind.toFixed(2)} kN` });
  }

  return {
    result: factoredLoad,
    unit: 'kN',
    formula: 'IS 875 - Load Combinations',
    steps,
    details: { deadLoad, liveLoad, factoredLoad, totalServiceLoad },
  };
}

// Slope Calculation
export function calculateSlope(input: CalcInput): CalcResult {
  const { rise, run } = input;
  
  const steps: CalcStep[] = [];
  const slopePercent = (rise / run) * 100;
  const angleDeg = Math.atan(rise / run) * (180 / Math.PI);
  const slopeRatio = `1:${(run / rise).toFixed(1)}`;
  
  steps.push({ description: 'Slope Percentage', value: `${slopePercent.toFixed(2)}%` });
  steps.push({ description: 'Angle', value: `${angleDeg.toFixed(2)}°` });
  steps.push({ description: 'Slope Ratio', value: slopeRatio });
  steps.push({ description: 'Formula', value: `Slope% = (Rise/Run) × 100 = (${rise}/${run}) × 100 = ${slopePercent.toFixed(2)}%` });

  return {
    result: slopePercent,
    unit: '%',
    formula: 'Slope Calculation',
    steps,
    details: { angle: angleDeg, ratio: slopeRatio, percent: slopePercent },
  };
}

// Cement Calculation (for plaster/mortar)
export function calculateCement(input: CalcInput): CalcResult {
  const { area, thickness, ratio = 6 } = input;
  
  const steps: CalcStep[] = [];
  const volume = area * (thickness / 1000);
  const dryVolume = volume * 1.33; // 33% extra for dry volume
  const cementRatio = 1 / (1 + ratio);
  const cementVolume = dryVolume * cementRatio;
  const cementBags = cementVolume / 0.035; // 1 bag = 0.035 m³
  const sandVolume = dryVolume - cementVolume;
  
  steps.push({ description: 'Wet Volume', value: `${volume.toFixed(3)} m³` });
  steps.push({ description: 'Dry Volume (×1.33)', value: `${dryVolume.toFixed(3)} m³` });
  steps.push({ description: `Mix Ratio (1:${ratio})`, value: `Cement: ${cementVolume.toFixed(3)} m³` });
  steps.push({ description: 'Cement Required', value: `${cementBags.toFixed(1)} bags (50kg each)` });
  steps.push({ description: 'Sand Required', value: `${sandVolume.toFixed(3)} m³` });

  return {
    result: cementBags,
    unit: 'bags',
    formula: 'Cement Mortar Calculation',
    steps,
    details: { cementVolume, sandVolume, cementBags, dryVolume },
  };
}

// Calculator function map
export const calculatorFunctions: Record<string, (input: CalcInput) => CalcResult> = {
  'concrete-mix': calculateConcreteMix,
  'steel-weight': calculateSteelWeight,
  'slab': calculateSlab,
  'beam': calculateBeam,
  'column': calculateColumn,
  'foundation': calculateFoundation,
  'earthwork': calculateEarthwork,
  'brick': calculateBricks,
  'water-tank': calculateWaterTank,
  'road-quantity': calculateRoadQuantity,
  'pipe-flow': calculatePipeFlow,
  'load': calculateLoad,
  'slope': calculateSlope,
  'cement': calculateCement,
};

export const calculatorMetadata: Record<string, { name: string; description: string; formula: string; inputs: { name: string; label: string; type: string; unit?: string; defaultValue?: number }[] }> = {
  'concrete-mix': {
    name: 'Concrete Mix Design',
    description: 'Design concrete mix proportions as per IS 456:2000',
    formula: 'IS 456:2000',
    inputs: [
      { name: 'grade', label: 'Concrete Grade (M)', type: 'number', defaultValue: 25 },
      { name: 'cementGrade', label: 'Cement Grade', type: 'number', defaultValue: 53 },
      { name: 'waterCementRatio', label: 'Water-Cement Ratio', type: 'number', defaultValue: 0.45 },
      { name: 'aggregateSize', label: 'Aggregate Size (mm)', type: 'number', defaultValue: 20 },
      { name: 'slump', label: 'Slump (mm)', type: 'number', defaultValue: 100 },
      { name: 'exposure', label: 'Exposure Condition', type: 'number', defaultValue: 3 },
    ],
  },
  'steel-weight': {
    name: 'Steel Weight Calculator',
    description: 'Calculate weight of steel bars',
    formula: 'W = D²/162 × L',
    inputs: [
      { name: 'diameter', label: 'Bar Diameter (mm)', type: 'number', defaultValue: 12 },
      { name: 'length', label: 'Length (m)', type: 'number', defaultValue: 12 },
      { name: 'quantity', label: 'Number of Bars', type: 'number', defaultValue: 1 },
    ],
  },
  'slab': {
    name: 'Slab Design',
    description: 'Design one-way slab as per IS 456:2000',
    formula: 'IS 456:2000',
    inputs: [
      { name: 'span', label: 'Span (m)', type: 'number', defaultValue: 4 },
      { name: 'width', label: 'Width (m)', type: 'number', defaultValue: 1 },
      { name: 'liveLoad', label: 'Live Load (kN/m²)', type: 'number', defaultValue: 3 },
      { name: 'floorFinish', label: 'Floor Finish (kN/m²)', type: 'number', defaultValue: 1.5 },
      { name: 'fck', label: 'Concrete Grade (fck)', type: 'number', defaultValue: 25 },
      { name: 'fy', label: 'Steel Grade (fy)', type: 'number', defaultValue: 500 },
    ],
  },
  'beam': {
    name: 'Beam Design',
    description: 'Design rectangular beam as per IS 456:2000',
    formula: 'IS 456:2000',
    inputs: [
      { name: 'span', label: 'Span (m)', type: 'number', defaultValue: 5 },
      { name: 'width', label: 'Width (mm)', type: 'number', defaultValue: 230 },
      { name: 'load', label: 'UDL (kN/m)', type: 'number', defaultValue: 20 },
      { name: 'fck', label: 'Concrete Grade (fck)', type: 'number', defaultValue: 25 },
      { name: 'fy', label: 'Steel Grade (fy)', type: 'number', defaultValue: 500 },
    ],
  },
  'column': {
    name: 'Column Design',
    description: 'Design axially loaded column as per IS 456:2000',
    formula: 'IS 456:2000',
    inputs: [
      { name: 'axialLoad', label: 'Axial Load (kN)', type: 'number', defaultValue: 500 },
      { name: 'length', label: 'Column Length (m)', type: 'number', defaultValue: 3 },
      { name: 'width', label: 'Width (mm)', type: 'number', defaultValue: 300 },
      { name: 'depth', label: 'Depth (mm)', type: 'number', defaultValue: 300 },
      { name: 'fck', label: 'Concrete Grade (fck)', type: 'number', defaultValue: 25 },
      { name: 'fy', label: 'Steel Grade (fy)', type: 'number', defaultValue: 500 },
    ],
  },
  'foundation': {
    name: 'Foundation Design',
    description: 'Design isolated footing as per IS 456:2000',
    formula: 'IS 456:2000',
    inputs: [
      { name: 'columnLoad', label: 'Column Load (kN)', type: 'number', defaultValue: 500 },
      { name: 'bearingCapacity', label: 'SBC (kN/m²)', type: 'number', defaultValue: 200 },
      { name: 'columnWidth', label: 'Column Width (mm)', type: 'number', defaultValue: 300 },
      { name: 'columnDepth', label: 'Column Depth (mm)', type: 'number', defaultValue: 300 },
      { name: 'fck', label: 'Concrete Grade (fck)', type: 'number', defaultValue: 25 },
      { name: 'fy', label: 'Steel Grade (fy)', type: 'number', defaultValue: 500 },
    ],
  },
  'earthwork': {
    name: 'Earthwork Calculation',
    description: 'Calculate excavation volume with slopes',
    formula: 'V = d/6[Lt×Wt + (Lt+L)(Wt+W) + L×W]',
    inputs: [
      { name: 'length', label: 'Bottom Length (m)', type: 'number', defaultValue: 10 },
      { name: 'width', label: 'Bottom Width (m)', type: 'number', defaultValue: 5 },
      { name: 'depth', label: 'Depth (m)', type: 'number', defaultValue: 2 },
      { name: 'slopeFactor', label: 'Slope Factor (H:V)', type: 'number', defaultValue: 0.5 },
    ],
  },
  'brick': {
    name: 'Brick Calculation',
    description: 'Calculate number of bricks and mortar required',
    formula: 'IS 2212 - Brickwork',
    inputs: [
      { name: 'wallLength', label: 'Wall Length (m)', type: 'number', defaultValue: 10 },
      { name: 'wallHeight', label: 'Wall Height (m)', type: 'number', defaultValue: 3 },
      { name: 'wallThickness', label: 'Wall Thickness (m)', type: 'number', defaultValue: 0.23 },
      { name: 'mortarThickness', label: 'Mortar Thickness (mm)', type: 'number', defaultValue: 10 },
    ],
  },
  'water-tank': {
    name: 'Water Tank Design',
    description: 'Design rectangular water tank',
    formula: 'Water Tank Design',
    inputs: [
      { name: 'capacity', label: 'Capacity (liters)', type: 'number', defaultValue: 10000 },
      { name: 'height', label: 'Height (m)', type: 'number', defaultValue: 2 },
    ],
  },
  'road-quantity': {
    name: 'Road Quantity',
    description: 'Calculate bituminous road material quantity',
    formula: 'MORTH Specifications',
    inputs: [
      { name: 'length', label: 'Road Length (m)', type: 'number', defaultValue: 1000 },
      { name: 'width', label: 'Road Width (m)', type: 'number', defaultValue: 7 },
      { name: 'thickness', label: 'Layer Thickness (mm)', type: 'number', defaultValue: 100 },
      { name: 'density', label: 'Density (t/m³)', type: 'number', defaultValue: 2.35 },
    ],
  },
  'pipe-flow': {
    name: 'Pipe Flow (Hazen-Williams)',
    description: 'Calculate flow in a pipe using Hazen-Williams equation',
    formula: 'V = 0.849 × C × R^0.63 × S^0.54',
    inputs: [
      { name: 'diameter', label: 'Pipe Diameter (mm)', type: 'number', defaultValue: 100 },
      { name: 'length', label: 'Pipe Length (m)', type: 'number', defaultValue: 100 },
      { name: 'headLoss', label: 'Head Loss (m)', type: 'number', defaultValue: 5 },
      { name: 'roughness', label: 'Roughness Coefficient (C)', type: 'number', defaultValue: 120 },
    ],
  },
  'load': {
    name: 'Load Calculation',
    description: 'Calculate loads and load combinations as per IS 875',
    formula: 'IS 875 - Load Combinations',
    inputs: [
      { name: 'deadLoad', label: 'Dead Load (kN)', type: 'number', defaultValue: 100 },
      { name: 'liveLoad', label: 'Live Load (kN)', type: 'number', defaultValue: 40 },
      { name: 'windLoad', label: 'Wind Load (kN)', type: 'number', defaultValue: 0 },
    ],
  },
  'slope': {
    name: 'Slope Calculation',
    description: 'Calculate slope percentage, angle and ratio',
    formula: 'Slope% = (Rise/Run) × 100',
    inputs: [
      { name: 'rise', label: 'Rise (m)', type: 'number', defaultValue: 1 },
      { name: 'run', label: 'Run (m)', type: 'number', defaultValue: 4 },
    ],
  },
  'cement': {
    name: 'Cement & Mortar',
    description: 'Calculate cement and sand for plaster/mortar',
    formula: 'Cement Mortar Calculation',
    inputs: [
      { name: 'area', label: 'Area (m²)', type: 'number', defaultValue: 100 },
      { name: 'thickness', label: 'Thickness (mm)', type: 'number', defaultValue: 12 },
      { name: 'ratio', label: 'Mix Ratio (1:Cement:Sand)', type: 'number', defaultValue: 6 },
    ],
  },
};