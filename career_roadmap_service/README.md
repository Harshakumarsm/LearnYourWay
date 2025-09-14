# Career Roadmap API Service

A FastAPI-based microservice that generates AI-powered career roadmaps using Google's Gemini AI.

## Features

- **Career Roadmap Generation**: Get detailed roadmaps for any career path
- **Career Search**: Search and get suggestions for career titles
- **AI-Powered**: Uses Google Gemini AI for intelligent content generation
- **RESTful API**: Clean REST endpoints for easy integration
- **CORS Enabled**: Ready for frontend integration

## API Endpoints

### GET /roadmap
Generate a career roadmap for a specific career.

**Parameters:**
- `career` (required): Career title to generate roadmap for

**Example:**
```
GET /roadmap?career=Data Scientist
```

### GET /search
Search for career suggestions based on a query.

**Parameters:**
- `query` (required): Search query for career suggestions

**Example:**
```
GET /search?query=software
```

### GET /health
Health check endpoint.

## Quick Start

### Windows
```bash
# Run the start script
start.bat
```

### Manual Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

## Configuration

The service runs on `http://localhost:8001` by default.

**Important:** Make sure to set up your Google Gemini API key. For production, use environment variables instead of hardcoding the API key.

## Integration

This service is designed to work with the LearnYourWay frontend. The frontend can access the API at:
- Career Roadmap: `http://localhost:8001/roadmap?career={career_name}`
- Career Search: `http://localhost:8001/search?query={search_term}`

## Dependencies

- FastAPI: Web framework
- Uvicorn: ASGI server
- Google Generative AI: Gemini AI integration
- Python Multipart: Form data handling