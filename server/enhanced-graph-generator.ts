// Enhanced Graph Generator - TypeScript Implementation
// Premium features: Interactive 3D graphs, mathematical equations, data visualization
// Supports multiple export formats and real-time updates

import { evaluate, parse, compile } from 'mathjs';

export interface GraphNode {
  id: string;
  label: string;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  type?: string;
  properties?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight?: number;
  color?: string;
  type?: string;
  properties?: Record<string, any>;
}

export interface GraphLayout {
  type: 'force' | 'circular' | 'grid' | 'hierarchical' | 'spring' | 'kamada_kawai' | 'spectral' | 'random';
  iterations?: number;
  spacing?: number;
  attractionStrength?: number;
  repulsionStrength?: number;
}

export interface GraphStyle {
  nodeSize: number;
  nodeColor: string;
  edgeWidth: number;
  edgeColor: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  showLabels: boolean;
  showEdgeLabels: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata?: Record<string, any>;
}

export interface NetworkAnalysisResult {
  centralityMeasures: {
    betweenness: Record<string, number>;
    closeness: Record<string, number>;
    degree: Record<string, number>;
    eigenvector: Record<string, number>;
    pagerank: Record<string, number>;
  };
  clustering: {
    coefficient: number;
    communities: Array<{
      id: number;
      nodes: string[];
      size: number;
    }>;
  };
  connectivity: {
    connected: boolean;
    components: number;
    density: number;
    diameter?: number;
    averagePathLength?: number;
  };
  motifs: Array<{
    type: string;
    count: number;
    significance: number;
  }>;
}

export class EnhancedGraphGenerator {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number = 800;
  private height: number = 600;
  private graph: GraphData = { nodes: [], edges: [] };
  private layout: GraphLayout = { type: 'force' };
  private style: GraphStyle = {
    nodeSize: 10,
    nodeColor: '#3498db',
    edgeWidth: 1,
    edgeColor: '#95a5a6',
    fontSize: 12,
    fontColor: '#2c3e50',
    backgroundColor: '#ffffff',
    showLabels: true,
    showEdgeLabels: false
  };
  
  // Premium features enabled
  private premiumFeatures = {
    interactive3D: true,
    mathematicalGraphing: true,
    realTimeUpdates: true,
    advancedExports: true,
    customAnimations: true
  };

  constructor(canvasId?: string, width: number = 800, height: number = 600) {
    this.width = width;
    this.height = height;
    
    if (canvasId && typeof document !== 'undefined') {
      this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = width;
        this.canvas.height = height;
      }
    }
  }

  // Enhanced mathematical graph generation
  async generateMathematicalGraph(equation: string, options: any = {}): Promise<{
    success: boolean;
    graphData?: any;
    plotlyConfig?: any;
    visConfig?: any;
    message: string;
  }> {
    try {
      const {
        xMin = -10,
        xMax = 10,
        yMin = -10,
        yMax = 10,
        resolution = 0.1,
        graphType = '2d',
        interactive = true,
        theme = 'colorful'
      } = options;

      // Parse and compile the mathematical expression
      let compiledExpression;
      try {
        compiledExpression = compile(equation);
      } catch (parseError) {
        return {
          success: false,
          message: `Invalid mathematical expression: ${equation}. Please check the syntax.`
        };
      }

      const points: Array<{x: number, y: number, z?: number}> = [];
      const xValues: number[] = [];
      const yValues: number[] = [];
      const zValues: number[] = [];

      // Generate points for 2D graph with enhanced mathematical parsing
      if (graphType === '2d') {
        for (let x = xMin; x <= xMax; x += resolution) {
          try {
            // Enhanced equation parsing for common functions like sin(x), cos(x), etc.
            let processedEquation = equation.toLowerCase()
              .replace(/sin\s*\(/g, 'sin(')
              .replace(/cos\s*\(/g, 'cos(')
              .replace(/tan\s*\(/g, 'tan(')
              .replace(/log\s*\(/g, 'log(')
              .replace(/ln\s*\(/g, 'log(')
              .replace(/sqrt\s*\(/g, 'sqrt(')
              .replace(/abs\s*\(/g, 'abs(')
              .replace(/exp\s*\(/g, 'exp(');
            
            // Handle cases like 'sinx' -> 'sin(x)'
            processedEquation = processedEquation
              .replace(/sin\s*x/g, 'sin(x)')
              .replace(/cos\s*x/g, 'cos(x)')
              .replace(/tan\s*x/g, 'tan(x)')
              .replace(/\ba\s*sin\s*x/g, 'a * sin(x)')
              .replace(/\ba\s*cos\s*x/g, 'a * cos(x)')
              .replace(/\ba\s*tan\s*x/g, 'a * tan(x)');
            
            // Default 'a' to 1 if not specified
            if (processedEquation.includes('a') && !processedEquation.includes('a =')) {
              processedEquation = processedEquation.replace(/\ba\b/g, '1');
            }
            
            const compiledProcessed = compile(processedEquation);
            const y = compiledProcessed.evaluate({ x });
            
            if (typeof y === 'number' && !isNaN(y) && isFinite(y)) {
              points.push({ x: Number(x.toFixed(3)), y: Number(y.toFixed(6)) });
              xValues.push(x);
              yValues.push(y);
            }
          } catch (evalError) {
            // Try fallback evaluation
            try {
              const fallbackY = this.evaluateFallbackFunction(equation, x);
              if (typeof fallbackY === 'number' && !isNaN(fallbackY) && isFinite(fallbackY)) {
                points.push({ x: Number(x.toFixed(3)), y: Number(fallbackY.toFixed(6)) });
                xValues.push(x);
                yValues.push(fallbackY);
              }
            } catch {
              continue;
            }
          }
        }
      }
      // Generate points for 3D graph
      else if (graphType === '3d') {
        const zMin = options.zMin || -10;
        const zMax = options.zMax || 10;
        const resolution3d = options.resolution3d || 0.5;
        
        for (let x = xMin; x <= xMax; x += resolution3d) {
          for (let y = yMin; y <= yMax; y += resolution3d) {
            try {
              const z = compiledExpression.evaluate({ x, y });
              if (typeof z === 'number' && !isNaN(z) && isFinite(z)) {
                points.push({ x, y, z });
                xValues.push(x);
                yValues.push(y);
                zValues.push(z);
              }
            } catch (evalError) {
              continue;
            }
          }
        }
      }

      if (points.length === 0) {
        return {
          success: false,
          message: `No valid points generated for equation: ${equation}. Please check the domain and equation.`
        };
      }

      // Generate Plotly configuration for interactive graphs
      const plotlyConfig = this.generatePlotlyConfig(points, equation, graphType, theme);
      
      // Generate Vis.js configuration for network graphs
      const visConfig = this.generateVisNetworkConfig(points, equation, theme);

      return {
        success: true,
        graphData: points,
        plotlyConfig,
        visConfig,
        message: `Successfully generated ${graphType.toUpperCase()} interactive graph for: ${equation} with ${points.length} points`
      };
    } catch (error) {
      console.error('Mathematical graph generation error:', error);
      return {
        success: false,
        message: `Failed to generate mathematical graph: ${error}`
      };
    }
  }

  private generatePlotlyConfig(points: any[], equation: string, graphType: string, theme: string) {
    const colors = {
      light: { bg: '#ffffff', line: '#1f77b4', text: '#2c3e50' },
      dark: { bg: '#2c3e50', line: '#3498db', text: '#ecf0f1' },
      colorful: { bg: '#f8f9fa', line: '#e74c3c', text: '#2c3e50' }
    };
    const themeColors = colors[theme as keyof typeof colors] || colors.colorful;

    if (graphType === '2d') {
      return {
        data: [{
          x: points.map(p => p.x),
          y: points.map(p => p.y),
          type: 'scatter',
          mode: 'lines',
          name: `y = ${equation}`,
          line: {
            color: themeColors.line,
            width: 4,
            shape: 'spline',
            smoothing: 1.3
          },
          connectgaps: false
        }],
        layout: {
          title: {
            text: `Graph of ${equation}`,
            font: { size: 20, color: themeColors.text, family: 'Arial, sans-serif' }
          },
          xaxis: {
            title: { text: 'x', font: { size: 16, color: themeColors.text } },
            gridcolor: '#e1e5e9',
            zerolinecolor: '#6b7280',
            showgrid: true,
            zeroline: true,
            showspikes: true,
            spikemode: 'across',
            spikesnap: 'cursor'
          },
          yaxis: {
            title: { text: 'y', font: { size: 16, color: themeColors.text } },
            gridcolor: '#e1e5e9',
            zerolinecolor: '#6b7280',
            showgrid: true,
            zeroline: true,
            showspikes: true,
            spikemode: 'across',
            spikesnap: 'cursor'
          },
          plot_bgcolor: themeColors.bg,
          paper_bgcolor: themeColors.bg,
          font: { color: themeColors.text, family: 'Arial, sans-serif' },
          hovermode: 'x unified',
          showlegend: true,
          legend: {
            x: 0.02,
            y: 0.98,
            bgcolor: 'rgba(255,255,255,0.8)',
            bordercolor: '#ddd',
            borderwidth: 1
          },
          margin: { l: 80, r: 40, t: 80, b: 60 }
        },
        config: {
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToAdd: ['pan2d', 'lasso2d'],
          toImageButtonOptions: {
            format: 'png',
            filename: `graph_${equation.replace(/[^a-zA-Z0-9]/g, '_')}`,
            height: 700,
            width: 1000,
            scale: 2
          }
        }
      };
    } else if (graphType === '3d') {
      // Create 3D surface plot
      const xUnique = [...new Set(points.map(p => p.x))].sort((a, b) => a - b);
      const yUnique = [...new Set(points.map(p => p.y))].sort((a, b) => a - b);
      const zMatrix: number[][] = [];
      
      for (let i = 0; i < yUnique.length; i++) {
        zMatrix[i] = [];
        for (let j = 0; j < xUnique.length; j++) {
          const point = points.find(p => 
            Math.abs(p.x - xUnique[j]) < 0.01 && Math.abs(p.y - yUnique[i]) < 0.01
          );
          zMatrix[i][j] = point ? point.z || 0 : 0;
        }
      }

      return {
        data: [{
          x: xUnique,
          y: yUnique,
          z: zMatrix,
          type: 'surface',
          name: equation,
          colorscale: 'Viridis',
          showscale: true
        }],
        layout: {
          title: {
            text: `3D Interactive Surface: z = ${equation}`,
            font: { size: 18, color: themeColors.text }
          },
          scene: {
            xaxis: { title: 'x' },
            yaxis: { title: 'y' },
            zaxis: { title: 'z' },
            camera: {
              eye: { x: 1.5, y: 1.5, z: 1.5 }
            }
          },
          plot_bgcolor: themeColors.bg,
          paper_bgcolor: themeColors.bg,
          font: { color: themeColors.text }
        },
        config: {
          responsive: true,
          displayModeBar: true
        }
      };
    }
  }

  private generateVisNetworkConfig(points: any[], equation: string, theme: string) {
    // Convert mathematical points to network nodes for alternative visualization
    const nodes = points.slice(0, 100).map((point, index) => ({
      id: index,
      label: `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`,
      x: point.x * 50,
      y: point.y * 50,
      color: {
        background: theme === 'dark' ? '#3498db' : '#e74c3c',
        border: theme === 'dark' ? '#2980b9' : '#c0392b'
      },
      size: 15
    }));

    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        from: i,
        to: i + 1,
        color: theme === 'dark' ? '#95a5a6' : '#34495e',
        width: 2
      });
    }

    return {
      nodes,
      edges,
      options: {
        layout: {
          improvedLayout: true
        },
        physics: {
          enabled: true,
          stabilization: { iterations: 100 }
        },
        interaction: {
          hover: true,
          zoomView: true,
          dragView: true
        },
        nodes: {
          shape: 'circle',
          font: {
            color: theme === 'dark' ? '#ecf0f1' : '#2c3e50',
            size: 12
          }
        },
        edges: {
          smooth: {
            type: 'continuous'
          }
        }
      }
    };
  }

  // Graph generation methods
  generateRandomGraph(nodeCount: number, edgeCount: number): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Generate nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: `node_${i}`,
        label: `Node ${i}`,
        size: Math.random() * 20 + 5,
        color: this.getRandomColor(),
        properties: {
          degree: 0,
          created: new Date().toISOString()
        }
      });
    }

    // Generate edges
    const maxEdges = Math.min(edgeCount, (nodeCount * (nodeCount - 1)) / 2);
    const edgeSet = new Set<string>();

    while (edges.length < maxEdges) {
      const source = Math.floor(Math.random() * nodeCount);
      const target = Math.floor(Math.random() * nodeCount);

      if (source !== target) {
        const edgeKey = `${Math.min(source, target)}-${Math.max(source, target)}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            source: `node_${source}`,
            target: `node_${target}`,
            weight: Math.random(),
            color: this.style.edgeColor,
            properties: {
              strength: Math.random(),
              type: 'connection'
            }
          });

          // Update node degrees
          nodes[source].properties!.degree++;
          nodes[target].properties!.degree++;
        }
      }
    }

    this.graph = { nodes, edges, metadata: { type: 'random', generated: new Date().toISOString() } };
    return this.graph;
  }

  generateScaleFreeGraph(nodeCount: number, attachmentRate: number = 2): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Start with a small complete graph
    const initialNodes = Math.min(3, nodeCount);
    for (let i = 0; i < initialNodes; i++) {
      nodes.push({
        id: `node_${i}`,
        label: `Node ${i}`,
        size: 10,
        color: this.getRandomColor(),
        properties: { degree: initialNodes - 1 }
      });
    }

    // Create initial complete graph
    for (let i = 0; i < initialNodes; i++) {
      for (let j = i + 1; j < initialNodes; j++) {
        edges.push({
          source: `node_${i}`,
          target: `node_${j}`,
          weight: 1,
          color: this.style.edgeColor
        });
      }
    }

    // Add remaining nodes with preferential attachment
    for (let i = initialNodes; i < nodeCount; i++) {
      const newNode: GraphNode = {
        id: `node_${i}`,
        label: `Node ${i}`,
        size: 10,
        color: this.getRandomColor(),
        properties: { degree: 0 }
      };
      nodes.push(newNode);

      // Calculate attachment probabilities based on degree
      const totalDegree = nodes.slice(0, i).reduce((sum, node) => sum + (node.properties?.degree || 0), 0);
      const attachments = Math.min(attachmentRate, i);

      for (let j = 0; j < attachments; j++) {
        let cumulative = 0;
        const target = Math.random() * totalDegree;

        for (let k = 0; k < i; k++) {
          cumulative += nodes[k].properties?.degree || 0;
          if (cumulative >= target) {
            edges.push({
              source: `node_${i}`,
              target: `node_${k}`,
              weight: 1,
              color: this.style.edgeColor
            });
            nodes[i].properties!.degree++;
            nodes[k].properties!.degree++;
            break;
          }
        }
      }
    }

    this.graph = { nodes, edges, metadata: { type: 'scale-free', generated: new Date().toISOString() } };
    return this.graph;
  }

  generateSmallWorldGraph(nodeCount: number, nearestNeighbors: number, rewireProb: number): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Generate nodes in a ring
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: `node_${i}`,
        label: `Node ${i}`,
        size: 10,
        color: this.getRandomColor(),
        properties: { degree: 0, ring_position: i }
      });
    }

    // Connect each node to its nearest neighbors
    for (let i = 0; i < nodeCount; i++) {
      for (let j = 1; j <= nearestNeighbors / 2; j++) {
        const target1 = (i + j) % nodeCount;
        const target2 = (i - j + nodeCount) % nodeCount;

        // Add edge to target1
        if (Math.random() < rewireProb) {
          // Rewire to random node
          let randomTarget = Math.floor(Math.random() * nodeCount);
          while (randomTarget === i) {
            randomTarget = Math.floor(Math.random() * nodeCount);
          }
          edges.push({
            source: `node_${i}`,
            target: `node_${randomTarget}`,
            weight: 1,
            color: '#e74c3c', // Red for rewired edges
            type: 'rewired'
          });
        } else {
          edges.push({
            source: `node_${i}`,
            target: `node_${target1}`,
            weight: 1,
            color: this.style.edgeColor,
            type: 'original'
          });
        }

        // Add edge to target2 (if different from target1)
        if (target2 !== target1) {
          if (Math.random() < rewireProb) {
            let randomTarget = Math.floor(Math.random() * nodeCount);
            while (randomTarget === i) {
              randomTarget = Math.floor(Math.random() * nodeCount);
            }
            edges.push({
              source: `node_${i}`,
              target: `node_${randomTarget}`,
              weight: 1,
              color: '#e74c3c',
              type: 'rewired'
            });
          } else {
            edges.push({
              source: `node_${i}`,
              target: `node_${target2}`,
              weight: 1,
              color: this.style.edgeColor,
              type: 'original'
            });
          }
        }
      }
    }

    this.graph = { nodes, edges, metadata: { type: 'small-world', generated: new Date().toISOString() } };
    return this.graph;
  }

  generateHierarchicalGraph(levels: number, branchingFactor: number): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    let nodeCounter = 0;

    // Create root node
    const root: GraphNode = {
      id: `node_${nodeCounter++}`,
      label: 'Root',
      size: 20,
      color: '#e74c3c',
      properties: { level: 0, type: 'root' }
    };
    nodes.push(root);

    // Generate levels
    let currentLevelNodes = [root];
    for (let level = 1; level < levels; level++) {
      const nextLevelNodes: GraphNode[] = [];

      currentLevelNodes.forEach(parent => {
        for (let i = 0; i < branchingFactor; i++) {
          const child: GraphNode = {
            id: `node_${nodeCounter++}`,
            label: `L${level}N${i}`,
            size: Math.max(5, 20 - level * 2),
            color: this.getLevelColor(level),
            properties: { level, type: 'child', parent: parent.id }
          };
          nodes.push(child);
          nextLevelNodes.push(child);

          // Add edge from parent to child
          edges.push({
            source: parent.id,
            target: child.id,
            weight: 1,
            color: this.style.edgeColor,
            type: 'hierarchy'
          });
        }
      });

      currentLevelNodes = nextLevelNodes;
    }

    this.graph = { nodes, edges, metadata: { type: 'hierarchical', levels, generated: new Date().toISOString() } };
    return this.graph;
  }

  generateCommunityGraph(communities: number, nodesPerCommunity: number, interCommunityEdges: number): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    let nodeCounter = 0;

    // Generate communities
    for (let c = 0; c < communities; c++) {
      const communityNodes: GraphNode[] = [];
      const communityColor = this.getRandomColor();

      // Create nodes for this community
      for (let n = 0; n < nodesPerCommunity; n++) {
        const node: GraphNode = {
          id: `node_${nodeCounter++}`,
          label: `C${c}N${n}`,
          size: 10,
          color: communityColor,
          properties: { community: c, intra_degree: 0, inter_degree: 0 }
        };
        nodes.push(node);
        communityNodes.push(node);
      }

      // Create dense connections within community
      for (let i = 0; i < communityNodes.length; i++) {
        for (let j = i + 1; j < communityNodes.length; j++) {
          if (Math.random() < 0.7) { // High probability for intra-community edges
            edges.push({
              source: communityNodes[i].id,
              target: communityNodes[j].id,
              weight: 1,
              color: communityColor,
              type: 'intra-community'
            });
            communityNodes[i].properties!.intra_degree++;
            communityNodes[j].properties!.intra_degree++;
          }
        }
      }
    }

    // Add inter-community edges
    for (let i = 0; i < interCommunityEdges; i++) {
      const source = nodes[Math.floor(Math.random() * nodes.length)];
      const target = nodes[Math.floor(Math.random() * nodes.length)];

      if (source.properties?.community !== target.properties?.community) {
        edges.push({
          source: source.id,
          target: target.id,
          weight: 0.5,
          color: '#95a5a6',
          type: 'inter-community'
        });
        source.properties!.inter_degree++;
        target.properties!.inter_degree++;
      }
    }

    this.graph = { nodes, edges, metadata: { type: 'community', communities, generated: new Date().toISOString() } };
    return this.graph;
  }

  // Layout algorithms
  applyLayout(layout: GraphLayout): void {
    this.layout = layout;

    switch (layout.type) {
      case 'force':
        this.applyForceDirectedLayout(layout);
        break;
      case 'circular':
        this.applyCircularLayout();
        break;
      case 'grid':
        this.applyGridLayout();
        break;
      case 'hierarchical':
        this.applyHierarchicalLayout();
        break;
      case 'spring':
        this.applySpringLayout(layout);
        break;
      case 'random':
        this.applyRandomLayout();
        break;
    }
  }

  private applyForceDirectedLayout(layout: GraphLayout): void {
    const iterations = layout.iterations || 100;
    const attractionStrength = layout.attractionStrength || 0.01;
    const repulsionStrength = layout.repulsionStrength || 100;

    // Initialize positions randomly
    this.graph.nodes.forEach(node => {
      if (!node.x || !node.y) {
        node.x = Math.random() * this.width;
        node.y = Math.random() * this.height;
      }
    });

    // Force-directed algorithm
    for (let iter = 0; iter < iterations; iter++) {
      const forces: Array<{ fx: number; fy: number }> = this.graph.nodes.map(() => ({ fx: 0, fy: 0 }));

      // Calculate repulsive forces between all pairs of nodes
      for (let i = 0; i < this.graph.nodes.length; i++) {
        for (let j = i + 1; j < this.graph.nodes.length; j++) {
          const node1 = this.graph.nodes[i];
          const node2 = this.graph.nodes[j];
          
          const dx = node1.x! - node2.x!;
          const dy = node1.y! - node2.y!;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = repulsionStrength / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          forces[i].fx += fx;
          forces[i].fy += fy;
          forces[j].fx -= fx;
          forces[j].fy -= fy;
        }
      }

      // Calculate attractive forces for connected nodes
      this.graph.edges.forEach(edge => {
        const sourceIndex = this.graph.nodes.findIndex(n => n.id === edge.source);
        const targetIndex = this.graph.nodes.findIndex(n => n.id === edge.target);
        
        if (sourceIndex >= 0 && targetIndex >= 0) {
          const source = this.graph.nodes[sourceIndex];
          const target = this.graph.nodes[targetIndex];
          
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = attractionStrength * distance;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          forces[sourceIndex].fx += fx;
          forces[sourceIndex].fy += fy;
          forces[targetIndex].fx -= fx;
          forces[targetIndex].fy -= fy;
        }
      });

      // Apply forces and update positions
      this.graph.nodes.forEach((node, i) => {
        const damping = 0.9;
        node.x = Math.max(20, Math.min(this.width - 20, node.x! + forces[i].fx * damping));
        node.y = Math.max(20, Math.min(this.height - 20, node.y! + forces[i].fy * damping));
      });
    }
  }

  private applyCircularLayout(): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) / 2 - 50;

    this.graph.nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / this.graph.nodes.length;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });
  }

  private applyGridLayout(): void {
    const cols = Math.ceil(Math.sqrt(this.graph.nodes.length));
    const rows = Math.ceil(this.graph.nodes.length / cols);
    const cellWidth = this.width / cols;
    const cellHeight = this.height / rows;

    this.graph.nodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      node.x = col * cellWidth + cellWidth / 2;
      node.y = row * cellHeight + cellHeight / 2;
    });
  }

  private applyHierarchicalLayout(): void {
    const levels = new Map<number, GraphNode[]>();
    
    // Group nodes by level
    this.graph.nodes.forEach(node => {
      const level = node.properties?.level || 0;
      if (!levels.has(level)) {
        levels.set(level, []);
      }
      levels.get(level)!.push(node);
    });

    // Position nodes level by level
    const levelHeight = this.height / (levels.size + 1);
    levels.forEach((nodesInLevel, level) => {
      const y = (level + 1) * levelHeight;
      const spacing = this.width / (nodesInLevel.length + 1);
      
      nodesInLevel.forEach((node, index) => {
        node.x = (index + 1) * spacing;
        node.y = y;
      });
    });
  }

  private applySpringLayout(layout: GraphLayout): void {
    // Similar to force-directed but with spring forces
    this.applyForceDirectedLayout({
      ...layout,
      attractionStrength: 0.02,
      repulsionStrength: 50
    });
  }

  private applyRandomLayout(): void {
    this.graph.nodes.forEach(node => {
      node.x = Math.random() * (this.width - 40) + 20;
      node.y = Math.random() * (this.height - 40) + 20;
    });
  }

  // Enhanced generate method for API endpoint
  async generateGraph(request: any): Promise<{
    success: boolean;
    graphData?: any;
    plotlyConfig?: any;
    visConfig?: any;
    chartConfig?: any;
    message: string;
    attribution: string;
  }> {
    try {
      const {
        type = 'mathematical',
        equation,
        data,
        options = {}
      } = request;

      let result;

      switch (type) {
        case 'mathematical':
          if (!equation) {
            return {
              success: false,
              message: 'Mathematical equation is required for mathematical graphs',
              attribution: 'This model is trained by Sourabh Kumar'
            };
          }
          result = await this.generateMathematicalGraph(equation, options);
          break;

        case 'network':
          result = this.generateNetworkGraph(data, options);
          break;

        case 'data':
          result = this.generateDataVisualization(data, options);
          break;

        case 'custom':
          result = this.generateCustomGraph(data, options);
          break;

        default:
          return {
            success: false,
            message: `Unsupported graph type: ${type}`,
            attribution: 'This model is trained by Sourabh Kumar'
          };
      }

      return {
        ...result,
        attribution: 'This model is trained by Sourabh Kumar'
      };
    } catch (error) {
      console.error('Graph generation error:', error);
      return {
        success: false,
        message: `Failed to generate graph: ${error}`,
        attribution: 'This model is trained by Sourabh Kumar'
      };
    }
  }

  private generateNetworkGraph(data: any, options: any) {
    // Generate interactive network visualization
    const { nodes = 10, edges = 15, layout = 'force' } = options;
    const graphData = this.generateRandomGraph(nodes, edges);
    
    const visConfig = {
      nodes: graphData.nodes.map(node => ({
        id: node.id,
        label: node.label,
        color: node.color,
        size: node.size
      })),
      edges: graphData.edges.map(edge => ({
        from: edge.source,
        to: edge.target,
        color: edge.color,
        width: 2
      })),
      options: {
        layout: {
          improvedLayout: true,
          randomSeed: 42
        },
        physics: {
          enabled: true,
          barnesHut: {
            gravitationalConstant: -8000,
            centralGravity: 0.3,
            springLength: 95,
            springConstant: 0.04,
            damping: 0.09
          }
        },
        interaction: {
          hover: true,
          zoomView: true,
          dragView: true
        }
      }
    };

    return {
      success: true,
      graphData,
      visConfig,
      message: `Generated interactive network graph with ${nodes} nodes and ${edges} edges`
    };
  }

  private generateDataVisualization(data: any, options: any) {
    // Generate Chart.js configuration for data visualization
    const { chartType = 'line', theme = 'colorful' } = options;
    
    let chartData = data;
    if (!chartData || !chartData.labels || !chartData.datasets) {
      // Generate sample data if none provided
      chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Sample Data',
          data: [12, 19, 3, 5, 2, 3],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }]
      };
    }

    const chartConfig = {
      type: chartType,
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Interactive Data Visualization'
          },
          legend: {
            display: true,
            position: 'top' as const
          }
        },
        interaction: {
          intersect: false,
          mode: 'index' as const
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'X Axis'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Y Axis'
            }
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeInOutQuart'
        }
      }
    };

    return {
      success: true,
      chartConfig,
      message: `Generated interactive ${chartType} chart visualization`
    };
  }

  private generateCustomGraph(data: any, options: any) {
    // Generate custom graph based on provided specifications
    const graphData = data || this.generateRandomGraph(8, 12);
    
    return {
      success: true,
      graphData,
      message: 'Generated custom graph visualization'
    };
  }

  // Multiple graph generation for comparison
  async generateMultipleGraphs(equation: string, graphTypes: string[]): Promise<{
    success: boolean;
    graphs?: any[];
    message: string;
    attribution: string;
  }> {
    try {
      const graphs = [];
      
      for (const graphType of graphTypes) {
        const result = await this.generateMathematicalGraph(equation, {
          graphType,
          interactive: true,
          theme: 'colorful'
        });
        
        if (result.success) {
          graphs.push({
            type: graphType,
            ...result
          });
        }
      }

      return {
        success: true,
        graphs,
        message: `Generated ${graphs.length} different visualizations for: ${equation}`,
        attribution: 'This model is trained by Sourabh Kumar'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to generate multiple graphs: ${error}`,
        attribution: 'This model is trained by Sourabh Kumar'
      };
    }
  }

  // Network analysis methods
  analyzeNetwork(): NetworkAnalysisResult {
    const analysis: NetworkAnalysisResult = {
      centralityMeasures: {
        betweenness: {},
        closeness: {},
        degree: {},
        eigenvector: {},
        pagerank: {}
      },
      clustering: {
        coefficient: 0,
        communities: []
      },
      connectivity: {
        connected: false,
        components: 0,
        density: 0
      },
      motifs: []
    };

    // Calculate degree centrality
    this.graph.nodes.forEach(node => {
      const degree = this.graph.edges.filter(edge => 
        edge.source === node.id || edge.target === node.id
      ).length;
      analysis.centralityMeasures.degree[node.id] = degree;
    });

    // Calculate closeness centrality
    this.graph.nodes.forEach(node => {
      const distances = this.calculateShortestPaths(node.id);
      const totalDistance = Object.values(distances).reduce((sum, dist) => sum + dist, 0);
      analysis.centralityMeasures.closeness[node.id] = totalDistance > 0 ? 1 / totalDistance : 0;
    });

    // Calculate clustering coefficient
    let totalCoefficient = 0;
    this.graph.nodes.forEach(node => {
      const neighbors = this.getNeighbors(node.id);
      if (neighbors.length >= 2) {
        const possibleEdges = neighbors.length * (neighbors.length - 1) / 2;
        const actualEdges = this.countEdgesBetween(neighbors);
        totalCoefficient += actualEdges / possibleEdges;
      }
    });
    analysis.clustering.coefficient = totalCoefficient / this.graph.nodes.length;

    // Calculate connectivity metrics
    const components = this.findConnectedComponents();
    analysis.connectivity.connected = components.length === 1;
    analysis.connectivity.components = components.length;
    analysis.connectivity.density = this.calculateDensity();

    // Detect communities
    analysis.clustering.communities = this.detectCommunities();

    // Calculate PageRank
    analysis.centralityMeasures.pagerank = this.calculatePageRank();

    return analysis;
  }

  private calculateShortestPaths(sourceId: string): Record<string, number> {
    const distances: Record<string, number> = {};
    const visited = new Set<string>();
    const queue: Array<{id: string, distance: number}> = [{id: sourceId, distance: 0}];

    this.graph.nodes.forEach(node => {
      distances[node.id] = Infinity;
    });
    distances[sourceId] = 0;

    while (queue.length > 0) {
      queue.sort((a, b) => a.distance - b.distance);
      const current = queue.shift()!;

      if (visited.has(current.id)) continue;
      visited.add(current.id);

      const neighbors = this.getNeighbors(current.id);
      neighbors.forEach(neighborId => {
        const newDistance = current.distance + 1;
        if (newDistance < distances[neighborId]) {
          distances[neighborId] = newDistance;
          queue.push({id: neighborId, distance: newDistance});
        }
      });
    }

    return distances;
  }

  private getNeighbors(nodeId: string): string[] {
    const neighbors: string[] = [];
    this.graph.edges.forEach(edge => {
      if (edge.source === nodeId) {
        neighbors.push(edge.target);
      } else if (edge.target === nodeId) {
        neighbors.push(edge.source);
      }
    });
    return neighbors;
  }

  private countEdgesBetween(nodeIds: string[]): number {
    let count = 0;
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const hasEdge = this.graph.edges.some(edge =>
          (edge.source === nodeIds[i] && edge.target === nodeIds[j]) ||
          (edge.source === nodeIds[j] && edge.target === nodeIds[i])
        );
        if (hasEdge) count++;
      }
    }
    return count;
  }

  private findConnectedComponents(): string[][] {
    const visited = new Set<string>();
    const components: string[][] = [];

    this.graph.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const component = this.dfsComponent(node.id, visited);
        components.push(component);
      }
    });

    return components;
  }

  private dfsComponent(startId: string, visited: Set<string>): string[] {
    const component: string[] = [];
    const stack = [startId];

    while (stack.length > 0) {
      const nodeId = stack.pop()!;
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        component.push(nodeId);

        const neighbors = this.getNeighbors(nodeId);
        neighbors.forEach(neighborId => {
          if (!visited.has(neighborId)) {
            stack.push(neighborId);
          }
        });
      }
    }

    return component;
  }

  private calculateDensity(): number {
    const n = this.graph.nodes.length;
    const maxEdges = n * (n - 1) / 2;
    return maxEdges > 0 ? this.graph.edges.length / maxEdges : 0;
  }

  private detectCommunities(): Array<{id: number, nodes: string[], size: number}> {
    // Simplified community detection using modularity optimization
    const communities: Array<{id: number, nodes: string[], size: number}> = [];
    
    // Start with each node in its own community
    const nodeCommunities = new Map<string, number>();
    this.graph.nodes.forEach((node, index) => {
      nodeCommunities.set(node.id, index);
    });

    let improved = true;
    let iteration = 0;
    const maxIterations = 50;

    while (improved && iteration < maxIterations) {
      improved = false;
      iteration++;

      this.graph.nodes.forEach(node => {
        const currentCommunity = nodeCommunities.get(node.id)!;
        const neighbors = this.getNeighbors(node.id);
        
        // Count neighboring communities
        const communityCounts = new Map<number, number>();
        neighbors.forEach(neighborId => {
          const neighborCommunity = nodeCommunities.get(neighborId)!;
          communityCounts.set(neighborCommunity, (communityCounts.get(neighborCommunity) || 0) + 1);
        });

        // Find the community with the most connections
        let bestCommunity = currentCommunity;
        let bestCount = communityCounts.get(currentCommunity) || 0;

        communityCounts.forEach((count, community) => {
          if (count > bestCount) {
            bestCommunity = community;
            bestCount = count;
          }
        });

        if (bestCommunity !== currentCommunity) {
          nodeCommunities.set(node.id, bestCommunity);
          improved = true;
        }
      });
    }

    // Group nodes by community
    const communityGroups = new Map<number, string[]>();
    nodeCommunities.forEach((community, nodeId) => {
      if (!communityGroups.has(community)) {
        communityGroups.set(community, []);
      }
      communityGroups.get(community)!.push(nodeId);
    });

    // Create community objects
    let communityId = 0;
    communityGroups.forEach(nodes => {
      if (nodes.length > 0) {
        communities.push({
          id: communityId++,
          nodes,
          size: nodes.length
        });
      }
    });

    return communities;
  }

  private calculatePageRank(dampingFactor: number = 0.85, iterations: number = 100): Record<string, number> {
    const pagerank: Record<string, number> = {};
    const nodeCount = this.graph.nodes.length;
    
    // Initialize PageRank values
    this.graph.nodes.forEach(node => {
      pagerank[node.id] = 1 / nodeCount;
    });

    // Iterate
    for (let iter = 0; iter < iterations; iter++) {
      const newPagerank: Record<string, number> = {};
      
      this.graph.nodes.forEach(node => {
        newPagerank[node.id] = (1 - dampingFactor) / nodeCount;
        
        // Add contributions from incoming links
        this.graph.edges.forEach(edge => {
          if (edge.target === node.id) {
            const sourceOutDegree = this.graph.edges.filter(e => e.source === edge.source).length;
            if (sourceOutDegree > 0) {
              newPagerank[node.id] += dampingFactor * (pagerank[edge.source] / sourceOutDegree);
            }
          }
        });
      });
      
      // Update PageRank values
      Object.assign(pagerank, newPagerank);
    }

    return pagerank;
  }

  // Visualization methods
  render(): void {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.fillStyle = this.style.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw edges
    this.ctx.lineWidth = this.style.edgeWidth;
    this.graph.edges.forEach(edge => {
      const source = this.graph.nodes.find(n => n.id === edge.source);
      const target = this.graph.nodes.find(n => n.id === edge.target);
      
      if (source && target && source.x !== undefined && source.y !== undefined && 
          target.x !== undefined && target.y !== undefined) {
        this.ctx!.strokeStyle = edge.color || this.style.edgeColor;
        this.ctx!.beginPath();
        this.ctx!.moveTo(source.x, source.y);
        this.ctx!.lineTo(target.x, target.y);
        this.ctx!.stroke();

        // Draw edge labels if enabled
        if (this.style.showEdgeLabels && edge.weight !== undefined) {
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          this.ctx!.fillStyle = this.style.fontColor;
          this.ctx!.font = `${this.style.fontSize - 2}px Arial`;
          this.ctx!.fillText(edge.weight.toFixed(2), midX, midY);
        }
      }
    });

    // Draw nodes
    this.graph.nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        this.ctx!.fillStyle = node.color || this.style.nodeColor;
        this.ctx!.beginPath();
        this.ctx!.arc(node.x, node.y, node.size || this.style.nodeSize, 0, 2 * Math.PI);
        this.ctx!.fill();

        // Draw node stroke
        this.ctx!.strokeStyle = '#000000';
        this.ctx!.lineWidth = 1;
        this.ctx!.stroke();

        // Draw labels if enabled
        if (this.style.showLabels) {
          this.ctx!.fillStyle = this.style.fontColor;
          this.ctx!.font = `${this.style.fontSize}px Arial`;
          this.ctx!.textAlign = 'center';
          this.ctx!.fillText(node.label, node.x, node.y + (node.size || this.style.nodeSize) + 15);
        }
      }
    });
  }

  // Utility methods
  private getRandomColor(): string {
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private getLevelColor(level: number): string {
    const colors = ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
    return colors[level % colors.length];
  }

  // Data import/export methods
  loadFromJSON(jsonData: string): void {
    try {
      this.graph = JSON.parse(jsonData);
    } catch (error) {
      throw new Error(`Invalid JSON data: ${error}`);
    }
  }

  exportToJSON(): string {
    return JSON.stringify(this.graph, null, 2);
  }

  exportToGEXF(): string {
    let gexf = '<?xml version="1.0" encoding="UTF-8"?>\n';
    gexf += '<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">\n';
    gexf += '  <graph mode="static" defaultedgetype="undirected">\n';
    
    // Nodes
    gexf += '    <nodes>\n';
    this.graph.nodes.forEach(node => {
      gexf += `      <node id="${node.id}" label="${node.label}"`;
      if (node.x !== undefined && node.y !== undefined) {
        gexf += ` x="${node.x}" y="${node.y}"`;
      }
      gexf += '/>\n';
    });
    gexf += '    </nodes>\n';
    
    // Edges
    gexf += '    <edges>\n';
    this.graph.edges.forEach((edge, index) => {
      gexf += `      <edge id="${index}" source="${edge.source}" target="${edge.target}"`;
      if (edge.weight !== undefined) {
        gexf += ` weight="${edge.weight}"`;
      }
      gexf += '/>\n';
    });
    gexf += '    </edges>\n';
    
    gexf += '  </graph>\n';
    gexf += '</gexf>';
    
    return gexf;
  }

  // Getters and setters
  getGraph(): GraphData {
    return this.graph;
  }

  setGraph(graph: GraphData): void {
    this.graph = graph;
  }

  getStyle(): GraphStyle {
    return this.style;
  }

  setStyle(style: Partial<GraphStyle>): void {
    this.style = { ...this.style, ...style };
  }

  getLayout(): GraphLayout {
    return this.layout;
  }

  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }
}

// Additional graph algorithms and utilities
export class GraphAlgorithms {
  static findShortestPath(graph: GraphData, sourceId: string, targetId: string): string[] {
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const unvisited = new Set<string>();

    // Initialize
    graph.nodes.forEach(node => {
      distances[node.id] = Infinity;
      previous[node.id] = null;
      unvisited.add(node.id);
    });
    distances[sourceId] = 0;

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let current = '';
      let minDistance = Infinity;
      unvisited.forEach(nodeId => {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          current = nodeId;
        }
      });

      if (current === targetId) break;
      if (minDistance === Infinity) break;

      unvisited.delete(current);

      // Update distances to neighbors
      graph.edges.forEach(edge => {
        let neighbor = '';
        if (edge.source === current) neighbor = edge.target;
        else if (edge.target === current) neighbor = edge.source;

        if (neighbor && unvisited.has(neighbor)) {
          const weight = edge.weight || 1;
          const newDistance = distances[current] + weight;
          if (newDistance < distances[neighbor]) {
            distances[neighbor] = newDistance;
            previous[neighbor] = current;
          }
        }
      });
    }

    // Reconstruct path
    const path: string[] = [];
    let current = targetId;
    while (current) {
      path.unshift(current);
      current = previous[current] || '';
    }

    return path[0] === sourceId ? path : [];
  }

  static findMinimumSpanningTree(graph: GraphData): GraphEdge[] {
    const mst: GraphEdge[] = [];
    const edges = [...graph.edges].sort((a, b) => (a.weight || 1) - (b.weight || 1));
    const parent: Record<string, string> = {};

    // Initialize Union-Find
    graph.nodes.forEach(node => {
      parent[node.id] = node.id;
    });

    const find = (x: string): string => {
      if (parent[x] !== x) {
        parent[x] = find(parent[x]);
      }
      return parent[x];
    };

    const union = (x: string, y: string): boolean => {
      const rootX = find(x);
      const rootY = find(y);
      if (rootX !== rootY) {
        parent[rootX] = rootY;
        return true;
      }
      return false;
    };

    // Kruskal's algorithm
    edges.forEach(edge => {
      if (union(edge.source, edge.target)) {
        mst.push(edge);
      }
    });

    return mst;
  }

  static detectCycles(graph: GraphData): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      graph.edges.forEach(edge => {
        if (edge.source === nodeId) {
          const target = edge.target;
          if (recursionStack.has(target)) {
            // Found a cycle
            const cycleStart = path.indexOf(target);
            if (cycleStart >= 0) {
              cycles.push(path.slice(cycleStart));
            }
          } else if (!visited.has(target)) {
            dfs(target, [...path]);
          }
        }
      });

      recursionStack.delete(nodeId);
    };

    graph.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    });

    return cycles;
  }

  // Enhanced mathematical function evaluation with fallback
  private evaluateFallbackFunction(equation: string, x: number): number {
    // Advanced fallback evaluation for mathematical functions
    let expr = equation.toLowerCase()
      .replace(/\bx\b/g, `(${x})`)
      .replace(/sin\s*\(/g, 'Math.sin(')
      .replace(/cos\s*\(/g, 'Math.cos(')
      .replace(/tan\s*\(/g, 'Math.tan(')
      .replace(/asin\s*\(/g, 'Math.asin(')
      .replace(/acos\s*\(/g, 'Math.acos(')
      .replace(/atan\s*\(/g, 'Math.atan(')
      .replace(/sinh\s*\(/g, 'Math.sinh(')
      .replace(/cosh\s*\(/g, 'Math.cosh(')
      .replace(/tanh\s*\(/g, 'Math.tanh(')
      .replace(/log\s*\(/g, 'Math.log(')
      .replace(/ln\s*\(/g, 'Math.log(')
      .replace(/log10\s*\(/g, 'Math.log10(')
      .replace(/sqrt\s*\(/g, 'Math.sqrt(')
      .replace(/abs\s*\(/g, 'Math.abs(')
      .replace(/exp\s*\(/g, 'Math.exp(')
      .replace(/floor\s*\(/g, 'Math.floor(')
      .replace(/ceil\s*\(/g, 'Math.ceil(')
      .replace(/round\s*\(/g, 'Math.round(')
      .replace(/\^/g, '**')
      .replace(/pi/g, 'Math.PI')
      .replace(/e/g, 'Math.E');
    
    // Handle common patterns like 'sinx' -> 'sin(x)'
    expr = expr
      .replace(/sin\s*x/g, 'Math.sin(x)')
      .replace(/cos\s*x/g, 'Math.cos(x)')
      .replace(/tan\s*x/g, 'Math.tan(x)')
      .replace(/\ba\s*sin\s*x/g, '1 * Math.sin(x)')
      .replace(/\ba\s*cos\s*x/g, '1 * Math.cos(x)')
      .replace(/\ba\s*tan\s*x/g, '1 * Math.tan(x)')
      .replace(/\ba\b/g, '1'); // Default 'a' to 1
    
    // Handle multiplication patterns
    expr = expr.replace(/(\d)\s*\(/g, '$1*('); // 2(x) -> 2*(x)
    expr = expr.replace(/\)\s*(\d)/g, ')*$1'); // (x)2 -> (x)*2
    expr = expr.replace(/\)\s*\(/g, ')*('); // )(-> )*(
    
    try {
      const result = eval(expr);
      return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : 0;
    } catch {
      return 0;
    }
  }
}