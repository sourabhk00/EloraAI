import { GoogleGenerativeAI } from '@google/generative-ai';

interface DataAnalysisRequest {
  data: any[] | string; // CSV data or JSON array
  analysisType: 'descriptive' | 'predictive' | 'diagnostic' | 'prescriptive' | 'comprehensive';
  parameters?: {
    targetColumn?: string;
    groupBy?: string;
    timeColumn?: string;
    correlationAnalysis?: boolean;
    outlierDetection?: boolean;
    trendAnalysis?: boolean;
  };
}

interface DataAnalysisResult {
  success: boolean;
  analysis: {
    summary: {
      totalRows: number;
      totalColumns: number;
      dataTypes: { [key: string]: string };
      missingValues: { [key: string]: number };
      duplicateRows: number;
    };
    descriptiveStats: {
      [column: string]: {
        mean?: number;
        median?: number;
        mode?: any;
        standardDeviation?: number;
        variance?: number;
        min?: number;
        max?: number;
        quartiles?: number[];
        distribution?: string;
      };
    };
    correlationMatrix?: { [key: string]: { [key: string]: number } };
    trends?: Array<{
      column: string;
      trend: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
      confidence: number;
      insights: string[];
    }>;
    outliers?: Array<{
      column: string;
      outlierValues: any[];
      outlierCount: number;
      method: string;
    }>;
    insights: {
      keyFindings: string[];
      patterns: string[];
      recommendations: string[];
      businessImplications: string[];
    };
    visualizations: Array<{
      type: 'bar' | 'line' | 'scatter' | 'histogram' | 'heatmap' | 'pie';
      title: string;
      description: string;
      chartConfig: any;
    }>;
  };
  processedData?: any[];
  message: string;
}

interface VisualizationRequest {
  data: any[];
  chartType: 'bar' | 'line' | 'scatter' | 'histogram' | 'heatmap' | 'pie' | 'box' | 'area';
  xColumn: string;
  yColumn?: string;
  groupBy?: string;
  title?: string;
  theme?: 'light' | 'dark';
}

export class DataAnalytics {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async analyzeData(request: DataAnalysisRequest): Promise<DataAnalysisResult> {
    try {
      // Parse data if it's a string (CSV)
      let parsedData: any[] = [];
      if (typeof request.data === 'string') {
        parsedData = this.parseCSV(request.data);
      } else {
        parsedData = request.data;
      }

      if (!parsedData.length) {
        return {
          success: false,
          analysis: {} as any,
          message: 'No data provided or data could not be parsed.'
        };
      }

      // Perform basic data analysis
      const summary = this.generateSummary(parsedData);
      const descriptiveStats = this.calculateDescriptiveStats(parsedData);
      const correlationMatrix = request.parameters?.correlationAnalysis 
        ? this.calculateCorrelationMatrix(parsedData) 
        : undefined;
      const trends = request.parameters?.trendAnalysis 
        ? this.analyzeTrends(parsedData, request.parameters.timeColumn) 
        : undefined;
      const outliers = request.parameters?.outlierDetection 
        ? this.detectOutliers(parsedData) 
        : undefined;

      // Use AI for advanced insights
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const dataPreview = JSON.stringify(parsedData.slice(0, 5), null, 2);
      const statsPreview = JSON.stringify(descriptiveStats, null, 2);

      const analysisPrompt = `Analyze this dataset and provide comprehensive insights:

DATASET PREVIEW (first 5 rows):
${dataPreview}

DESCRIPTIVE STATISTICS:
${statsPreview}

DATASET SUMMARY:
- Total Rows: ${summary.totalRows}
- Total Columns: ${summary.totalColumns}
- Data Types: ${Object.entries(summary.dataTypes).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Missing Values: ${Object.entries(summary.missingValues).map(([k, v]) => `${k}: ${v}`).join(', ')}

Please provide:

1. KEY FINDINGS:
   - Most important insights from the data
   - Notable patterns and trends
   - Significant relationships between variables

2. DATA QUALITY ASSESSMENT:
   - Data completeness and accuracy
   - Potential data quality issues
   - Recommendations for data cleaning

3. BUSINESS INSIGHTS:
   - Actionable business recommendations
   - Strategic implications
   - Areas for further investigation

4. STATISTICAL INSIGHTS:
   - Distribution characteristics
   - Correlation insights
   - Variance and spread analysis

5. VISUALIZATION RECOMMENDATIONS:
   - Best chart types for this data
   - Key variables to visualize
   - Dashboard suggestions

6. PREDICTIVE OPPORTUNITIES:
   - Potential prediction targets
   - Machine learning applications
   - Forecasting possibilities

Be specific and provide actionable insights rather than generic observations.`;

      const result = await model.generateContent(analysisPrompt);
      const aiInsights = result.response.text();

      // Generate recommended visualizations
      const visualizations = this.generateVisualizationRecommendations(parsedData, summary);

      const analysis = {
        summary,
        descriptiveStats,
        correlationMatrix,
        trends,
        outliers,
        insights: {
          keyFindings: this.extractKeyFindings(aiInsights),
          patterns: this.extractPatterns(aiInsights),
          recommendations: this.extractRecommendations(aiInsights),
          businessImplications: this.extractBusinessImplications(aiInsights)
        },
        visualizations
      };

      return {
        success: true,
        analysis,
        processedData: parsedData,
        message: `Data analysis completed successfully!

**AI-Powered Insights:**
${aiInsights}

**Analysis Summary:**
- **Dataset Size:** ${summary.totalRows.toLocaleString()} rows × ${summary.totalColumns} columns
- **Data Quality:** ${this.assessDataQuality(summary)}
- **Key Variables:** ${Object.keys(descriptiveStats).slice(0, 5).join(', ')}
- **Recommended Charts:** ${visualizations.slice(0, 3).map(v => v.type).join(', ')}

**Quick Stats:**
${Object.entries(descriptiveStats).slice(0, 3).map(([col, stats]) => 
  `- **${col}:** ${stats.mean ? `Mean: ${stats.mean.toFixed(2)}` : `Mode: ${stats.mode}`}`
).join('\n')}

The dataset has been comprehensively analyzed with both statistical methods and AI-powered insights.`
      };

    } catch (error) {
      console.error('Data analysis error:', error);
      return {
        success: false,
        analysis: {} as any,
        message: `Data analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your data format and API configuration.`
      };
    }
  }

  async generateVisualization(request: VisualizationRequest): Promise<{
    success: boolean;
    chartConfig: any;
    chartUrl?: string;
    message: string;
  }> {
    try {
      const chartConfig = this.createChartConfig(request);
      
      // Generate QuickChart URL for instant visualization
      const chartUrl = this.generateQuickChartUrl(chartConfig);

      return {
        success: true,
        chartConfig,
        chartUrl,
        message: `Visualization generated successfully! Chart type: ${request.chartType}`
      };

    } catch (error) {
      return {
        success: false,
        chartConfig: null,
        message: `Visualization generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private parseCSV(csvString: string): any[] {
    try {
      const lines = csvString.trim().split('\n');
      if (lines.length < 2) return [];

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index] || '';
          // Try to parse as number
          const numValue = parseFloat(value);
          row[header] = !isNaN(numValue) && value !== '' ? numValue : value;
        });
        
        data.push(row);
      }

      return data;
    } catch (error) {
      console.error('CSV parsing error:', error);
      return [];
    }
  }

  private generateSummary(data: any[]): any {
    if (!data.length) return {};

    const totalRows = data.length;
    const totalColumns = Object.keys(data[0]).length;
    const dataTypes: { [key: string]: string } = {};
    const missingValues: { [key: string]: number } = {};

    Object.keys(data[0]).forEach(column => {
      const values = data.map(row => row[column]).filter(v => v !== undefined && v !== null && v !== '');
      const nonEmptyValues = data.length - values.length;
      
      missingValues[column] = nonEmptyValues;

      // Determine data type
      if (values.length > 0) {
        const firstValue = values[0];
        if (typeof firstValue === 'number') {
          dataTypes[column] = 'numeric';
        } else if (typeof firstValue === 'string') {
          // Check if it looks like a date
          if (new Date(firstValue).toString() !== 'Invalid Date') {
            dataTypes[column] = 'date';
          } else {
            dataTypes[column] = 'categorical';
          }
        } else {
          dataTypes[column] = 'mixed';
        }
      } else {
        dataTypes[column] = 'unknown';
      }
    });

    // Count duplicate rows
    const duplicateRows = data.length - new Set(data.map(row => JSON.stringify(row))).size;

    return {
      totalRows,
      totalColumns,
      dataTypes,
      missingValues,
      duplicateRows
    };
  }

  private calculateDescriptiveStats(data: any[]): any {
    const stats: any = {};

    Object.keys(data[0]).forEach(column => {
      const values = data.map(row => row[column]).filter(v => v !== undefined && v !== null && v !== '');
      
      if (values.length === 0) {
        stats[column] = { count: 0 };
        return;
      }

      const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));
      
      if (numericValues.length > 0) {
        // Numeric statistics
        const sorted = numericValues.sort((a, b) => a - b);
        const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
        const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length;
        
        stats[column] = {
          count: numericValues.length,
          mean: mean,
          median: sorted[Math.floor(sorted.length / 2)],
          standardDeviation: Math.sqrt(variance),
          variance: variance,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          quartiles: [
            sorted[Math.floor(sorted.length * 0.25)],
            sorted[Math.floor(sorted.length * 0.5)],
            sorted[Math.floor(sorted.length * 0.75)]
          ]
        };
      } else {
        // Categorical statistics
        const valueCounts: { [key: string]: number } = {};
        values.forEach(val => {
          const key = String(val);
          valueCounts[key] = (valueCounts[key] || 0) + 1;
        });

        const mode = Object.entries(valueCounts).reduce((max, [key, count]) => 
          count > max.count ? { value: key, count } : max, 
          { value: '', count: 0 }
        );

        stats[column] = {
          count: values.length,
          uniqueValues: Object.keys(valueCounts).length,
          mode: mode.value,
          valueCounts: valueCounts
        };
      }
    });

    return stats;
  }

  private calculateCorrelationMatrix(data: any[]): { [key: string]: { [key: string]: number } } {
    const numericColumns = Object.keys(data[0]).filter(col => {
      const values = data.map(row => row[col]).filter(v => typeof v === 'number' && !isNaN(v));
      return values.length > 0;
    });

    const correlationMatrix: { [key: string]: { [key: string]: number } } = {};

    numericColumns.forEach(col1 => {
      correlationMatrix[col1] = {};
      numericColumns.forEach(col2 => {
        correlationMatrix[col1][col2] = this.calculateCorrelation(data, col1, col2);
      });
    });

    return correlationMatrix;
  }

  private calculateCorrelation(data: any[], col1: string, col2: string): number {
    const pairs = data.map(row => [row[col1], row[col2]])
      .filter(([x, y]) => typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y));

    if (pairs.length < 2) return 0;

    const n = pairs.length;
    const sumX = pairs.reduce((sum, [x]) => sum + x, 0);
    const sumY = pairs.reduce((sum, [, y]) => sum + y, 0);
    const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0);
    const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0);
    const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private analyzeTrends(data: any[], timeColumn?: string): any[] {
    if (!timeColumn) return [];

    const trends: any[] = [];
    const numericColumns = Object.keys(data[0]).filter(col => 
      col !== timeColumn && 
      data.some(row => typeof row[col] === 'number')
    );

    numericColumns.forEach(column => {
      const timeSeriesData = data
        .filter(row => row[timeColumn] && typeof row[column] === 'number')
        .sort((a, b) => new Date(a[timeColumn]).getTime() - new Date(b[timeColumn]).getTime());

      if (timeSeriesData.length > 2) {
        const trend = this.calculateTrend(timeSeriesData.map(row => row[column]));
        trends.push({
          column,
          trend: trend.direction,
          confidence: trend.confidence,
          insights: [`${column} shows a ${trend.direction} trend over time`]
        });
      }
    });

    return trends;
  }

  private calculateTrend(values: number[]): { direction: string; confidence: number } {
    if (values.length < 3) return { direction: 'stable', confidence: 0 };

    let increases = 0;
    let decreases = 0;

    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) increases++;
      else if (values[i] < values[i - 1]) decreases++;
    }

    const totalChanges = increases + decreases;
    if (totalChanges === 0) return { direction: 'stable', confidence: 1 };

    const increaseRatio = increases / totalChanges;
    const confidence = Math.abs(increaseRatio - 0.5) * 2;

    if (increaseRatio > 0.6) return { direction: 'increasing', confidence };
    if (increaseRatio < 0.4) return { direction: 'decreasing', confidence };
    return { direction: 'stable', confidence: 1 - confidence };
  }

  private detectOutliers(data: any[]): any[] {
    const outliers: any[] = [];
    
    Object.keys(data[0]).forEach(column => {
      const numericValues = data.map(row => row[column])
        .filter(v => typeof v === 'number' && !isNaN(v));

      if (numericValues.length > 4) {
        const sorted = numericValues.sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const outlierValues = numericValues.filter(v => v < lowerBound || v > upperBound);
        
        if (outlierValues.length > 0) {
          outliers.push({
            column,
            outlierValues,
            outlierCount: outlierValues.length,
            method: 'IQR'
          });
        }
      }
    });

    return outliers;
  }

  private generateVisualizationRecommendations(data: any[], summary: any): any[] {
    const visualizations: any[] = [];
    const columns = Object.keys(data[0]);

    // Bar chart for categorical data
    const categoricalColumns = columns.filter(col => summary.dataTypes[col] === 'categorical');
    if (categoricalColumns.length > 0) {
      visualizations.push({
        type: 'bar',
        title: `Distribution of ${categoricalColumns[0]}`,
        description: 'Shows the frequency of different categories',
        chartConfig: this.createBarChartConfig(data, categoricalColumns[0])
      });
    }

    // Line chart for time series
    const timeColumns = columns.filter(col => summary.dataTypes[col] === 'date');
    const numericColumns = columns.filter(col => summary.dataTypes[col] === 'numeric');
    
    if (timeColumns.length > 0 && numericColumns.length > 0) {
      visualizations.push({
        type: 'line',
        title: `${numericColumns[0]} over Time`,
        description: 'Shows trends over time',
        chartConfig: this.createLineChartConfig(data, timeColumns[0], numericColumns[0])
      });
    }

    // Scatter plot for correlation
    if (numericColumns.length >= 2) {
      visualizations.push({
        type: 'scatter',
        title: `${numericColumns[0]} vs ${numericColumns[1]}`,
        description: 'Shows relationship between two numeric variables',
        chartConfig: this.createScatterChartConfig(data, numericColumns[0], numericColumns[1])
      });
    }

    // Histogram for distribution
    if (numericColumns.length > 0) {
      visualizations.push({
        type: 'histogram',
        title: `Distribution of ${numericColumns[0]}`,
        description: 'Shows the distribution of values',
        chartConfig: this.createHistogramConfig(data, numericColumns[0])
      });
    }

    return visualizations;
  }

  private createChartConfig(request: VisualizationRequest): any {
    switch (request.chartType) {
      case 'bar':
        return this.createBarChartConfig(request.data, request.xColumn, request.yColumn);
      case 'line':
        return this.createLineChartConfig(request.data, request.xColumn, request.yColumn);
      case 'scatter':
        return this.createScatterChartConfig(request.data, request.xColumn, request.yColumn);
      case 'histogram':
        return this.createHistogramConfig(request.data, request.xColumn);
      default:
        return this.createBarChartConfig(request.data, request.xColumn, request.yColumn);
    }
  }

  private createBarChartConfig(data: any[], xColumn: string, yColumn?: string): any {
    const labels = [...new Set(data.map(row => row[xColumn]))];
    const values = yColumn 
      ? labels.map(label => {
          const filteredData = data.filter(row => row[xColumn] === label);
          return filteredData.reduce((sum, row) => sum + (row[yColumn] || 0), 0);
        })
      : labels.map(label => data.filter(row => row[xColumn] === label).length);

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: yColumn || 'Count',
          data: values,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${yColumn || 'Count'} by ${xColumn}`
          }
        }
      }
    };
  }

  private createLineChartConfig(data: any[], xColumn: string, yColumn?: string): any {
    const sortedData = data.sort((a, b) => new Date(a[xColumn]).getTime() - new Date(b[xColumn]).getTime());
    const labels = sortedData.map(row => row[xColumn]);
    const values = yColumn ? sortedData.map(row => row[yColumn]) : sortedData.map((_, index) => index);

    return {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: yColumn || 'Value',
          data: values,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${yColumn || 'Value'} over ${xColumn}`
          }
        }
      }
    };
  }

  private createScatterChartConfig(data: any[], xColumn: string, yColumn?: string): any {
    if (!yColumn) return {};

    const scatterData = data
      .filter(row => typeof row[xColumn] === 'number' && typeof row[yColumn] === 'number')
      .map(row => ({ x: row[xColumn], y: row[yColumn] }));

    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${yColumn} vs ${xColumn}`,
          data: scatterData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${yColumn} vs ${xColumn}`
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: xColumn
            }
          },
          y: {
            title: {
              display: true,
              text: yColumn
            }
          }
        }
      }
    };
  }

  private createHistogramConfig(data: any[], column: string): any {
    const values = data.map(row => row[column]).filter(v => typeof v === 'number' && !isNaN(v));
    
    // Create bins
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
    const binSize = (max - min) / binCount;
    
    const bins = Array.from({ length: binCount }, (_, i) => ({
      min: min + i * binSize,
      max: min + (i + 1) * binSize,
      count: 0
    }));

    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
      bins[binIndex].count++;
    });

    return {
      type: 'bar',
      data: {
        labels: bins.map(bin => `${bin.min.toFixed(1)}-${bin.max.toFixed(1)}`),
        datasets: [{
          label: 'Frequency',
          data: bins.map(bin => bin.count),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Distribution of ${column}`
          }
        }
      }
    };
  }

  private generateQuickChartUrl(chartConfig: any): string {
    const configString = encodeURIComponent(JSON.stringify(chartConfig));
    return `https://quickchart.io/chart?c=${configString}`;
  }

  private assessDataQuality(summary: any): string {
    const missingValuePercentage = Object.values(summary.missingValues).reduce((sum: number, count: any) => sum + count, 0) / (summary.totalRows * summary.totalColumns);
    const duplicatePercentage = summary.duplicateRows / summary.totalRows;

    if (missingValuePercentage < 0.05 && duplicatePercentage < 0.01) return 'Excellent';
    if (missingValuePercentage < 0.1 && duplicatePercentage < 0.05) return 'Good';
    if (missingValuePercentage < 0.2 && duplicatePercentage < 0.1) return 'Fair';
    return 'Needs Improvement';
  }

  private extractKeyFindings(analysis: string): string[] {
    const findings = analysis.match(/key findings?[:\s]*(.+?)(?=\n\n|\n[A-Z]|$)/is);
    if (findings) {
      return findings[1].split(/[.!]/).map(f => f.trim()).filter(f => f.length > 10).slice(0, 5);
    }
    return ['Comprehensive analysis completed'];
  }

  private extractPatterns(analysis: string): string[] {
    const patterns = analysis.match(/patterns?[:\s]*(.+?)(?=\n\n|\n[A-Z]|$)/is);
    if (patterns) {
      return patterns[1].split(/[.!]/).map(p => p.trim()).filter(p => p.length > 10).slice(0, 5);
    }
    return ['Data patterns identified'];
  }

  private extractRecommendations(analysis: string): string[] {
    const recommendations = analysis.match(/recommendations?[:\s]*(.+?)(?=\n\n|\n[A-Z]|$)/is);
    if (recommendations) {
      return recommendations[1].split(/[.!]/).map(r => r.trim()).filter(r => r.length > 10).slice(0, 5);
    }
    return ['Further analysis recommended'];
  }

  private extractBusinessImplications(analysis: string): string[] {
    const implications = analysis.match(/business[:\s]*(.+?)(?=\n\n|\n[A-Z]|$)/is);
    if (implications) {
      return implications[1].split(/[.!]/).map(i => i.trim()).filter(i => i.length > 10).slice(0, 5);
    }
    return ['Business insights available'];
  }
}