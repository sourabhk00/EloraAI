import { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Save, 
  RotateCcw,
  Settings,
  Shuffle,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Network,
  GitBranch,
  Activity,
  Target,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loading } from '@/components/ui/loading';

interface GraphGeneratorProps {
  initialGraph?: any;
  onSave?: (graph: any) => void;
  onClose?: () => void;
}

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  group?: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  color: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    type: string;
    nodeCount: number;
    edgeCount: number;
    density: number;
    clustering: number;
  };
}

export default function GraphGenerator({ initialGraph, onSave, onClose }: GraphGeneratorProps) {
  const [graph, setGraph] = useState<GraphData | null>(initialGraph || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState('force-directed');
  const [graphType, setGraphType] = useState('random');
  const [nodeCount, setNodeCount] = useState(50);
  const [edgeProbability, setEdgeProbability] = useState(0.1);
  const [analysis, setAnalysis] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const graphTypes = [
    { id: 'random', name: 'Random Network', description: 'Erdős–Rényi random graph' },
    { id: 'scale-free', name: 'Scale-Free', description: 'Barabási–Albert model' },
    { id: 'small-world', name: 'Small World', description: 'Watts–Strogatz model' },
    { id: 'hierarchical', name: 'Hierarchical', description: 'Tree-like structure' },
    { id: 'community', name: 'Community', description: 'Clustered communities' },
    { id: 'grid', name: 'Grid Network', description: 'Regular grid layout' },
    { id: 'star', name: 'Star Network', description: 'Central hub structure' },
    { id: 'ring', name: 'Ring Network', description: 'Circular connection' }
  ];

  const layoutAlgorithms = [
    { id: 'force-directed', name: 'Force-Directed', description: 'Spring-mass simulation' },
    { id: 'circular', name: 'Circular', description: 'Nodes arranged in circle' },
    { id: 'grid', name: 'Grid', description: 'Regular grid layout' },
    { id: 'hierarchical', name: 'Hierarchical', description: 'Tree-like hierarchy' },
    { id: 'spring', name: 'Spring', description: 'Spring embedding' },
    { id: 'kamada-kawai', name: 'Kamada-Kawai', description: 'Stress minimization' },
    { id: 'spectral', name: 'Spectral', description: 'Eigenvector positioning' },
    { id: 'random', name: 'Random', description: 'Random positioning' }
  ];

  const analysisMetrics = [
    { id: 'centrality', name: 'Centrality Analysis', icon: <Target className="w-4 h-4" /> },
    { id: 'clustering', name: 'Clustering Coefficient', icon: <Users className="w-4 h-4" /> },
    { id: 'communities', name: 'Community Detection', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'connectivity', name: 'Connectivity Analysis', icon: <Network className="w-4 h-4" /> },
    { id: 'shortest-path', name: 'Shortest Paths', icon: <Activity className="w-4 h-4" /> }
  ];

  useEffect(() => {
    if (graph && canvasRef.current) {
      drawGraph();
    }
  }, [graph, selectedLayout]);

  const generateGraph = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/graph/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: graphType,
          nodeCount,
          edgeProbability,
          layout: selectedLayout
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setGraph(result.graph);
        setAnalysis(null);
      }
    } catch (error) {
      console.error('Error generating graph:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyLayout = async (layoutId: string) => {
    if (!graph) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/graph/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graph,
          layout: layoutId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setGraph(result.graph);
        setSelectedLayout(layoutId);
      }
    } catch (error) {
      console.error('Error applying layout:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const runAnalysis = async (analysisType: string) => {
    if (!graph) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/graph/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graph,
          analysisType
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
      }
    } catch (error) {
      console.error('Error running analysis:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas || !graph) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw edges
    graph.edges.forEach(edge => {
      const sourceNode = graph.nodes.find(n => n.id === edge.source);
      const targetNode = graph.nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = edge.color || 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = Math.max(0.5, edge.weight * 2);
        ctx.stroke();
      }
    });

    // Draw nodes
    graph.nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size || 5, 0, 2 * Math.PI);
      ctx.fillStyle = node.color || '#ffffff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw node labels
      if (node.label && node.size > 8) {
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.size + 12);
      }
    });
  };

  const startAnimation = () => {
    if (!graph) return;
    
    setIsAnimating(true);
    
    const animate = () => {
      // Simple force-directed animation
      const updatedGraph = { ...graph };
      
      // Apply forces between nodes
      updatedGraph.nodes.forEach((node, i) => {
        let fx = 0, fy = 0;
        
        // Repulsion from other nodes
        updatedGraph.nodes.forEach((other, j) => {
          if (i !== j) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 100 / (distance * distance);
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          }
        });
        
        // Attraction along edges
        graph.edges.forEach(edge => {
          if (edge.source === node.id || edge.target === node.id) {
            const otherId = edge.source === node.id ? edge.target : edge.source;
            const other = graph.nodes.find(n => n.id === otherId);
            if (other) {
              const dx = other.x - node.x;
              const dy = other.y - node.y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = distance * 0.01;
              fx += (dx / distance) * force;
              fy += (dy / distance) * force;
            }
          }
        });
        
        // Update position
        node.x += fx * 0.1;
        node.y += fy * 0.1;
        
        // Keep within bounds
        const canvas = canvasRef.current;
        if (canvas) {
          node.x = Math.max(20, Math.min(canvas.clientWidth - 20, node.x));
          node.y = Math.max(20, Math.min(canvas.clientHeight - 20, node.y));
        }
      });
      
      setGraph(updatedGraph);
      
      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const exportGraph = () => {
    if (!graph) return;
    
    const exportData = {
      graph,
      analysis,
      layout: selectedLayout,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'network-graph.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveGraph = () => {
    if (graph && onSave) {
      onSave({ graph, analysis, layout: selectedLayout });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-md border-b border-white/10 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">Graph Generator</h1>
            <Badge variant="pro">Network Analysis</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={isAnimating ? stopAnimation : startAnimation}
              disabled={!graph}
              className="text-white hover:bg-white/10"
            >
              {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={exportGraph}
              disabled={!graph}
              className="text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              onClick={saveGraph}
              disabled={!graph}
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
          {/* Graph Generation */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Network className="w-4 h-4" />
                Generate Graph
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-white/60">Graph Type</label>
                <Select value={graphType} onValueChange={setGraphType}>
                  <SelectTrigger className="bg-white/10 border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {graphTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/60">
                  <span>Node Count</span>
                  <span>{nodeCount}</span>
                </div>
                <Slider
                  value={[nodeCount]}
                  onValueChange={([value]) => setNodeCount(value)}
                  min={10}
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/60">
                  <span>Edge Probability</span>
                  <span>{(edgeProbability * 100).toFixed(1)}%</span>
                </div>
                <Slider
                  value={[edgeProbability * 100]}
                  onValueChange={([value]) => setEdgeProbability(value / 100)}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>

              <Button
                onClick={generateGraph}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? <Loading size="sm" /> : <Shuffle className="w-4 h-4 mr-2" />}
                Generate Graph
              </Button>
            </CardContent>
          </Card>

          {/* Layout Algorithms */}
          {graph && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Layout Algorithm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {layoutAlgorithms.map((layout) => (
                  <Button
                    key={layout.id}
                    variant={selectedLayout === layout.id ? "default" : "outline"}
                    onClick={() => applyLayout(layout.id)}
                    disabled={isGenerating}
                    className="w-full justify-start text-left p-3 h-auto"
                  >
                    <div>
                      <div className="font-medium text-xs">{layout.name}</div>
                      <div className="text-xs text-white/60 mt-1">{layout.description}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Network Analysis */}
          {graph && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Network Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysisMetrics.map((metric) => (
                  <Button
                    key={metric.id}
                    variant="outline"
                    onClick={() => runAnalysis(metric.id)}
                    disabled={isGenerating}
                    className="w-full justify-start"
                  >
                    {metric.icon}
                    <span className="ml-2 text-xs">{metric.name}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Graph Statistics */}
          {graph && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm">Graph Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between text-white/80">
                  <span>Nodes:</span>
                  <span>{graph.metadata.nodeCount}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Edges:</span>
                  <span>{graph.metadata.edgeCount}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Density:</span>
                  <span>{(graph.metadata.density * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Clustering:</span>
                  <span>{(graph.metadata.clustering * 100).toFixed(2)}%</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 pt-20 p-8">
        {!graph ? (
          <div className="flex items-center justify-center h-full text-center text-white/60">
            <div>
              <Network className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl mb-2">No Graph Generated</h3>
              <p>Configure settings and generate a network graph to begin</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Canvas */}
            <div className="flex-1 relative">
              <canvas
                ref={canvasRef}
                className="w-full h-full border border-white/10 rounded-lg bg-black/20"
              />
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <Loading size="lg" text="Processing graph..." />
                </div>
              )}
            </div>

            {/* Analysis Results */}
            {analysis && (
              <Card className="mt-4 bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {Object.entries(analysis).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-white/60 text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                        <div className="text-white font-medium">
                          {typeof value === 'number' ? value.toFixed(3) : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}