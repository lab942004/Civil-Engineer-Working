import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, RotateCcw } from 'lucide-react';

const unitCategories = [
  {
    name: 'Length',
    units: [
      { name: 'Meter', toBase: 1, symbol: 'm' },
      { name: 'Kilometer', toBase: 1000, symbol: 'km' },
      { name: 'Centimeter', toBase: 0.01, symbol: 'cm' },
      { name: 'Millimeter', toBase: 0.001, symbol: 'mm' },
      { name: 'Mile', toBase: 1609.34, symbol: 'mi' },
      { name: 'Yard', toBase: 0.9144, symbol: 'yd' },
      { name: 'Foot', toBase: 0.3048, symbol: 'ft' },
      { name: 'Inch', toBase: 0.0254, symbol: 'in' },
    ],
  },
  {
    name: 'Area',
    units: [
      { name: 'Square Meter', toBase: 1, symbol: 'm²' },
      { name: 'Square Kilometer', toBase: 1e6, symbol: 'km²' },
      { name: 'Hectare', toBase: 10000, symbol: 'ha' },
      { name: 'Acre', toBase: 4046.86, symbol: 'ac' },
      { name: 'Square Foot', toBase: 0.0929, symbol: 'ft²' },
      { name: 'Square Yard', toBase: 0.8361, symbol: 'yd²' },
    ],
  },
  {
    name: 'Volume',
    units: [
      { name: 'Cubic Meter', toBase: 1, symbol: 'm³' },
      { name: 'Liter', toBase: 0.001, symbol: 'L' },
      { name: 'Milliliter', toBase: 1e-6, symbol: 'mL' },
      { name: 'Cubic Foot', toBase: 0.0283, symbol: 'ft³' },
      { name: 'Gallon', toBase: 0.003785, symbol: 'gal' },
    ],
  },
  {
    name: 'Weight / Mass',
    units: [
      { name: 'Kilogram', toBase: 1, symbol: 'kg' },
      { name: 'Gram', toBase: 0.001, symbol: 'g' },
      { name: 'Metric Ton', toBase: 1000, symbol: 't' },
      { name: 'Pound', toBase: 0.4536, symbol: 'lb' },
      { name: 'Kilonewton', toBase: 101.97, symbol: 'kN' },
    ],
  },
  {
    name: 'Pressure',
    units: [
      { name: 'Pascal', toBase: 1, symbol: 'Pa' },
      { name: 'Kilopascal', toBase: 1000, symbol: 'kPa' },
      { name: 'Megapascal', toBase: 1e6, symbol: 'MPa' },
      { name: 'N/mm²', toBase: 1e6, symbol: 'N/mm²' },
      { name: 'Bar', toBase: 1e5, symbol: 'bar' },
      { name: 'PSI', toBase: 6894.76, symbol: 'psi' },
    ],
  },
  {
    name: 'Temperature',
    units: [
      { name: 'Celsius', toBase: 1, symbol: '°C' },
      { name: 'Fahrenheit', toBase: 1, symbol: '°F' },
      { name: 'Kelvin', toBase: 1, symbol: 'K' },
    ],
  },
  {
    name: 'Flow',
    units: [
      { name: 'Liters/Second', toBase: 0.001, symbol: 'L/s' },
      { name: 'Cubic Meter/Hour', toBase: 1 / 3600, symbol: 'm³/h' },
      { name: 'Cubic Meter/Second', toBase: 1, symbol: 'm³/s' },
      { name: 'Gallons/Minute', toBase: 0.00006309, symbol: 'GPM' },
    ],
  },
  {
    name: 'Energy',
    units: [
      { name: 'Joule', toBase: 1, symbol: 'J' },
      { name: 'Kilojoule', toBase: 1000, symbol: 'kJ' },
      { name: 'Kilowatt-hour', toBase: 3.6e6, symbol: 'kWh' },
      { name: 'Calorie', toBase: 4184, symbol: 'cal' },
    ],
  },
  {
    name: 'Power',
    units: [
      { name: 'Watt', toBase: 1, symbol: 'W' },
      { name: 'Kilowatt', toBase: 1000, symbol: 'kW' },
      { name: 'Horsepower', toBase: 745.7, symbol: 'hp' },
    ],
  },
  {
    name: 'Speed',
    units: [
      { name: 'Meter/Second', toBase: 1, symbol: 'm/s' },
      { name: 'Kilometer/Hour', toBase: 0.2778, symbol: 'km/h' },
      { name: 'Miles/Hour', toBase: 0.447, symbol: 'mph' },
      { name: 'Knot', toBase: 0.5144, symbol: 'kn' },
    ],
  },
];

export default function ConverterPage() {
  const [category, setCategory] = useState(unitCategories[0].name);
  const [fromUnit, setFromUnit] = useState(unitCategories[0].units[0].name);
  const [toUnit, setToUnit] = useState(unitCategories[0].units[1].name);
  const [value, setValue] = useState('1');
  const [result, setResult] = useState('');

  const currentCategory = unitCategories.find((c) => c.name === category);
  const units = currentCategory?.units || [];

  const convert = (inputValue = value) => {
    const trimmed = inputValue.trim();
    if (!fromUnit || !toUnit || !trimmed) {
      setResult('');
      return;
    }

    const from = units.find((u) => u.name === fromUnit);
    const to = units.find((u) => u.name === toUnit);
    if (!from || !to) {
      setResult('');
      return;
    }

    const numValue = Number(trimmed);
    if (Number.isNaN(numValue)) {
      setResult('');
      return;
    }

    if (category === 'Temperature') {
      let celsius: number;
      if (fromUnit === 'Celsius') celsius = numValue;
      else if (fromUnit === 'Fahrenheit') celsius = ((numValue - 32) * 5) / 9;
      else celsius = numValue - 273.15;

      let converted: number;
      if (toUnit === 'Celsius') converted = celsius;
      else if (toUnit === 'Fahrenheit') converted = (celsius * 9) / 5 + 32;
      else converted = celsius + 273.15;

      setResult(converted.toFixed(4));
    } else {
      const baseValue = numValue * from.toBase;
      const converted = baseValue / to.toBase;
      setResult(converted.toFixed(6));
    }
  };

  const swap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    if (result) {
      setValue(result);
      setResult('');
    }
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const cat = unitCategories.find((c) => c.name === newCat);
    if (cat && cat.units.length >= 2) {
      setFromUnit(cat.units[0].name);
      setToUnit(cat.units[1].name);
    }
    setValue('1');
    setResult('');
  };

  const handleValueChange = (nextValue: string) => {
    setValue(nextValue);
    if (nextValue.trim()) {
      convert(nextValue);
    } else {
      setResult('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Unit Converter</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Convert between different engineering units</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowLeftRight size={18} />
              Converter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Category"
              options={unitCategories.map((c) => ({ label: c.name, value: c.name }))}
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="From"
                options={units.map((u) => ({ label: `${u.name} (${u.symbol})`, value: u.name }))}
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
              />
              <Select
                label="To"
                options={units.map((u) => ({ label: `${u.name} (${u.symbol})`, value: u.name }))}
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Value"
                  type="number"
                  placeholder="Enter value"
                  value={value}
                  onChange={(e) => handleValueChange(e.target.value)}
                />
              </div>
              <Button onClick={swap} variant="outline" className="mt-6">
                <RotateCcw size={16} />
              </Button>
            </div>
            <Button onClick={() => convert(value)} className="w-full">
              <ArrowLeftRight className="mr-2" size={16} />
              Convert
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Result</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="text-center p-6 rounded-xl bg-[hsl(221.2,83.2%,53.3%)]/10">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Converted Value</p>
                <p className="text-2xl font-bold text-[hsl(221.2,83.2%,53.3%)]">
                  {result} {units.find((u) => u.name === toUnit)?.symbol}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  {value} {units.find((u) => u.name === fromUnit)?.symbol}
                </p>
              </div>
            ) : (
              <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                <ArrowLeftRight className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p>Select units and enter a value</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Reference - {category}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {units.map((unit) => (
              <div key={unit.name} className="p-2 rounded-lg border border-[hsl(var(--border))] text-center">
                <p className="text-sm font-medium">{unit.symbol}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{unit.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}