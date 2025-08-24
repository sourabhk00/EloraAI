import { getPredefinedResponse } from "./predefined-responses-improved";
import { detectMathematicalFunction, generateGraphUrl, commonGraphs, type GraphConfig } from "./graph-generator";
import { generateImage } from "./ai-client";

export interface SmartResponse {
  content: string;
  hasGraph?: boolean;
  hasImage?: boolean;
  responseTime: number;
}

export async function generateSmartResponse(
  input: string, 
  geminiKey?: string, 
  openrouterKey?: string
): Promise<SmartResponse> {
  const startTime = Date.now();
  
  // 1. First check for predefined responses
  const predefinedResponse = getPredefinedResponse(input);
  if (predefinedResponse) {
    return {
      content: predefinedResponse,
      responseTime: Date.now() - startTime
    };
  }

  // 2. Check for mathematical function requests
  const mathFunction = detectMathematicalFunction(input);
  if (mathFunction) {
    const graphUrl = generateGraphUrl(mathFunction);
    const content = `## ${mathFunction.title}

Here's the graph for **${mathFunction.equation}**:

**Key Features:**
• **Domain:** x ∈ [${mathFunction.xMin}, ${mathFunction.xMax}]
• **Function:** y = ${mathFunction.equation}
• **Type:** Mathematical function visualization

![Graph of ${mathFunction.equation}](${graphUrl})

*Graph generated dynamically based on your equation.*`;

    return {
      content,
      hasGraph: true,
      responseTime: Date.now() - startTime
    };
  }

  // 3. Check for common mathematical functions
  const normalizedInput = input.toLowerCase().trim();
  for (const [key, config] of Object.entries(commonGraphs)) {
    if (normalizedInput.includes(key) || normalizedInput.includes(key.replace('(', '').replace(')', ''))) {
      const graphUrl = generateGraphUrl(config);
      const content = `## ${config.title}

Here's the graph for **${config.equation}**:

![Graph of ${config.equation}](${graphUrl})

**Function Properties:**
• **Equation:** y = ${config.equation}
• **Domain:** x ∈ [${config.xMin}, ${config.xMax}]
• **Color:** ${config.color}

*Interactive mathematical visualization generated for you.*`;

      return {
        content,
        hasGraph: true,
        responseTime: Date.now() - startTime
      };
    }
  }

  // 4. Check for image generation requests
  if (detectImageRequest(input)) {
    try {
      if (geminiKey || openrouterKey) {
        const imageResult = await generateImage(input, geminiKey || openrouterKey!);
        if (imageResult && imageResult.imageUrl) {
          const content = `## Image Generated

I've created an image based on your request: "${input}"

![Generated Image](${imageResult.imageUrl})

*Image generated using AI based on your description.*`;

          return {
            content,
            hasImage: true,
            responseTime: Date.now() - startTime
          };
        }
      }
    } catch (error) {
      console.error('Image generation error:', error);
    }
  }

  // 5. Check for graph-related questions without specific equations
  if (detectGraphRequest(input)) {
    const content = `## Graph Visualization

I can help you create graphs! Here are some examples you can try:

**Mathematical Functions:**
• \`graph sin(x)\` - Sine function
• \`graph cos(x)\` - Cosine function  
• \`graph x^2\` - Quadratic function
• \`graph 2x + 1\` - Linear function
• \`plot tan(x)\` - Tangent function

**Or try specific equations like:**
• "y = 3x - 2"
• "show graph of x^3"
• "plot log(x)"

Just ask me to graph any mathematical function and I'll create a visual representation for you!`;

    return {
      content,
      responseTime: Date.now() - startTime
    };
  }

  // 6. Return null to indicate no smart response generated
  return {
    content: "",
    responseTime: Date.now() - startTime
  };
}

function detectImageRequest(input: string): boolean {
  const imageKeywords = [
    'generate image', 'create image', 'make image', 'draw image',
    'show me image', 'picture of', 'image of', 'photo of',
    'generate picture', 'create picture', 'make picture',
    'visualize', 'illustration of', 'artwork of'
  ];
  
  const normalizedInput = input.toLowerCase();
  return imageKeywords.some(keyword => normalizedInput.includes(keyword));
}

function detectGraphRequest(input: string): boolean {
  const graphKeywords = [
    'graph', 'plot', 'chart', 'diagram', 'visualize function',
    'show function', 'draw function', 'mathematical visualization'
  ];
  
  const normalizedInput = input.toLowerCase();
  return graphKeywords.some(keyword => normalizedInput.includes(keyword)) &&
         !detectMathematicalFunction(input); // Not a specific equation
}

export function generateHelpResponse(): string {
  return `## Welcome to Elora.AI! 🚀

I'm your comprehensive AI assistant with advanced multimedia capabilities. Here's what I can do:

### 📊 **Graph Generation**
• \`graph sin(x)\` - Mathematical function visualization
• \`plot y = 2x + 1\` - Linear equations
• \`show cos(x)\` - Trigonometric functions

### 🎨 **Image Creation**
• \`generate image of sunset\` - AI-powered image generation
• \`create picture of mountains\` - Custom visual content
• \`draw illustration of...\` - Artistic representations

### 💻 **Programming Help**
• Code explanations and debugging
• Algorithm implementations
• Best practices and tutorials

### 🔬 **Science & Math**
• Complex equation solving
• Scientific explanations
• Research assistance

### 🎵 **Multimedia Features**
• Text-to-speech for all responses
• Voice input recognition
• File processing (PDF, DOCX, images)

**Quick Commands:**
• \`/help\` - Show this help
• \`/whoami\` - About me
• \`tell me about sourabh kumar\` - About my creator

Try asking me anything - I'm here to help with graphs, images, coding, science, and more!`;
}