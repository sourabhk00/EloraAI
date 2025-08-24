// Advanced Data Analytics - TypeScript Implementation

export interface DataSource {
  type: 'csv' | 'excel' | 'json' | 'pdf' | 'docx' | 'txt' | 'api';
  path?: string;
  data?: any;
  url?: string;
}

export interface AnalysisOptions {
  analysisType: 'descriptive' | 'correlation' | 'clustering' | 'timeSeries' | 'text' | 'comparative';
  columns?: string[];
  targetColumn?: string;
  groupBy?: string;
  dateColumn?: string;
  customOptions?: Record<string, any>;
}

export interface VisualizationOptions {
  chartType: 'line' | 'bar' | 'scatter' | 'heatmap' | 'pie' | 'histogram' | 'box' | 'violin' | 'wordcloud' | 'treemap' | 'sunburst' | '3d_scatter' | 'surface' | 'funnel';
  xAxis?: string;
  yAxis?: string;
  colorBy?: string;
  title?: string;
  subtitle?: string;
  theme?: 'light' | 'dark' | 'minimal' | 'modern';
  interactive?: boolean;
  animations?: boolean;
}

export interface InsightResult {
  type: 'trend' | 'correlation' | 'anomaly' | 'pattern' | 'summary';
  title: string;
  description: string;
  confidence: number;
  data: any;
  visualizations?: string[];
}

export class AdvancedDataAnalyzer {
  private data: any[] = [];
  private metadata: Record<string, any> = {};
  
  async loadData(source: DataSource): Promise<void> {
    try {
      switch (source.type) {
        case 'csv':
          if (source.path) {
            const fs = await import('fs/promises');
            const csvData = await fs.readFile(source.path, 'utf-8');
            this.data = this.parseCSV(csvData);
          } else if (source.data) {
            this.data = source.data;
          }
          break;
          
        case 'json':
          if (source.path) {
            const fs = await import('fs/promises');
            const jsonData = await fs.readFile(source.path, 'utf-8');
            this.data = JSON.parse(jsonData);
          } else if (source.data) {
            this.data = source.data;
          }
          break;
          
        case 'excel':
          // In a real implementation, you'd use a library like xlsx
          throw new Error('Excel support requires additional dependencies');
          
        case 'pdf':
          if (source.path) {
            this.data = await this.extractTextFromPDF(source.path);
          }
          break;
          
        case 'docx':
          if (source.path) {
            this.data = await this.extractTextFromDocx(source.path);
          }
          break;
          
        case 'api':
          if (source.url) {
            const response = await fetch(source.url);
            this.data = await response.json();
          }
          break;
      }
      
      this.analyzeMetadata();
    } catch (error) {
      throw new Error(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseCSV(csvData: string): any[] {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        const value = values[index];
        // Try to parse as number
        const numValue = parseFloat(value);
        row[header] = isNaN(numValue) ? value : numValue;
      });
      return row;
    });
    
    return rows;
  }

  private async extractTextFromPDF(filePath: string): Promise<string[]> {
    // This would require a PDF parsing library
    // For now, return placeholder
    return ['PDF text extraction requires additional dependencies'];
  }

  private async extractTextFromDocx(filePath: string): Promise<string[]> {
    // This would require a DOCX parsing library
    // For now, return placeholder
    return ['DOCX text extraction requires additional dependencies'];
  }

  private analyzeMetadata(): void {
    if (this.data.length === 0) return;
    
    const firstRow = this.data[0];
    const columns = Object.keys(firstRow);
    
    this.metadata = {
      rowCount: this.data.length,
      columnCount: columns.length,
      columns: columns.map(col => ({
        name: col,
        type: this.inferColumnType(col),
        uniqueValues: this.getUniqueCount(col),
        nullCount: this.getNullCount(col),
        summary: this.getColumnSummary(col)
      })),
      dateColumns: this.identifyDateColumns(),
      numericColumns: this.identifyNumericColumns(),
      categoricalColumns: this.identifyCategoricalColumns()
    };
  }

  private inferColumnType(columnName: string): 'numeric' | 'categorical' | 'datetime' | 'text' {
    const values = this.data.map(row => row[columnName]).filter(v => v != null);
    if (values.length === 0) return 'text';
    
    // Check if all values are numbers
    const numericValues = values.filter(v => typeof v === 'number' || !isNaN(parseFloat(v)));
    if (numericValues.length === values.length) return 'numeric';
    
    // Check if values look like dates
    const dateValues = values.filter(v => !isNaN(Date.parse(v)));
    if (dateValues.length > values.length * 0.8) return 'datetime';
    
    // Check if categorical (limited unique values)
    const uniqueValues = new Set(values);
    if (uniqueValues.size < values.length * 0.5 && uniqueValues.size < 20) return 'categorical';
    
    return 'text';
  }

  private getUniqueCount(columnName: string): number {
    const values = this.data.map(row => row[columnName]);
    return new Set(values).size;
  }

  private getNullCount(columnName: string): number {
    return this.data.filter(row => row[columnName] == null).length;
  }

  private getColumnSummary(columnName: string): any {
    const values = this.data.map(row => row[columnName]).filter(v => v != null);
    const type = this.inferColumnType(columnName);
    
    switch (type) {
      case 'numeric':
        const numValues = values.map(v => typeof v === 'number' ? v : parseFloat(v));
        return {
          min: Math.min(...numValues),
          max: Math.max(...numValues),
          mean: numValues.reduce((a, b) => a + b, 0) / numValues.length,
          median: this.calculateMedian(numValues),
          std: this.calculateStandardDeviation(numValues)
        };
      case 'categorical':
        const counts = this.getValueCounts(values);
        return { topValues: Object.entries(counts).slice(0, 5) };
      case 'datetime':
        const dates = values.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
        return {
          earliest: new Date(Math.min(...dates.map(d => d.getTime()))),
          latest: new Date(Math.max(...dates.map(d => d.getTime()))),
          range: dates.length > 0 ? Math.max(...dates.map(d => d.getTime())) - Math.min(...dates.map(d => d.getTime())) : 0
        };
      default:
        return { sampleValues: values.slice(0, 3) };
    }
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[middle - 1] + sorted[middle]) / 2 
      : sorted[middle];
  }

  private calculateStandardDeviation(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(x => Math.pow(x - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private getValueCounts(values: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    values.forEach(value => {
      const key = String(value);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  private identifyDateColumns(): string[] {
    return this.metadata.columns
      ?.filter((col: any) => col.type === 'datetime')
      .map((col: any) => col.name) || [];
  }

  private identifyNumericColumns(): string[] {
    return this.metadata.columns
      ?.filter((col: any) => col.type === 'numeric')
      .map((col: any) => col.name) || [];
  }

  private identifyCategoricalColumns(): string[] {
    return this.metadata.columns
      ?.filter((col: any) => col.type === 'categorical')
      .map((col: any) => col.name) || [];
  }

  async performAnalysis(options: AnalysisOptions): Promise<InsightResult[]> {
    const insights: InsightResult[] = [];
    
    switch (options.analysisType) {
      case 'descriptive':
        insights.push(...this.performDescriptiveAnalysis(options));
        break;
      case 'correlation':
        insights.push(...this.performCorrelationAnalysis(options));
        break;
      case 'clustering':
        insights.push(...this.performClusteringAnalysis(options));
        break;
      case 'timeSeries':
        insights.push(...this.performTimeSeriesAnalysis(options));
        break;
      case 'text':
        insights.push(...this.performTextAnalysis(options));
        break;
      case 'comparative':
        insights.push(...this.performComparativeAnalysis(options));
        break;
    }
    
    return insights;
  }

  private performDescriptiveAnalysis(options: AnalysisOptions): InsightResult[] {
    const insights: InsightResult[] = [];
    const numericColumns = options.columns?.filter(col => 
      this.metadata.numericColumns.includes(col)
    ) || this.metadata.numericColumns;
    
    // Summary statistics
    insights.push({
      type: 'summary',
      title: 'Dataset Overview',
      description: `Dataset contains ${this.metadata.rowCount} rows and ${this.metadata.columnCount} columns. ${this.metadata.numericColumns.length} numeric columns, ${this.metadata.categoricalColumns.length} categorical columns, and ${this.metadata.dateColumns.length} date columns.`,
      confidence: 1.0,
      data: this.metadata
    });
    
    // Distribution analysis
    numericColumns.forEach(col => {
      const values = this.data.map(row => row[col]).filter(v => v != null && !isNaN(v));
      if (values.length > 0) {
        const summary = this.getColumnSummary(col);
        insights.push({
          type: 'pattern',
          title: `${col} Distribution`,
          description: `Mean: ${summary.mean?.toFixed(2)}, Median: ${summary.median?.toFixed(2)}, Std: ${summary.std?.toFixed(2)}`,
          confidence: 0.9,
          data: { column: col, summary, values: values.slice(0, 100) }
        });
      }
    });
    
    return insights;
  }

  private performCorrelationAnalysis(options: AnalysisOptions): InsightResult[] {
    const insights: InsightResult[] = [];
    const numericColumns = this.metadata.numericColumns;
    
    if (numericColumns.length < 2) {
      return [{
        type: 'summary',
        title: 'Correlation Analysis',
        description: 'Insufficient numeric columns for correlation analysis',
        confidence: 1.0,
        data: {}
      }];
    }
    
    // Calculate correlation matrix
    const correlationMatrix = this.calculateCorrelationMatrix(numericColumns);
    
    // Find strong correlations
    const strongCorrelations = this.findStrongCorrelations(correlationMatrix, 0.7);
    
    strongCorrelations.forEach(corr => {
      insights.push({
        type: 'correlation',
        title: `Strong Correlation: ${corr.col1} vs ${corr.col2}`,
        description: `Correlation coefficient: ${corr.value.toFixed(3)}. ${corr.value > 0 ? 'Positive' : 'Negative'} correlation detected.`,
        confidence: Math.abs(corr.value),
        data: corr
      });
    });
    
    return insights;
  }

  private calculateCorrelationMatrix(columns: string[]): Record<string, Record<string, number>> {
    const matrix: Record<string, Record<string, number>> = {};
    
    columns.forEach(col1 => {
      matrix[col1] = {};
      columns.forEach(col2 => {
        matrix[col1][col2] = this.calculatePearsonCorrelation(col1, col2);
      });
    });
    
    return matrix;
  }

  private calculatePearsonCorrelation(col1: string, col2: string): number {
    const values1 = this.data.map(row => row[col1]).filter(v => v != null && !isNaN(v));
    const values2 = this.data.map(row => row[col2]).filter(v => v != null && !isNaN(v));
    
    const minLength = Math.min(values1.length, values2.length);
    const x = values1.slice(0, minLength);
    const y = values2.slice(0, minLength);
    
    if (x.length < 2) return 0;
    
    const meanX = x.reduce((a, b) => a + b, 0) / x.length;
    const meanY = y.reduce((a, b) => a + b, 0) / y.length;
    
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
    const denomX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0));
    const denomY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));
    
    return denomX * denomY === 0 ? 0 : numerator / (denomX * denomY);
  }

  private findStrongCorrelations(matrix: Record<string, Record<string, number>>, threshold: number) {
    const correlations: Array<{col1: string, col2: string, value: number}> = [];
    
    const columns = Object.keys(matrix);
    for (let i = 0; i < columns.length; i++) {
      for (let j = i + 1; j < columns.length; j++) {
        const value = matrix[columns[i]][columns[j]];
        if (Math.abs(value) >= threshold) {
          correlations.push({
            col1: columns[i],
            col2: columns[j],
            value
          });
        }
      }
    }
    
    return correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }

  private performClusteringAnalysis(options: AnalysisOptions): InsightResult[] {
    // Simplified clustering analysis
    const insights: InsightResult[] = [];
    const numericColumns = this.metadata.numericColumns;
    
    if (numericColumns.length < 2) {
      return [{
        type: 'summary',
        title: 'Clustering Analysis',
        description: 'Insufficient numeric columns for clustering analysis',
        confidence: 1.0,
        data: {}
      }];
    }
    
    // Simple k-means-like clustering (simplified implementation)
    const clusters = this.performSimpleClustering(numericColumns, 3);
    
    insights.push({
      type: 'pattern',
      title: 'Data Clusters Identified',
      description: `Found ${clusters.length} distinct clusters in the data. Clusters may represent different data patterns or groups.`,
      confidence: 0.8,
      data: { clusters, method: 'k-means', k: 3 }
    });
    
    return insights;
  }

  private performSimpleClustering(columns: string[], k: number): any[] {
    // Simplified clustering implementation
    const dataPoints = this.data.map(row => 
      columns.map(col => row[col]).filter(v => v != null && !isNaN(v))
    ).filter(point => point.length === columns.length);
    
    if (dataPoints.length === 0) return [];
    
    // Initialize centroids randomly
    const centroids = Array(k).fill(null).map(() => 
      columns.map(() => Math.random() * 100)
    );
    
    // Assign points to clusters (simplified)
    const clusters = Array(k).fill(null).map(() => [] as any[]);
    
    dataPoints.forEach(point => {
      let minDist = Infinity;
      let closestCluster = 0;
      
      centroids.forEach((centroid, i) => {
        const dist = Math.sqrt(
          point.reduce((sum, val, j) => sum + Math.pow(val - centroid[j], 2), 0)
        );
        if (dist < minDist) {
          minDist = dist;
          closestCluster = i;
        }
      });
      
      clusters[closestCluster].push(point);
    });
    
    return clusters.map((cluster, i) => ({
      id: i,
      size: cluster.length,
      centroid: centroids[i],
      points: cluster.slice(0, 10) // Sample points
    }));
  }

  private performTimeSeriesAnalysis(options: AnalysisOptions): InsightResult[] {
    const insights: InsightResult[] = [];
    const dateColumns = this.metadata.dateColumns;
    
    if (dateColumns.length === 0) {
      return [{
        type: 'summary',
        title: 'Time Series Analysis',
        description: 'No date columns found for time series analysis',
        confidence: 1.0,
        data: {}
      }];
    }
    
    const dateCol = options.dateColumn || dateColumns[0];
    const targetCol = options.targetColumn;
    
    if (!targetCol) {
      return [{
        type: 'summary',
        title: 'Time Series Analysis',
        description: 'No target column specified for time series analysis',
        confidence: 1.0,
        data: {}
      }];
    }
    
    // Sort data by date
    const sortedData = [...this.data].sort((a, b) => 
      new Date(a[dateCol]).getTime() - new Date(b[dateCol]).getTime()
    );
    
    // Detect trends
    const trend = this.detectTrend(sortedData, dateCol, targetCol);
    
    insights.push({
      type: 'trend',
      title: `Time Series Trend: ${targetCol}`,
      description: trend.description,
      confidence: trend.confidence,
      data: { trend: trend.type, slope: trend.slope, data: sortedData.slice(0, 100) }
    });
    
    return insights;
  }

  private detectTrend(data: any[], dateCol: string, targetCol: string): {
    type: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    description: string;
    confidence: number;
    slope: number;
  } {
    const values = data.map(row => row[targetCol]).filter(v => v != null && !isNaN(v));
    
    if (values.length < 3) {
      return {
        type: 'stable',
        description: 'Insufficient data points for trend analysis',
        confidence: 0.1,
        slope: 0
      };
    }
    
    // Simple linear trend calculation
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    let type: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    let description: string;
    let confidence: number;
    
    if (Math.abs(slope) < 0.01) {
      type = 'stable';
      description = 'The values remain relatively stable over time';
      confidence = 0.7;
    } else if (slope > 0) {
      type = 'increasing';
      description = `The values show an increasing trend with slope ${slope.toFixed(3)}`;
      confidence = 0.8;
    } else {
      type = 'decreasing';
      description = `The values show a decreasing trend with slope ${slope.toFixed(3)}`;
      confidence = 0.8;
    }
    
    return { type, description, confidence, slope };
  }

  private performTextAnalysis(options: AnalysisOptions): InsightResult[] {
    // Simplified text analysis
    const insights: InsightResult[] = [];
    
    // Find text columns
    const textColumns = this.metadata.columns
      ?.filter((col: any) => col.type === 'text')
      .map((col: any) => col.name) || [];
    
    if (textColumns.length === 0) {
      return [{
        type: 'summary',
        title: 'Text Analysis',
        description: 'No text columns found for analysis',
        confidence: 1.0,
        data: {}
      }];
    }
    
    textColumns.forEach(col => {
      const textData = this.data.map(row => row[col]).filter(v => v && typeof v === 'string');
      
      if (textData.length > 0) {
        const wordFreq = this.analyzeWordFrequency(textData);
        const sentiment = this.analyzeSentiment(textData);
        
        insights.push({
          type: 'pattern',
          title: `Text Analysis: ${col}`,
          description: `Found ${textData.length} text entries. Top words: ${Object.keys(wordFreq).slice(0, 3).join(', ')}`,
          confidence: 0.7,
          data: { column: col, wordFrequency: wordFreq, sentiment, sampleTexts: textData.slice(0, 5) }
        });
      }
    });
    
    return insights;
  }

  private analyzeWordFrequency(texts: string[]): Record<string, number> {
    const wordCounts: Record<string, number> = {};
    
    texts.forEach(text => {
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2);
      
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });
    
    // Return top 20 words
    return Object.fromEntries(
      Object.entries(wordCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
    );
  }

  private analyzeSentiment(texts: string[]): { positive: number; negative: number; neutral: number } {
    // Simplified sentiment analysis using basic word lists
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'love', 'like', 'happy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'angry', 'disappointed', 'worst'];
    
    let positive = 0, negative = 0, neutral = 0;
    
    texts.forEach(text => {
      const words = text.toLowerCase().split(/\s+/);
      const posCount = words.filter(word => positiveWords.includes(word)).length;
      const negCount = words.filter(word => negativeWords.includes(word)).length;
      
      if (posCount > negCount) positive++;
      else if (negCount > posCount) negative++;
      else neutral++;
    });
    
    return { positive, negative, neutral };
  }

  private performComparativeAnalysis(options: AnalysisOptions): InsightResult[] {
    const insights: InsightResult[] = [];
    
    if (!options.groupBy) {
      return [{
        type: 'summary',
        title: 'Comparative Analysis',
        description: 'No grouping column specified for comparison',
        confidence: 1.0,
        data: {}
      }];
    }
    
    const groups = this.groupData(options.groupBy);
    const numericColumns = options.columns?.filter(col => 
      this.metadata.numericColumns.includes(col)
    ) || this.metadata.numericColumns;
    
    Object.keys(groups).forEach(groupName => {
      const groupData = groups[groupName];
      
      numericColumns.forEach(col => {
        const values = groupData.map(row => row[col]).filter(v => v != null && !isNaN(v));
        if (values.length > 0) {
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          
          insights.push({
            type: 'pattern',
            title: `${groupName}: ${col} Analysis`,
            description: `Group ${groupName} has ${values.length} records with mean ${col} of ${mean.toFixed(2)}`,
            confidence: 0.8,
            data: { group: groupName, column: col, mean, count: values.length, values: values.slice(0, 20) }
          });
        }
      });
    });
    
    return insights;
  }

  private groupData(groupByColumn: string): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    this.data.forEach(row => {
      const groupValue = String(row[groupByColumn] || 'Unknown');
      if (!groups[groupValue]) {
        groups[groupValue] = [];
      }
      groups[groupValue].push(row);
    });
    
    return groups;
  }

  async generateVisualization(options: VisualizationOptions): Promise<string> {
    // Return visualization configuration that can be used by frontend charting library
    const config = {
      type: options.chartType,
      data: this.prepareVisualizationData(options),
      layout: {
        title: {
          text: options.title || 'Data Visualization',
          font: { size: 18 }
        },
        xaxis: { title: options.xAxis || 'X Axis' },
        yaxis: { title: options.yAxis || 'Y Axis' },
        theme: options.theme || 'light'
      },
      config: {
        responsive: true,
        displayModeBar: options.interactive !== false
      }
    };
    
    return JSON.stringify(config);
  }

  private prepareVisualizationData(options: VisualizationOptions): any {
    switch (options.chartType) {
      case 'line':
      case 'scatter':
        return this.data.map(row => ({
          x: options.xAxis ? row[options.xAxis] : null,
          y: options.yAxis ? row[options.yAxis] : null,
          color: options.colorBy ? row[options.colorBy] : undefined
        })).filter(point => point.x != null && point.y != null);
        
      case 'bar':
        const grouped = this.groupData(options.xAxis || Object.keys(this.data[0])[0]);
        return Object.entries(grouped).map(([key, values]) => ({
          x: key,
          y: options.yAxis ? values.reduce((sum, row) => sum + (row[options.yAxis] || 0), 0) : values.length
        }));
        
      case 'pie':
        const pieCounts = this.getValueCounts(
          this.data.map(row => row[options.xAxis || Object.keys(row)[0]])
        );
        return Object.entries(pieCounts).map(([label, value]) => ({ label, value }));
        
      case 'histogram':
        const values = this.data.map(row => row[options.xAxis || '']).filter(v => v != null && !isNaN(v));
        return values;
        
      default:
        return this.data.slice(0, 1000); // Limit for performance
    }
  }

  getMetadata(): Record<string, any> {
    return this.metadata;
  }

  getData(): any[] {
    return this.data;
  }

  async exportResults(insights: InsightResult[], format: 'json' | 'csv' | 'pdf' = 'json'): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify({
          metadata: this.metadata,
          insights,
          generatedAt: new Date().toISOString()
        }, null, 2);
        
      case 'csv':
        // Convert insights to CSV format
        const csvHeaders = ['Type', 'Title', 'Description', 'Confidence'];
        const csvRows = insights.map(insight => [
          insight.type,
          insight.title,
          insight.description,
          insight.confidence.toString()
        ]);
        
        return [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
        
      case 'pdf':
        // Return PDF generation instructions (would need PDF library)
        return JSON.stringify({
          instructions: 'PDF generation requires additional dependencies',
          insights
        });
        
      default:
        return JSON.stringify(insights);
    }
  }
}

// Advanced statistical functions
export class StatisticalAnalyzer {
  static calculateRegression(x: number[], y: number[]): {
    slope: number;
    intercept: number;
    rSquared: number;
    equation: string;
  } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const meanY = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    return {
      slope,
      intercept,
      rSquared,
      equation: `y = ${slope.toFixed(3)}x + ${intercept.toFixed(3)}`
    };
  }

  static performANOVA(groups: number[][]): {
    fStatistic: number;
    pValue: number;
    significant: boolean;
  } {
    // Simplified ANOVA implementation
    const allValues = groups.flat();
    const grandMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
    
    // Between-group sum of squares
    const ssBetween = groups.reduce((sum, group) => {
      const groupMean = group.reduce((a, b) => a + b, 0) / group.length;
      return sum + group.length * Math.pow(groupMean - grandMean, 2);
    }, 0);
    
    // Within-group sum of squares
    const ssWithin = groups.reduce((sum, group) => {
      const groupMean = group.reduce((a, b) => a + b, 0) / group.length;
      return sum + group.reduce((groupSum, value) => groupSum + Math.pow(value - groupMean, 2), 0);
    }, 0);
    
    const dfBetween = groups.length - 1;
    const dfWithin = allValues.length - groups.length;
    
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;
    
    const fStatistic = msBetween / msWithin;
    
    // Simplified p-value calculation (would need proper F-distribution)
    const pValue = fStatistic > 4 ? 0.01 : fStatistic > 2 ? 0.05 : 0.1;
    
    return {
      fStatistic,
      pValue,
      significant: pValue < 0.05
    };
  }

  static detectOutliers(values: number[], method: 'iqr' | 'zscore' = 'iqr'): {
    outliers: number[];
    indices: number[];
    threshold: number;
  } {
    if (method === 'iqr') {
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      const outliers: number[] = [];
      const indices: number[] = [];
      
      values.forEach((value, index) => {
        if (value < lowerBound || value > upperBound) {
          outliers.push(value);
          indices.push(index);
        }
      });
      
      return { outliers, indices, threshold: 1.5 };
    } else {
      // Z-score method
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / values.length);
      
      const outliers: number[] = [];
      const indices: number[] = [];
      
      values.forEach((value, index) => {
        const zscore = Math.abs((value - mean) / std);
        if (zscore > 3) {
          outliers.push(value);
          indices.push(index);
        }
      });
      
      return { outliers, indices, threshold: 3 };
    }
  }
}