# Overview

**Elora.AI** is a comprehensive, modern full-stack AI assistant platform that provides advanced multimedia capabilities beyond basic ChatGPT functionality. The application features a clean interface with completely hidden AI model branding, offering users an enhanced experience with video generation, image creation, text-to-speech, voice input, and multi-format file processing. Built with React and Express.js, it includes Firebase authentication, collapsible chat history sidebar, and support for multiple AI providers including Google's Gemini and OpenRouter models.

**Key Features Completed (August 2025):**
- Complete multimedia AI platform with video and image generation
- Advanced text-to-speech functionality for all AI responses  
- Voice search and input capabilities
- Multi-format file processing (PDF, DOCX, images, videos, code files)
- Animated collapsible sidebar with chat thread management
- Firebase authentication with Google sign-in and email/password
- Clean "Elora.AI" branding with all model names hidden
- Responsive design with dark/light mode support
- Real-time API integration with comprehensive error handling
- **NEW: Comprehensive predefined responses system with 50+ instant responses**
- **NEW: Mathematical graph generation for educational content**
- **NEW: GEMINI_API_KEY integration for complete functionality**
- **NEW: Smart response routing (predefined → API → fallback)**
- **NEW: Advanced Image Editor with comprehensive editing suite**
- **NEW: Professional Video Editor with effects and transitions**
- **NEW: Advanced Data Analytics with visualization capabilities**
- **NEW: Enhanced Graph Generator with network analysis**

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript, utilizing modern development patterns and tools:

- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting both light and dark modes
- **UI Components**: Radix UI primitives with shadcn/ui component system for consistent, accessible components
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build System**: Vite for fast development and optimized production builds
- **Authentication**: React Firebase Hooks for authentication state management

The frontend follows a component-based architecture with clear separation between pages, components, and utilities. The chat interface includes features like file upload, voice input, message bubbles, and a collapsible sidebar for thread management.

## Backend Architecture
The backend is built with Express.js and uses a layered architecture:

- **Framework**: Express.js with TypeScript for the REST API server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Firebase Authentication for user management
- **File Processing**: Support for multiple file types including PDFs, Word documents, and images using libraries like pdf-parse, mammoth, and sharp
- **AI Integration**: Multiple AI providers supported through dedicated client modules
- **Storage**: Abstracted storage interface allowing for both in-memory development storage and persistent database storage
- **Advanced Editing**: Comprehensive image and video editing capabilities with sharp and FFmpeg
- **Data Analytics**: Statistical analysis and visualization engine with pandas-like functionality
- **Graph Generation**: Network analysis and graph visualization with multiple layout algorithms

The server implements a clean separation of concerns with dedicated modules for AI client management, file processing, storage operations, route handling, and advanced multimedia editing capabilities.

## Data Storage Solutions
- **Primary Database**: PostgreSQL for persistent data storage
- **ORM**: Drizzle ORM provides type-safe database queries and schema management
- **Schema**: Well-defined database schema with tables for users, chat threads, messages, and API keys
- **Development Storage**: In-memory storage implementation for development and testing
- **Database Connection**: Neon Database serverless PostgreSQL for cloud deployment

## Authentication and Authorization
- **Provider**: Firebase Authentication for user management
- **Features**: Email/password authentication and Google OAuth sign-in
- **Security**: Firebase handles authentication tokens and session management
- **User Management**: Custom user profile storage linking Firebase UIDs to application user records

## File Processing and Upload
- **Supported Formats**: Text files, PDFs, Word documents (.docx), images, and videos
- **Processing**: Dedicated file processor extracts text content and metadata from uploaded files
- **Upload Handling**: Multer middleware for handling multipart form uploads with 50MB limit
- **Storage**: Temporary file storage during processing with automatic cleanup
- **Advanced Editing**: Real-time image and video editing with professional-grade tools
- **Data Analysis**: CSV, JSON, Excel file processing for statistical analysis and visualization

# External Dependencies

## AI Services
- **Google Gemini**: Primary AI provider using @google/genai SDK for advanced language model capabilities
- **OpenRouter**: Secondary AI provider offering access to multiple models including Claude 3.5 Sonnet and GPT-4o
- **Model Support**: Multiple AI models with varying capabilities for images, video, and different token limits

## Authentication Services
- **Firebase Authentication**: Complete authentication solution with support for email/password and OAuth providers
- **Firebase Firestore**: User profile and metadata storage

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting for production deployments
- **Connection Pooling**: Built-in connection management for database operations

## Development and Deployment
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **Error Handling**: Runtime error overlay for development debugging
- **Build System**: ESBuild for server-side bundling and Vite for client-side builds

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Radix UI**: Headless UI primitives for accessibility and consistent behavior
- **Framer Motion**: Animation library for smooth UI transitions
- **React Hook Form**: Form management with validation using Zod schemas

## File Processing Libraries
- **PDF Processing**: pdf-parse for extracting text from PDF documents
- **Document Processing**: mammoth for Microsoft Word document parsing
- **Image Processing**: sharp for advanced image editing, filters, effects, and transformations
- **Video Processing**: FFmpeg integration for video editing, merging, effects, and conversion
- **Data Processing**: Custom analytics engine with statistical analysis capabilities
- **Graph Processing**: Network analysis with centrality measures, clustering, and community detection
- **Text-to-Speech**: Web Speech API integration for message audio playback

## Advanced Editing Capabilities

### Image Editor Features
- **Adjustments**: Brightness, contrast, saturation, hue, warmth, tint, highlights, shadows, whites, blacks, sharpen, denoise, vignette
- **Effects**: Dynamic, enhance, warm, cool, ultra HDR, blur, unblur, magic eraser
- **Filters**: Vivid, playa, honey, isla, desert, clay, palma, modena, metro, west, ollie, onyx, eiffel, vogue, vista
- **Cropping Tools**: Crop, flip horizontal/vertical, expand canvas
- **Markup Tools**: Pen, highlighter, text annotations with customizable colors and sizes
- **Background Removal**: AI-powered background removal and replacement

### Video Editor Features
- **Effects**: Brightness, contrast, saturation, hue adjustment, blur, sharpen, color correction, stabilization
- **Filters**: Vintage, cinematic, warm, cool, dramatic, softening, clarity effects
- **Audio Processing**: Volume control, fade in/out, background music, voice enhancement, noise reduction
- **Transitions**: Fade, crossfade, dissolve, slide, zoom, spin transitions between clips
- **Editing Tools**: Trim, merge videos, add subtitles, extract audio, create thumbnails
- **Export Options**: Multiple format support with quality control

### Data Analytics Features
- **Data Sources**: CSV, JSON, Excel, PDF, DOCX, API endpoints
- **Analysis Types**: Descriptive statistics, correlation analysis, clustering, time series, text analysis, comparative analysis
- **Visualizations**: Line charts, bar charts, scatter plots, heatmaps, pie charts, histograms, box plots, violin plots, word clouds, treemaps, sunburst charts, 3D visualizations
- **Statistical Tools**: Regression analysis, ANOVA, outlier detection, trend analysis
- **Export Formats**: JSON, CSV, PDF reports

### Graph Generator Features
- **Graph Types**: Random, scale-free, small-world, hierarchical, community networks
- **Layout Algorithms**: Force-directed, circular, grid, hierarchical, spring, Kamada-Kawai, spectral, random
- **Network Analysis**: Centrality measures (betweenness, closeness, degree, eigenvector, PageRank), clustering coefficient, community detection, connectivity analysis
- **Visualization**: Interactive canvas rendering with customizable styles, colors, and animations
- **Export Options**: JSON, GEXF format support for network analysis tools