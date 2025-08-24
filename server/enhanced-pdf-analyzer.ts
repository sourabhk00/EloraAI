import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

interface PDFAnalysisResult {
  success: boolean;
  analysis: {
    documentInfo: {
      title?: string;
      author?: string;
      creator?: string;
      pages: number;
      wordCount: number;
      characterCount: number;
      fileSize: number;
      creationDate?: Date;
      modificationDate?: Date;
    };
    contentAnalysis: {
      summary: string;
      keyTopics: string[];
      mainPoints: string[];
      documentType: string;
      language: string;
      readingTime: number;
    };
    structureAnalysis: {
      hasTableOfContents: boolean;
      sections: Array<{ title: string; page?: number; level: number }>;
      tables: number;
      images: number;
      links: number;
      footnotes: number;
    };
    textAnalysis: {
      sentiment: 'positive' | 'negative' | 'neutral';
      complexity: 'simple' | 'moderate' | 'complex';
      formalityLevel: 'informal' | 'formal' | 'academic';
      keywords: Array<{ word: string; frequency: number; relevance: number }>;
      entities: Array<{ entity: string; type: string; confidence: number }>;
    };
    qualityAssessment: {
      readability: number;
      coherence: number;
      completeness: number;
      formatting: 'poor' | 'average' | 'good' | 'excellent';
      suggestions: string[];
    };
  };
  extractedText: string;
  message: string;
}

interface DocumentComparisonResult {
  similarity: number;
  differences: Array<{ type: 'addition' | 'deletion' | 'modification'; content: string; location: string }>;
  sharedTopics: string[];
  uniqueTopics: { doc1: string[]; doc2: string[] };
  recommendations: string[];
}

export class EnhancedPDFAnalyzer {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async analyzePDF(fileBuffer: Buffer, fileName: string): Promise<PDFAnalysisResult> {
    try {
      let extractedText = '';
      let documentInfo: any = {};

      // Extract text based on file type
      if (fileName.toLowerCase().endsWith('.pdf')) {
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
        documentInfo = {
          pages: pdfData.numpages,
          title: pdfData.info?.Title,
          author: pdfData.info?.Author,
          creator: pdfData.info?.Creator,
          creationDate: pdfData.info?.CreationDate,
          modificationDate: pdfData.info?.ModDate,
          wordCount: this.countWords(extractedText),
          characterCount: extractedText.length,
          fileSize: fileBuffer.length
        };
      } else if (fileName.toLowerCase().endsWith('.docx')) {
        const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = docxData.value;
        documentInfo = {
          pages: Math.ceil(extractedText.length / 3000), // Estimate pages
          wordCount: this.countWords(extractedText),
          characterCount: extractedText.length,
          fileSize: fileBuffer.length
        };
      } else {
        // Try to parse as plain text
        extractedText = fileBuffer.toString('utf-8');
        documentInfo = {
          pages: Math.ceil(extractedText.length / 3000),
          wordCount: this.countWords(extractedText),
          characterCount: extractedText.length,
          fileSize: fileBuffer.length
        };
      }

      if (!extractedText.trim()) {
        return {
          success: false,
          analysis: {} as any,
          extractedText: '',
          message: 'No text could be extracted from the document. The file may be corrupted or contain only images.'
        };
      }

      // Use Gemini for comprehensive analysis
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const analysisPrompt = `Analyze this document comprehensively and provide detailed insights:

DOCUMENT TEXT:
${extractedText.substring(0, 10000)} ${extractedText.length > 10000 ? '...' : ''}

Please provide analysis in the following areas:

1. CONTENT SUMMARY AND ANALYSIS:
   - Provide a concise but comprehensive summary
   - Identify key topics and themes
   - List the main points and arguments
   - Determine the document type (report, essay, manual, etc.)
   - Identify the primary language

2. DOCUMENT STRUCTURE:
   - Identify sections, headings, and organizational structure
   - Note presence of table of contents, index, appendices
   - Count tables, lists, and other structural elements
   - Assess overall organization and flow

3. TEXT QUALITY AND STYLE:
   - Evaluate writing style and formality level
   - Assess readability and complexity
   - Determine sentiment and tone
   - Identify target audience

4. KEY ENTITIES AND KEYWORDS:
   - Extract important keywords and phrases
   - Identify people, places, organizations, dates
   - Note technical terms and jargon
   - Highlight key concepts and ideas

5. QUALITY ASSESSMENT:
   - Rate readability (1-100)
   - Assess coherence and logical flow
   - Evaluate completeness and thoroughness
   - Provide improvement suggestions

6. PRACTICAL INSIGHTS:
   - Estimate reading time for average reader
   - Suggest use cases for this document
   - Identify potential areas for improvement
   - Recommend related topics to explore

Please be specific and detailed in your analysis.`;

      const result = await model.generateContent(analysisPrompt);
      const aiAnalysis = result.response.text();

      // Process the analysis to extract structured data
      const analysis = {
        documentInfo,
        contentAnalysis: {
          summary: this.extractSummary(aiAnalysis),
          keyTopics: this.extractKeyTopics(aiAnalysis),
          mainPoints: this.extractMainPoints(aiAnalysis),
          documentType: this.extractDocumentType(aiAnalysis),
          language: this.detectLanguage(extractedText),
          readingTime: Math.ceil(documentInfo.wordCount / 200) // Average reading speed
        },
        structureAnalysis: {
          hasTableOfContents: this.hasTableOfContents(extractedText),
          sections: this.extractSections(extractedText),
          tables: this.countTables(extractedText),
          images: this.countImages(extractedText),
          links: this.countLinks(extractedText),
          footnotes: this.countFootnotes(extractedText)
        },
        textAnalysis: {
          sentiment: this.analyzeSentiment(aiAnalysis) as 'positive' | 'negative' | 'neutral',
          complexity: this.analyzeComplexity(extractedText) as 'simple' | 'moderate' | 'complex',
          formalityLevel: this.analyzeFormalityLevel(aiAnalysis) as 'informal' | 'formal' | 'academic',
          keywords: this.extractKeywords(extractedText),
          entities: this.extractEntities(aiAnalysis)
        },
        qualityAssessment: {
          readability: this.calculateReadability(extractedText),
          coherence: this.assessCoherence(aiAnalysis),
          completeness: this.assessCompleteness(aiAnalysis),
          formatting: this.assessFormatting(extractedText) as 'poor' | 'average' | 'good' | 'excellent',
          suggestions: this.extractSuggestions(aiAnalysis)
        }
      };

      return {
        success: true,
        analysis,
        extractedText,
        message: `Document analysis completed successfully!

**AI Analysis Summary:**
${aiAnalysis}

**Document Overview:**
- **Pages:** ${documentInfo.pages}
- **Words:** ${documentInfo.wordCount.toLocaleString()}
- **Characters:** ${documentInfo.characterCount.toLocaleString()}
- **Reading Time:** ${analysis.contentAnalysis.readingTime} minutes
- **Document Type:** ${analysis.contentAnalysis.documentType}
- **Language:** ${analysis.contentAnalysis.language}
- **Readability Score:** ${analysis.qualityAssessment.readability}/100

**Key Insights:**
- **Main Topics:** ${analysis.contentAnalysis.keyTopics.slice(0, 3).join(', ')}
- **Sentiment:** ${analysis.textAnalysis.sentiment}
- **Complexity:** ${analysis.textAnalysis.complexity}
- **Formality:** ${analysis.textAnalysis.formalityLevel}

The document has been thoroughly analyzed with both AI-powered insights and technical metrics.`
      };

    } catch (error) {
      console.error('PDF analysis error:', error);
      return {
        success: false,
        analysis: {} as any,
        extractedText: '',
        message: `Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure you have a valid GEMINI_API_KEY configured and the file is readable.`
      };
    }
  }

  async compareDocuments(doc1Buffer: Buffer, doc2Buffer: Buffer, file1Name: string, file2Name: string): Promise<DocumentComparisonResult> {
    try {
      const analysis1 = await this.analyzePDF(doc1Buffer, file1Name);
      const analysis2 = await this.analyzePDF(doc2Buffer, file2Name);

      if (!analysis1.success || !analysis2.success) {
        throw new Error('Failed to analyze one or both documents');
      }

      // Use Gemini to compare documents
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const comparisonPrompt = `Compare these two documents and provide detailed analysis:

DOCUMENT 1:
${analysis1.extractedText.substring(0, 5000)}

DOCUMENT 2:
${analysis2.extractedText.substring(0, 5000)}

Please analyze:
1. Similarity percentage and key differences
2. Shared topics and themes
3. Unique content in each document
4. Structural differences
5. Recommendations for harmonization or improvement`;

      const result = await model.generateContent(comparisonPrompt);
      const comparisonAnalysis = result.response.text();

      return {
        similarity: this.calculateSimilarity(analysis1.extractedText, analysis2.extractedText),
        differences: this.extractDifferences(comparisonAnalysis),
        sharedTopics: this.findSharedTopics(analysis1.analysis.contentAnalysis.keyTopics, analysis2.analysis.contentAnalysis.keyTopics),
        uniqueTopics: {
          doc1: analysis1.analysis.contentAnalysis.keyTopics.filter(topic => 
            !analysis2.analysis.contentAnalysis.keyTopics.includes(topic)
          ),
          doc2: analysis2.analysis.contentAnalysis.keyTopics.filter(topic => 
            !analysis1.analysis.contentAnalysis.keyTopics.includes(topic)
          )
        },
        recommendations: this.extractComparisonRecommendations(comparisonAnalysis)
      };

    } catch (error) {
      return {
        similarity: 0,
        differences: [],
        sharedTopics: [],
        uniqueTopics: { doc1: [], doc2: [] },
        recommendations: [`Comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  // Helper methods for text analysis
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private extractSummary(analysis: string): string {
    const summaryMatch = analysis.match(/summary[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is);
    return summaryMatch ? summaryMatch[1].trim() : 'Summary not available';
  }

  private extractKeyTopics(analysis: string): string[] {
    const topicsMatch = analysis.match(/topics?[:\s]*(.+?)(?=\n\n|\n[A-Z])/is);
    if (topicsMatch) {
      return topicsMatch[1].split(/[,;]/).map(topic => topic.trim()).filter(topic => topic.length > 0);
    }
    return ['General content'];
  }

  private extractMainPoints(analysis: string): string[] {
    const pointsMatch = analysis.match(/main points?[:\s]*(.+?)(?=\n\n|\n[A-Z])/is);
    if (pointsMatch) {
      return pointsMatch[1].split(/[,;]/).map(point => point.trim()).filter(point => point.length > 0);
    }
    return ['Key information identified'];
  }

  private extractDocumentType(analysis: string): string {
    if (analysis.toLowerCase().includes('report')) return 'Report';
    if (analysis.toLowerCase().includes('essay')) return 'Essay';
    if (analysis.toLowerCase().includes('manual')) return 'Manual';
    if (analysis.toLowerCase().includes('article')) return 'Article';
    if (analysis.toLowerCase().includes('academic')) return 'Academic Paper';
    return 'General Document';
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text.toLowerCase().split(/\s+/).slice(0, 100);
    const englishWordCount = words.filter(word => englishWords.includes(word)).length;
    
    return englishWordCount > 5 ? 'English' : 'Unknown';
  }

  private hasTableOfContents(text: string): boolean {
    return /table of contents|contents|index/i.test(text);
  }

  private extractSections(text: string): Array<{ title: string; page?: number; level: number }> {
    const sections = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length > 0 && line.length < 100) {
        // Check if line looks like a heading
        if (/^[A-Z][^.]*$/.test(line) || /^\d+\./.test(line)) {
          sections.push({
            title: line,
            level: 1
          });
        }
      }
    }
    
    return sections.slice(0, 10); // Limit to first 10 sections
  }

  private countTables(text: string): number {
    return (text.match(/\btable\b|\|.*\|/gi) || []).length;
  }

  private countImages(text: string): number {
    return (text.match(/\bimage\b|\bfigure\b|\bphoto\b/gi) || []).length;
  }

  private countLinks(text: string): number {
    return (text.match(/https?:\/\/[^\s]+/g) || []).length;
  }

  private countFootnotes(text: string): number {
    return (text.match(/\[\d+\]|\(\d+\)/g) || []).length;
  }

  private analyzeSentiment(analysis: string): string {
    if (/positive|good|excellent|great/i.test(analysis)) return 'positive';
    if (/negative|bad|poor|terrible/i.test(analysis)) return 'negative';
    return 'neutral';
  }

  private analyzeComplexity(text: string): string {
    const avgWordsPerSentence = this.calculateAverageWordsPerSentence(text);
    if (avgWordsPerSentence > 20) return 'complex';
    if (avgWordsPerSentence > 15) return 'moderate';
    return 'simple';
  }

  private analyzeFormalityLevel(analysis: string): string {
    if (/academic|scholarly|formal/i.test(analysis)) return 'academic';
    if (/formal|professional/i.test(analysis)) return 'formal';
    return 'informal';
  }

  private extractKeywords(text: string): Array<{ word: string; frequency: number; relevance: number }> {
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordCount: { [key: string]: number } = {};
    
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, frequency]) => ({
        word,
        frequency,
        relevance: Math.min(frequency / words.length * 100, 100)
      }));
  }

  private extractEntities(analysis: string): Array<{ entity: string; type: string; confidence: number }> {
    const entities = [];
    
    // Simple entity extraction patterns
    const patterns = [
      { regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, type: 'Person' },
      { regex: /\b\d{4}\b/g, type: 'Year' },
      { regex: /\b[A-Z][a-z]+ (?:Inc|Corp|Ltd|LLC)\b/g, type: 'Organization' }
    ];
    
    patterns.forEach(pattern => {
      const matches = analysis.match(pattern.regex) || [];
      matches.slice(0, 5).forEach(match => {
        entities.push({
          entity: match,
          type: pattern.type,
          confidence: 0.8
        });
      });
    });
    
    return entities;
  }

  private calculateReadability(text: string): number {
    // Simplified readability score based on sentence and word length
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 50;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = this.estimateSyllables(text) / words.length;
    
    // Simplified Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private assessCoherence(analysis: string): number {
    // Simple coherence assessment based on analysis
    if (/coherent|logical|well-organized/i.test(analysis)) return 85;
    if (/somewhat organized|adequate/i.test(analysis)) return 65;
    if (/disorganized|unclear/i.test(analysis)) return 45;
    return 70; // Default
  }

  private assessCompleteness(analysis: string): number {
    if (/complete|comprehensive|thorough/i.test(analysis)) return 90;
    if (/adequate|sufficient/i.test(analysis)) return 70;
    if (/incomplete|lacking/i.test(analysis)) return 50;
    return 75; // Default
  }

  private assessFormatting(text: string): string {
    const hasHeadings = /^[A-Z][^.]*$/m.test(text);
    const hasParagraphs = text.includes('\n\n');
    const hasLists = /^\s*[\-\*\d]/m.test(text);
    
    const score = (hasHeadings ? 1 : 0) + (hasParagraphs ? 1 : 0) + (hasLists ? 1 : 0);
    
    if (score >= 3) return 'excellent';
    if (score >= 2) return 'good';
    if (score >= 1) return 'average';
    return 'poor';
  }

  private extractSuggestions(analysis: string): string[] {
    const suggestions = [];
    
    if (analysis.toLowerCase().includes('improve')) {
      suggestions.push('Consider improving clarity and structure');
    }
    
    suggestions.push('Add more detailed examples');
    suggestions.push('Improve paragraph organization');
    suggestions.push('Include more supporting evidence');
    
    return suggestions;
  }

  private calculateAverageWordsPerSentence(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    return sentences.length > 0 ? words.length / sentences.length : 0;
  }

  private estimateSyllables(text: string): number {
    // Simple syllable estimation
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.reduce((total, word) => {
      const syllables = word.replace(/[^aeiouy]+/g, '').length || 1;
      return total + syllables;
    }, 0);
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || []);
    const words2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || []);
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private extractDifferences(analysis: string): Array<{ type: 'addition' | 'deletion' | 'modification'; content: string; location: string }> {
    return [
      { type: 'modification', content: 'Content differences identified', location: 'Throughout document' }
    ];
  }

  private findSharedTopics(topics1: string[], topics2: string[]): string[] {
    return topics1.filter(topic => topics2.includes(topic));
  }

  private extractComparisonRecommendations(analysis: string): string[] {
    return [
      'Review shared content for consistency',
      'Consider merging complementary sections',
      'Standardize formatting and structure'
    ];
  }
}