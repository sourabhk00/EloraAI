import React, { useState } from 'react';
import { Search, ShoppingBag, MapPin, Type, Eye, ExternalLink, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface LensSearchResult {
  visualMatches: Array<{
    title: string;
    source: string;
    similarity: number;
    category: string;
    description: string;
  }>;
  textResults: Array<{
    extractedText: string;
    language: string;
    confidence: number;
  }>;
  shoppingResults: Array<{
    product: string;
    price: string;
    store: string;
    similarity: number;
  }>;
  relatedSearches: string[];
}

interface LensSearchProps {
  imageData?: string;
  results?: LensSearchResult;
  isLoading?: boolean;
  onSearch?: (imageData: string) => void;
}

export const LensSearch: React.FC<LensSearchProps> = ({
  imageData,
  results,
  isLoading = false,
  onSearch
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('visual');

  const handleSearch = () => {
    if (imageData && onSearch) {
      onSearch(imageData);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const shareResult = (text: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Lens Search Result',
        text: text
      });
    } else {
      copyText(text);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <span>Visual Search (Lens)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {imageData && (
              <div className="flex-shrink-0">
                <img
                  src={imageData}
                  alt="Search image"
                  className="w-20 h-20 object-cover rounded-lg border"
                  data-testid="img-search-preview"
                />
              </div>
            )}
            
            <div className="flex-1 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered visual search to identify objects, text, and find similar images
              </p>
              
              {imageData && onSearch && (
                <Button 
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-start-lens-search"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isLoading ? 'Searching...' : 'Start Visual Search'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div className="space-y-2">
                <p className="text-lg font-medium">Analyzing Image...</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI is processing your image for visual search
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="visual" className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>Visual Matches</span>
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center space-x-1">
                  <Type className="h-4 w-4" />
                  <span>Text</span>
                </TabsTrigger>
                <TabsTrigger value="shopping" className="flex items-center space-x-1">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Shopping</span>
                </TabsTrigger>
                <TabsTrigger value="related" className="flex items-center space-x-1">
                  <Search className="h-4 w-4" />
                  <span>Related</span>
                </TabsTrigger>
              </TabsList>

              {/* Visual Matches Tab */}
              <TabsContent value="visual" className="mt-4">
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {results.visualMatches.length > 0 ? (
                      results.visualMatches.map((match, index) => (
                        <Card key={index} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium">{match.title}</h4>
                                  <Badge variant="secondary">{match.category}</Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {match.description}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>Source: {match.source}</span>
                                  <span>Similarity: {(match.similarity * 100).toFixed(1)}%</span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => shareResult(match.title)}
                                  data-testid={`button-share-match-${index}`}
                                >
                                  <Share2 className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  data-testid={`button-view-match-${index}`}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No visual matches found</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Text Results Tab */}
              <TabsContent value="text" className="mt-4">
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {results.textResults.length > 0 ? (
                      results.textResults.map((text, index) => (
                        <Card key={index} className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">
                                  {text.language} - {(text.confidence * 100).toFixed(1)}% confidence
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => copyText(text.extractedText)}
                                  data-testid={`button-copy-text-${index}`}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                <p className="text-sm font-mono whitespace-pre-wrap">
                                  {text.extractedText}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No text detected in image</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Shopping Results Tab */}
              <TabsContent value="shopping" className="mt-4">
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {results.shoppingResults.length > 0 ? (
                      results.shoppingResults.map((product, index) => (
                        <Card key={index} className="border-l-4 border-l-purple-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 space-y-2">
                                <h4 className="font-medium">{product.product}</h4>
                                <div className="flex items-center space-x-4">
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    {product.price}
                                  </Badge>
                                  <span className="text-sm text-gray-600">at {product.store}</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Similarity: {(product.similarity * 100).toFixed(1)}%
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  data-testid={`button-view-product-${index}`}
                                >
                                  <ShoppingBag className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No shopping results found</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Related Searches Tab */}
              <TabsContent value="related" className="mt-4">
                <div className="space-y-4">
                  {results.relatedSearches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {results.relatedSearches.map((search, index) => (
                        <Card key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-2">
                              <Search className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium">{search}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No related searches available</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Feature Information */}
      {!results && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Visual Search Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Object Recognition</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Identify objects, landmarks, and scenes in your images
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Type className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Text Extraction</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Extract and recognize text from images with OCR technology
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <ShoppingBag className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Product Search</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Find similar products and shopping options
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Place Recognition</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Identify landmarks, locations, and points of interest
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};