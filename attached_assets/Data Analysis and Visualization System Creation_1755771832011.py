import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from wordcloud import WordCloud
from docx import Document
import PyPDF2
import textract
import re
from datetime import datetime
import os
from abc import ABC, abstractmethod
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.figure_factory as ff
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE
import warnings
warnings.filterwarnings('ignore')

class DataAnalyzer(ABC):
    """Abstract base class for data analyzers"""
    
    @abstractmethod
    def load_data(self, file_path):
        pass
    
    @abstractmethod
    def analyze(self):
        pass
    
    @abstractmethod
    def generate_report(self):
        pass

class ExcelAnalyzer(DataAnalyzer):
    """Analyzer for Excel files"""
    
    def __init__(self):
        self.data = None
        self.analysis_results = {}
        self.report = ""
        
    def load_data(self, file_path):
        try:
            # Read all sheets from Excel file
            excel_file = pd.ExcelFile(file_path)
            self.data = {}
            for sheet_name in excel_file.sheet_names:
                self.data[sheet_name] = pd.read_excel(file_path, sheet_name=sheet_name)
            return True
        except Exception as e:
            print(f"Error loading Excel file: {e}")
            return False
    
    def analyze(self):
        if not self.data:
            return False
            
        self.analysis_results = {}
        for sheet_name, df in self.data.items():
            sheet_analysis = {}
            
            # Basic statistics
            sheet_analysis['shape'] = df.shape
            sheet_analysis['columns'] = list(df.columns)
            sheet_analysis['dtypes'] = df.dtypes.to_dict()
            sheet_analysis['null_counts'] = df.isnull().sum().to_dict()
            sheet_analysis['null_percentage'] = (df.isnull().sum() / len(df) * 100).to_dict()
            
            # Numeric columns analysis
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                sheet_analysis['numeric_stats'] = df[numeric_cols].describe().to_dict()
                sheet_analysis['correlation_matrix'] = df[numeric_cols].corr().to_dict()
            
            # Categorical columns analysis
            categorical_cols = df.select_dtypes(include=['object']).columns
            if len(categorical_cols) > 0:
                cat_stats = {}
                for col in categorical_cols:
                    cat_stats[col] = {
                        'unique_values': df[col].nunique(),
                        'value_counts': df[col].value_counts().to_dict()
                    }
                sheet_analysis['categorical_stats'] = cat_stats
            
            self.analysis_results[sheet_name] = sheet_analysis
        
        return True
    
    def generate_report(self):
        if not self.analysis_results:
            return ""
            
        self.report = "# Excel Data Analysis Report\n\n"
        self.report += f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        for sheet_name, analysis in self.analysis_results.items():
            self.report += f"## Sheet: {sheet_name}\n\n"
            self.report += f"**Shape:** {analysis['shape'][0]} rows, {analysis['shape'][1]} columns\n\n"
            
            # Data types
            self.report += "### Data Types\n\n"
            for col, dtype in analysis['dtypes'].items():
                self.report += f"- {col}: {dtype}\n"
            self.report += "\n"
            
            # Null values
            self.report += "### Missing Values\n\n"
            for col, null_count in analysis['null_counts'].items():
                null_percent = analysis['null_percentage'][col]
                self.report += f"- {col}: {null_count} ({null_percent:.2f}%)\n"
            self.report += "\n"
            
            # Numeric statistics
            if 'numeric_stats' in analysis:
                self.report += "### Numeric Statistics\n\n"
                numeric_stats = analysis['numeric_stats']
                for col in numeric_stats.keys():
                    self.report += f"#### {col}\n"
                    stats = numeric_stats[col]
                    self.report += f"- Count: {stats.get('count', 'N/A'):.0f}\n"
                    self.report += f"- Mean: {stats.get('mean', 'N/A'):.2f}\n"
                    self.report += f"- Std: {stats.get('std', 'N/A'):.2f}\n"
                    self.report += f"- Min: {stats.get('min', 'N/A'):.2f}\n"
                    self.report += f"- 25%: {stats.get('25%', 'N/A'):.2f}\n"
                    self.report += f"- 50%: {stats.get('50%', 'N/A'):.2f}\n"
                    self.report += f"- 75%: {stats.get('75%', 'N/A'):.2f}\n"
                    self.report += f"- Max: {stats.get('max', 'N/A'):.2f}\n\n"
            
            # Categorical statistics
            if 'categorical_stats' in analysis:
                self.report += "### Categorical Statistics\n\n"
                for col, stats in analysis['categorical_stats'].items():
                    self.report += f"#### {col}\n"
                    self.report += f"- Unique values: {stats['unique_values']}\n"
                    self.report += "- Top 5 values:\n"
                    value_counts = stats['value_counts']
                    sorted_counts = sorted(value_counts.items(), key=lambda x: x[1], reverse=True)[:5]
                    for value, count in sorted_counts:
                        self.report += f"  - {value}: {count}\n"
                    self.report += "\n"
        
        return self.report

class CSVAnalyzer(DataAnalyzer):
    """Analyzer for CSV files"""
    
    def __init__(self):
        self.data = None
        self.analysis_results = {}
        self.report = ""
        
    def load_data(self, file_path):
        try:
            self.data = pd.read_csv(file_path)
            return True
        except Exception as e:
            print(f"Error loading CSV file: {e}")
            return False
    
    def analyze(self):
        if self.data is None:
            return False
            
        self.analysis_results = {}
        
        # Basic statistics
        self.analysis_results['shape'] = self.data.shape
        self.analysis_results['columns'] = list(self.data.columns)
        self.analysis_results['dtypes'] = self.data.dtypes.to_dict()
        self.analysis_results['null_counts'] = self.data.isnull().sum().to_dict()
        self.analysis_results['null_percentage'] = (self.data.isnull().sum() / len(self.data) * 100).to_dict()
        
        # Numeric columns analysis
        numeric_cols = self.data.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            self.analysis_results['numeric_stats'] = self.data[numeric_cols].describe().to_dict()
            self.analysis_results['correlation_matrix'] = self.data[numeric_cols].corr().to_dict()
        
        # Categorical columns analysis
        categorical_cols = self.data.select_dtypes(include=['object']).columns
        if len(categorical_cols) > 0:
            cat_stats = {}
            for col in categorical_cols:
                cat_stats[col] = {
                    'unique_values': self.data[col].nunique(),
                    'value_counts': self.data[col].value_counts().to_dict()
                }
            self.analysis_results['categorical_stats'] = cat_stats
        
        return True
    
    def generate_report(self):
        if not self.analysis_results:
            return ""
            
        self.report = "# CSV Data Analysis Report\n\n"
        self.report += f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        self.report += f"**Shape:** {self.analysis_results['shape'][0]} rows, {self.analysis_results['shape'][1]} columns\n\n"
        
        # Data types
        self.report += "### Data Types\n\n"
        for col, dtype in self.analysis_results['dtypes'].items():
            self.report += f"- {col}: {dtype}\n"
        self.report += "\n"
        
        # Null values
        self.report += "### Missing Values\n\n"
        for col, null_count in self.analysis_results['null_counts'].items():
            null_percent = self.analysis_results['null_percentage'][col]
            self.report += f"- {col}: {null_count} ({null_percent:.2f}%)\n"
        self.report += "\n"
        
        # Numeric statistics
        if 'numeric_stats' in self.analysis_results:
            self.report += "### Numeric Statistics\n\n"
            numeric_stats = self.analysis_results['numeric_stats']
            for col in numeric_stats.keys():
                self.report += f"#### {col}\n"
                stats = numeric_stats[col]
                self.report += f"- Count: {stats.get('count', 'N/A'):.0f}\n"
                self.report += f"- Mean: {stats.get('mean', 'N/A'):.2f}\n"
                self.report += f"- Std: {stats.get('std', 'N/A'):.2f}\n"
                self.report += f"- Min: {stats.get('min', 'N/A'):.2f}\n"
                self.report += f"- 25%: {stats.get('25%', 'N/A'):.2f}\n"
                self.report += f"- 50%: {stats.get('50%', 'N/A'):.2f}\n"
                self.report += f"- 75%: {stats.get('75%', 'N/A'):.2f}\n"
                self.report += f"- Max: {stats.get('max', 'N/A'):.2f}\n\n"
        
        # Categorical statistics
        if 'categorical_stats' in self.analysis_results:
            self.report += "### Categorical Statistics\n\n"
            for col, stats in self.analysis_results['categorical_stats'].items():
                self.report += f"#### {col}\n"
                self.report += f"- Unique values: {stats['unique_values']}\n"
                self.report += "- Top 5 values:\n"
                value_counts = stats['value_counts']
                sorted_counts = sorted(value_counts.items(), key=lambda x: x[1], reverse=True)[:5]
                for value, count in sorted_counts:
                    self.report += f"  - {value}: {count}\n"
                self.report += "\n"
        
        return self.report

class TextAnalyzer(DataAnalyzer):
    """Analyzer for text documents (Word, PDF, TXT)"""
    
    def __init__(self):
        self.text = ""
        self.analysis_results = {}
        self.report = ""
        
    def load_data(self, file_path):
        try:
            if file_path.endswith('.docx'):
                doc = Document(file_path)
                self.text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            elif file_path.endswith('.pdf'):
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    self.text = ""
                    for page in pdf_reader.pages:
                        self.text += page.extract_text()
            elif file_path.endswith('.txt'):
                with open(file_path, 'r', encoding='utf-8') as file:
                    self.text = file.read()
            else:
                # Try textract for other formats
                self.text = textract.process(file_path).decode('utf-8')
                
            return True
        except Exception as e:
            print(f"Error loading text file: {e}")
            return False
    
    def analyze(self):
        if not self.text:
            return False
            
        self.analysis_results = {}
        
        # Basic text statistics
        self.analysis_results['character_count'] = len(self.text)
        self.analysis_results['word_count'] = len(self.text.split())
        self.analysis_results['sentence_count'] = len(re.split(r'[.!?]+', self.text))
        self.analysis_results['paragraph_count'] = len(self.text.split('\n\n'))
        
        # Word frequency
        words = re.findall(r'\b\w+\b', self.text.lower())
        word_freq = {}
        for word in words:
            if len(word) > 2:  # Ignore very short words
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency
        sorted_word_freq = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        self.analysis_results['word_frequency'] = dict(sorted_word_freq[:50])  # Top 50 words
        
        # Sentiment analysis (simple approach)
        positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'best', 'fantastic', 'superb', 'outstanding']
        negative_words = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'poor', 'disappointing', 'failure', 'problem']
        
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        
        self.analysis_results['sentiment'] = {
            'positive_words': positive_count,
            'negative_words': negative_count,
            'sentiment_score': (positive_count - negative_count) / max(1, len(words))
        }
        
        return True
    
    def generate_report(self):
        if not self.analysis_results:
            return ""
            
        self.report = "# Text Document Analysis Report\n\n"
        self.report += f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        self.report += "## Document Statistics\n\n"
        self.report += f"- Character count: {self.analysis_results['character_count']}\n"
        self.report += f"- Word count: {self.analysis_results['word_count']}\n"
        self.report += f"- Sentence count: {self.analysis_results['sentence_count']}\n"
        self.report += f"- Paragraph count: {self.analysis_results['paragraph_count']}\n\n"
        
        self.report += "## Sentiment Analysis\n\n"
        sentiment = self.analysis_results['sentiment']
        self.report += f"- Positive words: {sentiment['positive_words']}\n"
        self.report += f"- Negative words: {sentiment['negative_words']}\n"
        self.report += f"- Sentiment score: {sentiment['sentiment_score']:.3f}\n\n"
        
        self.report += "## Top 20 Most Frequent Words\n\n"
        word_freq = self.analysis_results['word_frequency']
        top_words = list(word_freq.items())[:20]
        for word, count in top_words:
            self.report += f"- {word}: {count}\n"
        
        return self.report

class AdvancedVisualizer:
    """Advanced visualization class with Power BI-like features"""
    
    def __init__(self):
        self.figures = {}
        
    def create_correlation_heatmap(self, data, title="Correlation Heatmap"):
        """Create a correlation heatmap"""
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) < 2:
            return None
            
        corr_matrix = data[numeric_cols].corr()
        
        fig = go.Figure(data=go.Heatmap(
            z=corr_matrix.values,
            x=corr_matrix.columns,
            y=corr_matrix.index,
            colorscale='RdBu_r',
            zmin=-1,
            zmax=1,
            colorbar=dict(title="Correlation")
        ))
        
        fig.update_layout(
            title=title,
            width=800,
            height=600
        )
        
        self.figures['correlation_heatmap'] = fig
        return fig
    
    def create_distribution_plots(self, data, title="Distribution Plots"):
        """Create distribution plots for numeric columns"""
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0:
            return None
            
        n_cols = min(3, len(numeric_cols))
        n_rows = (len(numeric_cols) + n_cols - 1) // n_cols
        
        fig = make_subplots(
            rows=n_rows, 
            cols=n_cols,
            subplot_titles=numeric_cols
        )
        
        for i, col in enumerate(numeric_cols):
            row = i // n_cols + 1
            col_idx = i % n_cols + 1
            
            fig.add_trace(
                go.Histogram(x=data[col], name=col),
                row=row, col=col_idx
            )
        
        fig.update_layout(
            title=title,
            height=300 * n_rows,
            showlegend=False
        )
        
        self.figures['distribution_plots'] = fig
        return fig
    
    def create_box_plots(self, data, title="Box Plots"):
        """Create box plots for numeric columns"""
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0:
            return None
            
        fig = go.Figure()
        
        for col in numeric_cols:
            fig.add_trace(go.Box(y=data[col], name=col))
        
        fig.update_layout(
            title=title,
            width=800,
            height=600
        )
        
        self.figures['box_plots'] = fig
        return fig
    
    def create_scatter_matrix(self, data, title="Scatter Matrix"):
        """Create a scatter matrix for numeric columns"""
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) < 2:
            return None
            
        fig = go.Figure(data=go.Splom(
            dimensions=[dict(label=col, values=data[col]) for col in numeric_cols],
            showupperhalf=False,
            diagonal_visible=False
        ))
        
        fig.update_layout(
            title=title,
            width=1000,
            height=1000
        )
        
        self.figures['scatter_matrix'] = fig
        return fig
    
    def create_word_cloud(self, text, title="Word Cloud"):
        """Create a word cloud from text"""
        wordcloud = WordCloud(width=800, height=400, background_color='white').generate(text)
        
        fig = go.Figure(go.Image(z=wordcloud.to_array()))
        fig.update_layout(
            title=title,
            xaxis=dict(showticklabels=False, showgrid=False, zeroline=False),
            yaxis=dict(showticklabels=False, showgrid=False, zeroline=False),
            width=800,
            height=400
        )
        
        self.figures['word_cloud'] = fig
        return fig
    
    def create_pca_visualization(self, data, title="PCA Visualization"):
        """Create PCA visualization for numeric data"""
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) < 2:
            return None
            
        # Handle missing values
        data_numeric = data[numeric_cols].dropna()
        
        # Standardize the data
        scaler = StandardScaler()
        data_scaled = scaler.fit_transform(data_numeric)
        
        # Apply PCA
        pca = PCA(n_components=2)
        pca_result = pca.fit_transform(data_scaled)
        
        # Create DataFrame with PCA results
        pca_df = pd.DataFrame(data=pca_result, columns=['PC1', 'PC2'])
        pca_df['index'] = data_numeric.index
        
        # Create scatter plot
        fig = px.scatter(pca_df, x='PC1', y='PC2', title=title)
        
        # Add explained variance ratio
        explained_var = pca.explained_variance_ratio_
        fig.update_layout(
            xaxis_title=f'PC1 ({explained_var[0]*100:.2f}% variance)',
            yaxis_title=f'PC2 ({explained_var[1]*100:.2f}% variance)',
            width=800,
            height=600
        )
        
        self.figures['pca_visualization'] = fig
        return fig
    
    def create_cluster_visualization(self, data, n_clusters=3, title="Cluster Visualization"):
        """Create cluster visualization using K-means"""
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) < 2:
            return None
            
        # Handle missing values
        data_numeric = data[numeric_cols].dropna()
        
        # Standardize the data
        scaler = StandardScaler()
        data_scaled = scaler.fit_transform(data_numeric)
        
        # Apply K-means clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        clusters = kmeans.fit_predict(data_scaled)
        
        # Apply PCA for visualization
        pca = PCA(n_components=2)
        pca_result = pca.fit_transform(data_scaled)
        
        # Create DataFrame with PCA results and clusters
        pca_df = pd.DataFrame(data=pca_result, columns=['PC1', 'PC2'])
        pca_df['Cluster'] = clusters.astype(str)
        pca_df['index'] = data_numeric.index
        
        # Create scatter plot with clusters
        fig = px.scatter(pca_df, x='PC1', y='PC2', color='Cluster', title=title)
        
        # Add explained variance ratio
        explained_var = pca.explained_variance_ratio_
        fig.update_layout(
            xaxis_title=f'PC1 ({explained_var[0]*100:.2f}% variance)',
            yaxis_title=f'PC2 ({explained_var[1]*100:.2f}% variance)',
            width=800,
            height=600
        )
        
        self.figures['cluster_visualization'] = fig
        return fig
    
    def create_time_series_plot(self, data, date_column, value_column, title="Time Series Analysis"):
        """Create time series plot"""
        if date_column not in data.columns or value_column not in data.columns:
            return None
            
        # Convert to datetime if needed
        if not pd.api.types.is_datetime64_any_dtype(data[date_column]):
            data[date_column] = pd.to_datetime(data[date_column])
        
        # Sort by date
        data_sorted = data.sort_values(date_column)
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=data_sorted[date_column],
            y=data_sorted[value_column],
            mode='lines+markers'
        ))
        
        fig.update_layout(
            title=title,
            xaxis_title="Date",
            yaxis_title=value_column,
            width=1000,
            height=500
        )
        
        self.figures['time_series'] = fig
        return fig
    
    def save_all_figures(self, directory="visualizations"):
        """Save all generated figures to HTML files"""
        if not os.path.exists(directory):
            os.makedirs(directory)
            
        for name, fig in self.figures.items():
            fig.write_html(f"{directory}/{name}.html")
        
        print(f"All figures saved to {directory}/ directory")

class AnalyticsDashboard:
    """Main analytics dashboard that integrates all components"""
    
    def __init__(self):
        self.analyzers = {
            'excel': ExcelAnalyzer(),
            'csv': CSVAnalyzer(),
            'text': TextAnalyzer()
        }
        self.visualizer = AdvancedVisualizer()
        self.current_data = None
        self.current_analyzer = None
        self.current_file_type = None
        
    def load_file(self, file_path):
        """Load a file and determine its type"""
        if file_path.endswith(('.xlsx', '.xls')):
            self.current_file_type = 'excel'
        elif file_path.endswith('.csv'):
            self.current_file_type = 'csv'
        elif file_path.endswith(('.docx', '.pdf', '.txt')):
            self.current_file_type = 'text'
        else:
            print("Unsupported file format")
            return False
            
        self.current_analyzer = self.analyzers[self.current_file_type]
        success = self.current_analyzer.load_data(file_path)
        
        if success and self.current_file_type in ['excel', 'csv']:
            if self.current_file_type == 'excel':
                # Use the first sheet as current data
                first_sheet = list(self.current_analyzer.data.keys())[0]
                self.current_data = self.current_analyzer.data[first_sheet]
            else:
                self.current_data = self.current_analyzer.data
                
        return success
    
    def analyze(self):
        """Perform analysis on the loaded file"""
        if not self.current_analyzer:
            print("No file loaded")
            return False
            
        return self.current_analyzer.analyze()
    
    def generate_report(self, output_file=None):
        """Generate analysis report"""
        if not self.current_analyzer:
            print("No file loaded")
            return None
            
        report = self.current_analyzer.generate_report()
        
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"Report saved to {output_file}")
            
        return report
    
    def create_visualizations(self):
        """Create visualizations based on the data"""
        if not self.current_data and self.current_file_type != 'text':
            print("No data available for visualization")
            return False
            
        if self.current_file_type == 'text':
            # Text visualizations
            self.visualizer.create_word_cloud(self.current_analyzer.text)
        else:
            # Data visualizations
            self.visualizer.create_correlation_heatmap(self.current_data)
            self.visualizer.create_distribution_plots(self.current_data)
            self.visualizer.create_box_plots(self.current_data)
            self.visualizer.create_scatter_matrix(self.current_data)
            self.visualizer.create_pca_visualization(self.current_data)
            self.visualizer.create_cluster_visualization(self.current_data)
            
            # Check if there are date columns for time series
            date_cols = self.current_data.select_dtypes(include=['datetime64']).columns
            numeric_cols = self.current_data.select_dtypes(include=[np.number]).columns
            
            if len(date_cols) > 0 and len(numeric_cols) > 0:
                self.visualizer.create_time_series_plot(
                    self.current_data, 
                    date_cols[0], 
                    numeric_cols[0]
                )
        
        return True
    
    def save_visualizations(self, directory="visualizations"):
        """Save all visualizations to files"""
        self.visualizer.save_all_figures(directory)
    
    def run_complete_analysis(self, file_path, output_dir="analysis_results"):
        """Run complete analysis pipeline"""
        # Create output directory
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Load file
        print(f"Loading file: {file_path}")
        if not self.load_file(file_path):
            return False
        
        # Analyze data
        print("Analyzing data...")
        if not self.analyze():
            return False
        
        # Generate report
        print("Generating report...")
        report_file = f"{output_dir}/analysis_report.md"
        self.generate_report(report_file)
        
        # Create visualizations
        print("Creating visualizations...")
        self.create_visualizations()
        
        # Save visualizations
        print("Saving visualizations...")
        self.save_visualizations(f"{output_dir}/visualizations")
        
        print(f"Analysis complete. Results saved to {output_dir}/")
        return True

# Example usage
if __name__ == "__main__":
    # Create dashboard instance
    dashboard = AnalyticsDashboard()
    
    # Example file paths (replace with your actual file paths)
    excel_file = "example_data.xlsx"
    csv_file = "example_data.csv"
    text_file = "example_document.docx"
    
    # Run analysis on different file types
    # dashboard.run_complete_analysis(excel_file, "excel_analysis")
    # dashboard.run_complete_analysis(csv_file, "csv_analysis")
    # dashboard.run_complete_analysis(text_file, "text_analysis")
    
    print("Analytics dashboard initialized. Use run_complete_analysis() to analyze your files.")