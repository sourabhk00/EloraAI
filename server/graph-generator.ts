// Dynamic graph generation for mathematical functions
export interface GraphConfig {
  title: string;
  equation: string;
  xMin: number;
  xMax: number;
  step: number;
  color?: string;
}

export function generateGraphUrl(config: GraphConfig): string {
  const { title, equation, xMin, xMax, step, color = '#3b82f6' } = config;
  
  // Generate data points
  const labels: number[] = [];
  const data: number[] = [];
  
  for (let x = xMin; x <= xMax; x += step) {
    labels.push(Math.round(x * 100) / 100); // Round to 2 decimal places
    try {
      const y = evaluateEquation(equation, x);
      data.push(Math.round(y * 1000) / 1000); // Round to 3 decimal places
    } catch (error) {
      data.push(0); // Default value for invalid calculations
    }
  }

  // Create QuickChart configuration
  const chartConfig = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `y = ${equation}`,
        data: data,
        borderColor: color,
        backgroundColor: color + '20',
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2
      }]
    },
    options: {
      title: {
        display: true,
        text: title
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'x'
          },
          grid: {
            display: true
          }
        },
        y: {
          title: {
            display: true,
            text: 'y'
          },
          grid: {
            display: true
          }
        }
      },
      plugins: {
        legend: {
          display: true
        }
      }
    }
  };

  // Encode for URL
  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?c=${encodedConfig}`;
}

function evaluateEquation(equation: string, x: number): number {
  // Replace mathematical functions and constants
  let expr = equation
    .replace(/x/g, x.toString())
    .replace(/sin/g, 'Math.sin')
    .replace(/cos/g, 'Math.cos')
    .replace(/tan/g, 'Math.tan')
    .replace(/log/g, 'Math.log')
    .replace(/ln/g, 'Math.log')
    .replace(/sqrt/g, 'Math.sqrt')
    .replace(/abs/g, 'Math.abs')
    .replace(/pi/g, 'Math.PI')
    .replace(/e/g, 'Math.E')
    .replace(/\^/g, '**'); // Convert ^ to ** for exponentiation

  try {
    // Use Function constructor for safe evaluation
    return new Function('Math', `return ${expr}`)(Math);
  } catch (error) {
    return 0;
  }
}

export function detectMathematicalFunction(input: string): GraphConfig | null {
  const normalizedInput = input.toLowerCase().trim();
  
  // Common mathematical function patterns
  const patterns = [
    // y = equation format
    { pattern: /y\s*=\s*(.+)/, title: (match: string) => `Graph of y = ${match}` },
    // graph of equation format
    { pattern: /graph\s+(?:of\s+)?(.+)/, title: (match: string) => `Graph of ${match}` },
    // plot equation format
    { pattern: /plot\s+(.+)/, title: (match: string) => `Plot of ${match}` },
    // show equation format
    { pattern: /show\s+(?:graph\s+(?:of\s+)?)?(.+)/, title: (match: string) => `Graph of ${match}` }
  ];

  for (const { pattern, title } of patterns) {
    const match = normalizedInput.match(pattern);
    if (match && match[1]) {
      const equation = match[1].trim();
      
      // Skip if it's just asking about a concept without an equation
      if (equation.length < 2 || !isValidEquation(equation)) {
        continue;
      }

      return {
        title: title(equation),
        equation: equation,
        xMin: -10,
        xMax: 10,
        step: 0.1,
        color: '#3b82f6'
      };
    }
  }

  return null;
}

function isValidEquation(equation: string): boolean {
  // Check if the equation contains mathematical elements
  const mathElements = /[x\+\-\*\/\^\(\)0-9]|sin|cos|tan|log|ln|sqrt|abs|pi|e/i;
  return mathElements.test(equation) && equation.includes('x');
}

// Predefined common mathematical functions
export const commonGraphs: Record<string, GraphConfig> = {
  'sin(x)': {
    title: 'Sine Function',
    equation: 'sin(x)',
    xMin: -2 * Math.PI,
    xMax: 2 * Math.PI,
    step: 0.1,
    color: '#ef4444'
  },
  'cos(x)': {
    title: 'Cosine Function',
    equation: 'cos(x)',
    xMin: -2 * Math.PI,
    xMax: 2 * Math.PI,
    step: 0.1,
    color: '#3b82f6'
  },
  'tan(x)': {
    title: 'Tangent Function',
    equation: 'tan(x)',
    xMin: -Math.PI,
    xMax: Math.PI,
    step: 0.05,
    color: '#10b981'
  },
  'x^2': {
    title: 'Quadratic Function',
    equation: 'x**2',
    xMin: -5,
    xMax: 5,
    step: 0.1,
    color: '#8b5cf6'
  },
  'x^3': {
    title: 'Cubic Function',
    equation: 'x**3',
    xMin: -3,
    xMax: 3,
    step: 0.1,
    color: '#f59e0b'
  },
  '2^x': {
    title: 'Exponential Function',
    equation: '2**x',
    xMin: -5,
    xMax: 5,
    step: 0.1,
    color: '#ec4899'
  },
  'log(x)': {
    title: 'Logarithmic Function',
    equation: 'log(x)',
    xMin: 0.1,
    xMax: 10,
    step: 0.1,
    color: '#06b6d4'
  },
  'sqrt(x)': {
    title: 'Square Root Function',
    equation: 'sqrt(x)',
    xMin: 0,
    xMax: 10,
    step: 0.1,
    color: '#84cc16'
  }
};