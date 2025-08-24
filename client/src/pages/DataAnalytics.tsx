import { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  Download, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Activity,
  Database,
  Filter,
  Settings,
  Eye,
  RefreshCw,
  Save,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loading } from '@/components/ui/loading';

interface DataAnalyticsProps {
  initialData?: any;
  onSave?: (analysisResults: any) => void;
  onClose?: () => void;
}

interface Dataset {
  id: string;
  name: string;
  type: 'csv' | 'json' | 'excel' | 'api';
  size: number;
  columns: string[];
  rows: number;
  data: any[];
}

interface AnalysisResult {
  type: string;
  title: string;
  description: string;
  data: any;
  chartType: string;
  insights: string[];
}

export default function DataAnalytics({ initialData, onSave, onClose }: DataAnalyticsProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'overview' | 'analysis' | 'visualization'>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chartTypes = [
    { id: 'line', name: 'Line Chart', icon: <LineChart className="w-4 h-4" />, description: 'Time series and trends' },
    { id: 'bar', name: 'Bar Chart', icon: <BarChart3 className="w-4 h-4" />, description: 'Categorical comparisons' },
    { id: 'pie', name: 'Pie Chart', icon: <PieChart className="w-4 h-4" />, description: 'Part-to-whole relationships' },
    { id: 'scatter', name: 'Scatter Plot', icon: <Activity className="w-4 h-4" />, description: 'Correlations and relationships' },
    { id: 'heatmap', name: 'Heatmap', icon: <Database className="w-4 h-4" />, description: 'Correlation matrices' },
    { id: 'histogram', name: 'Histogram', icon: <BarChart3 className="w-4 h-4" />, description: 'Distribution analysis' },
    { id: 'box', name: 'Box Plot', icon: <Activity className="w-4 h-4" />, description: 'Statistical summaries' },
    { id: 'violin', name: 'Violin Plot', icon: <Activity className="w-4 h-4" />, description: 'Distribution shapes' }
  ];

  const analysisTypes = [
    { id: 'descriptive', name: 'Descriptive Statistics', description: 'Mean, median, std dev, quartiles' },
    { id: 'correlation', name: 'Correlation Analysis', description: 'Relationships between variables' },
    { id: 'clustering', name: 'Clustering Analysis', description: 'Group similar data points' },
    { id: 'time-series', name: 'Time Series Analysis', description: 'Trends and seasonality' },
    { id: 'text', name: 'Text Analysis', description: 'Sentiment and keyword extraction' },
    { id: 'comparative', name: 'Comparative Analysis', description: 'Compare different segments' },
    { id: 'regression', name: 'Regression Analysis', description: 'Predictive modeling' },
    { id: 'outlier', name: 'Outlier Detection', description: 'Identify anomalies' }
  ];

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/data/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        const newDataset: Dataset = {
          id: `dataset_${Date.now()}`,
          name: file.name,
          type: getFileType(file.name),
          size: file.size,
          columns: result.columns || [],
          rows: result.rows || 0,
          data: result.data || []
        };
        
        setDatasets(prev => [...prev, newDataset]);
        setSelectedDataset(newDataset.id);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFileType = (filename: string): 'csv' | 'json' | 'excel' | 'api' => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'csv') return 'csv';
    if (ext === 'json') return 'json';
    if (ext === 'xlsx' || ext === 'xls') return 'excel';
    return 'csv';
  };

  const runAnalysis = async (analysisType: string) => {
    if (!selectedDataset) return;
    
    const dataset = datasets.find(d => d.id === selectedDataset);
    if (!dataset) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/data/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: selectedDataset,
          analysisType,
          data: dataset.data
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const newAnalysis: AnalysisResult = {
          type: analysisType,
          title: result.title,
          description: result.description,
          data: result.data,
          chartType: result.chartType,
          insights: result.insights || []
        };
        
        setAnalyses(prev => [...prev, newAnalysis]);
        setCurrentView('analysis');
      }
    } catch (error) {
      console.error('Error running analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateVisualization = async (chartType: string, analysisId?: string) => {
    if (!selectedDataset && !analysisId) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/data/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: selectedDataset,
          chartType,
          analysisId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Handle visualization result
        setCurrentView('visualization');
      }
    } catch (error) {
      console.error('Error generating visualization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportResults = () => {
    const exportData = {
      datasets,
      analyses,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'analysis-results.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveAnalysis = () => {
    if (onSave) {
      onSave({ datasets, analyses });
    }
  };

  const currentDataset = selectedDataset ? datasets.find(d => d.id === selectedDataset) : null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-md border-b border-white/10 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">Data Analytics</h1>
            <Badge variant="pro">Advanced Analytics</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportResults}
              disabled={analyses.length === 0}
              className="text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              onClick={saveAnalysis}
              disabled={analyses.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-black/60 backdrop-blur-md border-r border-white/10 pt-20 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Data Upload */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                variant="outline"
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Data File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {datasets.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-white/60">Loaded Datasets:</div>
                  <Select value={selectedDataset || ""} onValueChange={setSelectedDataset}>
                    <SelectTrigger className="bg-white/10 border-white/20">
                      <SelectValue placeholder="Select dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((dataset) => (
                        <SelectItem key={dataset.id} value={dataset.id}>
                          <div className="flex items-center gap-2">
                            {dataset.type === 'csv' && <FileText className="w-3 h-3" />}
                            {dataset.type === 'excel' && <FileSpreadsheet className="w-3 h-3" />}
                            {dataset.type === 'json' && <Database className="w-3 h-3" />}
                            <span className="truncate">{dataset.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dataset Info */}
          {currentDataset && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm">Dataset Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between text-white/80">
                  <span>Rows:</span>
                  <span>{currentDataset.rows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Columns:</span>
                  <span>{currentDataset.columns.length}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Size:</span>
                  <span>{(currentDataset.size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="space-y-1">
                  <div className="text-white/60 text-xs">Columns:</div>
                  <div className="text-white/80 text-xs space-y-1">
                    {currentDataset.columns.slice(0, 5).map((col, idx) => (
                      <div key={idx} className="truncate">{col}</div>
                    ))}
                    {currentDataset.columns.length > 5 && (
                      <div className="text-white/40">+{currentDataset.columns.length - 5} more</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Types */}
          {currentDataset && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Analysis Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysisTypes.map((analysis) => (
                  <Button
                    key={analysis.id}
                    variant="outline"
                    onClick={() => runAnalysis(analysis.id)}
                    disabled={isLoading}
                    className="w-full justify-start text-left p-3 h-auto"
                  >
                    <div>
                      <div className="font-medium text-xs">{analysis.name}</div>
                      <div className="text-xs text-white/60 mt-1">{analysis.description}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Chart Types */}
          {currentDataset && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Visualizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {chartTypes.map((chart) => (
                    <Button
                      key={chart.id}
                      variant="outline"
                      size="sm"
                      onClick={() => generateVisualization(chart.id)}
                      disabled={isLoading}
                      className="flex flex-col items-center p-3 h-auto"
                    >
                      {chart.icon}
                      <span className="text-xs mt-1">{chart.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-20 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loading size="lg" text="Processing data..." />
          </div>
        ) : (
          <div className="p-8">
            <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
              <TabsList className="grid w-full grid-cols-3 bg-white/10 mb-6">
                <TabsTrigger value="overview" className="text-white">
                  <Eye className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="analysis" className="text-white">
                  <Activity className="w-4 h-4 mr-2" />
                  Analysis
                </TabsTrigger>
                <TabsTrigger value="visualization" className="text-white">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Visualization
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                {!currentDataset ? (
                  <div className="text-center text-white/60 mt-20">
                    <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl mb-2">No Data Loaded</h3>
                    <p>Upload a CSV, Excel, or JSON file to begin analysis</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white">Data Preview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/10">
                                {currentDataset.columns.slice(0, 6).map((col, idx) => (
                                  <th key={idx} className="text-left p-2 text-white/80 font-medium">
                                    {col}
                                  </th>
                                ))}
                                {currentDataset.columns.length > 6 && (
                                  <th className="text-left p-2 text-white/40">...</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {currentDataset.data.slice(0, 5).map((row, idx) => (
                                <tr key={idx} className="border-b border-white/5">
                                  {currentDataset.columns.slice(0, 6).map((col, colIdx) => (
                                    <td key={colIdx} className="p-2 text-white/60">
                                      {String(row[col] || '-').substring(0, 20)}
                                    </td>
                                  ))}
                                  {currentDataset.columns.length > 6 && (
                                    <td className="p-2 text-white/40">...</td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {currentDataset.data.length > 5 && (
                            <div className="text-center text-white/40 text-xs mt-2">
                              +{currentDataset.data.length - 5} more rows
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analysis">
                {analyses.length === 0 ? (
                  <div className="text-center text-white/60 mt-20">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl mb-2">No Analysis Results</h3>
                    <p>Run an analysis from the sidebar to see results here</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {analyses.map((analysis, idx) => (
                      <Card key={idx} className="bg-white/5 border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white">{analysis.title}</CardTitle>
                          <p className="text-white/60 text-sm">{analysis.description}</p>
                        </CardHeader>
                        <CardContent>
                          {analysis.insights.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-white/80 font-medium">Key Insights:</h4>
                              <ul className="space-y-1">
                                {analysis.insights.map((insight, insightIdx) => (
                                  <li key={insightIdx} className="text-white/60 text-sm">
                                    • {insight}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysis.data && (
                            <div className="mt-4 p-4 bg-black/20 rounded border">
                              <pre className="text-white/60 text-xs overflow-x-auto">
                                {JSON.stringify(analysis.data, null, 2).substring(0, 500)}
                                {JSON.stringify(analysis.data).length > 500 && '...'}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="visualization">
                <div className="text-center text-white/60 mt-20">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl mb-2">Interactive Visualizations</h3>
                  <p>Chart visualizations will appear here when generated</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}