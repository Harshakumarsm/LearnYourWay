# CrewAI Scraper Service

A Python FastAPI microservice that exposes web-scraping agents as REST endpoints with intelligent resource evaluation and filtering.

## Features

- **Multi-Agent Architecture**: Separate agents for different resource types (articles, docs, tutorials, videos, blogs)
- **Intelligent Evaluation**: AI-powered scoring based on relevance, content depth, and source credibility
- **Authentication**: JWT-based authentication to protect endpoints
- **Concurrent Processing**: Async scraping for improved performance
- **Resource Filtering**: Automatic filtering of low-quality resources
- **Docker Support**: Containerized deployment ready

## Architecture

```
/crewai_scraper_service
  /app
    main.py                 # FastAPI application with endpoints
    /agents
      articles.py          # Scrapes articles from Wikipedia, Medium, Dev.to
      docs.py              # Scrapes official documentation
      tutorials.py         # Scrapes tutorials from various platforms
      videos.py            # Scrapes videos from YouTube, Vimeo, educational platforms
      blogs.py             # Scrapes blog posts from multiple sources
      evaluation.py        # Evaluates and scores resources
  requirements.txt         # Python dependencies
  Dockerfile              # Container configuration
```

## Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crewai_scraper_service
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Docker Deployment

1. **Build the image**
   ```bash
   docker build -t crewai-scraper-service .
   ```

2. **Run the container**
   ```bash
   docker run -p 8000:8000 crewai-scraper-service
   ```

## API Endpoints

### POST /scrape_resources

Scrape learning resources for a given topic and level.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "topic": "Machine Learning",
  "level": "beginner"
}
```

**Response**:
```json
{
  "content": "Learning resources for Machine Learning at beginner level",
  "resources": [
    {
      "type": "article",
      "title": "What is Machine Learning?",
      "link": "https://wikipedia.org/wiki/Machine_learning",
      "score": 0.92
    },
    {
      "type": "video",
      "title": "ML Basics Explained",
      "link": "https://youtube.com/watch?v=example",
      "score": 0.81
    }
  ]
}
```

### GET /health

Health check endpoint (no authentication required).

**Response**:
```json
{
  "status": "healthy",
  "service": "crewai-scraper-service"
}
```

## Resource Types

### Articles Agent
- **Sources**: Wikipedia, Medium, Dev.to
- **Focus**: Educational articles and guides
- **Scoring**: High weight on source credibility

### Documentation Agent
- **Sources**: Official documentation sites (MDN, Python docs, etc.)
- **Focus**: Official API references and guides
- **Scoring**: Highest credibility scores

### Tutorials Agent
- **Sources**: TutorialsPoint, GeeksforGeeks, W3Schools, FreeCodeCamp
- **Focus**: Step-by-step tutorials and guides
- **Scoring**: Balanced relevance and depth scoring

### Videos Agent
- **Sources**: YouTube, Vimeo, edX, Coursera
- **Focus**: Video tutorials and courses
- **Scoring**: Content depth and platform credibility

### Blogs Agent
- **Sources**: Hashnode, Dev.to, Medium, personal blogs
- **Focus**: Personal experiences and insights
- **Scoring**: Content quality and author credibility

## Evaluation System

The evaluation agent scores resources on three criteria:

1. **Relevance (40%)**: Keyword matching and fuzzy string matching
2. **Content Depth (30%)**: Appropriateness for the specified level
3. **Source Credibility (30%)**: Reputation of the source platform

### Scoring Criteria

- **Wikipedia**: 1.0 (highest credibility)
- **Official Docs**: 0.9-0.95
- **Educational Platforms**: 0.8-0.85
- **Community Platforms**: 0.7-0.75
- **Personal Blogs**: 0.6

### Filtering

- Minimum score threshold: 0.4
- Maximum results per category: 5
- Results sorted by score (highest first)

## Authentication

The service uses JWT-based authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Configuration

### Environment Variables

- `JWT_SECRET_KEY`: Secret key for JWT token validation
- `LOG_LEVEL`: Logging level (default: INFO)

### Customization

You can customize the evaluation criteria by modifying the `EvaluationAgent` class:

- Adjust `min_score_threshold` for filtering sensitivity
- Modify `max_results_per_category` for result limits
- Update `source_credibility` scores for different sources
- Add new level keywords in `level_keywords`

## Error Handling

The service includes comprehensive error handling:

- **Graceful Degradation**: Individual agent failures don't stop the entire process
- **Input Validation**: Pydantic models validate all inputs
- **Logging**: Detailed logging for debugging and monitoring
- **HTTP Status Codes**: Proper status codes for different error types

## Performance

- **Concurrent Processing**: All agents run in parallel using asyncio
- **Connection Pooling**: Reuses HTTP connections for efficiency
- **Result Caching**: Consider implementing Redis for production
- **Rate Limiting**: Add rate limiting for production use

## Monitoring

The service includes:

- **Health Check Endpoint**: For load balancer health checks
- **Structured Logging**: JSON-formatted logs for monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Request timing and resource counts

## Security Considerations

- **Input Sanitization**: All inputs are validated and sanitized
- **Rate Limiting**: Implement rate limiting for production
- **CORS**: Configure CORS for web applications
- **HTTPS**: Use HTTPS in production
- **Token Validation**: Implement proper JWT validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository or contact the development team.
