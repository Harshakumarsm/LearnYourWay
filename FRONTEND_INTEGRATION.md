# Frontend Integration - ContentMiner

This document describes the frontend integration of the CrewAI Scraper Service into the LearnYourWay React application.

## 🎯 Overview

The ContentMiner feature has been fully integrated into the existing React/TypeScript application, providing a seamless user experience for discovering and accessing curated learning resources.

## 🏗️ Architecture

### Components Created

1. **`src/pages/ContentMiner.tsx`** - Main ContentMiner page component
2. **`src/components/ContentMiner/ResourceCard.tsx`** - Individual resource card component
3. **`src/services/api.ts`** - API service for backend communication
4. **`src/config/api.ts`** - API configuration
5. **`src/hooks/useAuth.ts`** - Authentication hook

### Updated Components

1. **`src/App.tsx`** - Added routing for ContentMiner
2. **`src/components/FeatureCard.tsx`** - Added navigation functionality
3. **`src/components/Sidebar.tsx`** - Added ContentMiner navigation item
4. **`src/components/Dashboard.tsx`** - ContentMiner card is clickable

## 🎨 UI Features

### Search Interface
- **Topic Input**: Large search input with placeholder suggestions
- **Level Selector**: Dropdown with beginner/intermediate/advanced options
- **Search Button**: Triggers resource mining with loading states

### Resource Display
- **Categorized Tabs**: Resources organized by type (articles, docs, tutorials, videos, blogs)
- **Resource Cards**: Beautiful cards showing:
  - Resource type with color-coded badges
  - Title and relevance score
  - Source domain
  - Direct link to resource
- **Statistics**: Summary stats showing resource counts and average scores

### User Experience
- **Loading States**: Skeleton loading and progress indicators
- **Error Handling**: Graceful error messages with retry options
- **Empty States**: Helpful empty state with suggested topics
- **Responsive Design**: Works on all screen sizes

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the project root:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
VITE_API_BASE_URL=http://localhost:8000
```

### API Configuration
The API service is configured in `src/config/api.ts` and can be easily modified for different environments.

## 🚀 Usage

### Starting the Application
1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Start the FastAPI backend** (in separate terminal):
   ```bash
   cd crewai_scraper_service
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

### Using ContentMiner
1. **Navigate to ContentMiner**:
   - Click the ContentMiner card on the homepage
   - Or use the sidebar navigation
   - Or go directly to `/content-miner`

2. **Search for resources**:
   - Enter a topic (e.g., "Machine Learning", "Python Programming")
   - Select your skill level
   - Click "Search" to mine resources

3. **Explore results**:
   - Browse resources by category using tabs
   - Click "Open" to visit resources in new tabs
   - View relevance scores and source information

## 🎨 Design System

### Color Coding
- **Articles**: Blue (`bg-blue-100 text-blue-800`)
- **Documentation**: Green (`bg-green-100 text-green-800`)
- **Tutorials**: Purple (`bg-purple-100 text-purple-800`)
- **Videos**: Red (`bg-red-100 text-red-800`)
- **Blogs**: Orange (`bg-orange-100 text-orange-800`)

### Score Indicators
- **High Score (≥80%)**: Green text
- **Medium Score (60-79%)**: Yellow text
- **Low Score (<60%)**: Red text

### Icons
- **Articles**: 📄 (FileText)
- **Documentation**: 📚 (BookOpen)
- **Tutorials**: 🎓 (Code)
- **Videos**: 🎥 (Video)
- **Blogs**: ✍️ (PenTool)

## 🔐 Authentication

The ContentMiner feature requires authentication:
- Uses Clerk for user authentication
- JWT tokens are handled automatically
- Mock authentication is available for development

## 📱 Responsive Design

The interface is fully responsive:
- **Mobile**: Single column layout with stacked cards
- **Tablet**: Two-column grid layout
- **Desktop**: Three-column grid layout with sidebar

## 🚨 Error Handling

Comprehensive error handling includes:
- **Network Errors**: Connection issues with backend
- **Authentication Errors**: Missing or invalid tokens
- **Validation Errors**: Invalid search inputs
- **API Errors**: Backend service errors

## 🔄 State Management

Uses React Query for:
- **Caching**: Prevents unnecessary API calls
- **Loading States**: Automatic loading indicators
- **Error States**: Automatic error handling
- **Refetching**: Manual and automatic data refresh

## 🎯 Future Enhancements

Potential improvements:
1. **Favorites System**: Save favorite resources
2. **Search History**: Track previous searches
3. **Resource Filtering**: Advanced filtering options
4. **Export Options**: Export resource lists
5. **Offline Support**: Cache resources for offline viewing

## 🐛 Troubleshooting

### Common Issues

1. **"No authentication token found"**:
   - Ensure you're signed in with Clerk
   - Check if `auth_token` exists in localStorage

2. **API connection errors**:
   - Verify the FastAPI backend is running
   - Check the `VITE_API_BASE_URL` environment variable

3. **Empty search results**:
   - Try different search terms
   - Check if the backend agents are working
   - Verify network connectivity

### Development Tips

1. **Mock Authentication**: The app includes mock authentication for development
2. **API Testing**: Use the browser dev tools to inspect API calls
3. **Error Logging**: Check the console for detailed error messages

## 📊 Performance

The application is optimized for performance:
- **Lazy Loading**: Components load only when needed
- **Memoization**: Expensive calculations are memoized
- **Efficient Rendering**: Minimal re-renders with React Query
- **Image Optimization**: Proper image loading and sizing

This integration provides a complete, production-ready ContentMiner feature that seamlessly integrates with the existing LearnYourWay application architecture and design system.
