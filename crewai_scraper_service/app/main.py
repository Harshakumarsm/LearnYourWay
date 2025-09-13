from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import asyncio
import logging
from .agents.articles import ArticlesAgent
from .agents.docs import DocsAgent
from .agents.tutorials import TutorialsAgent
from .agents.videos import VideosAgent
from .agents.blogs import BlogsAgent
from .agents.evaluation import EvaluationAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CrewAI Scraper Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Pydantic models
class ScrapeRequest(BaseModel):
    topic: str
    level: str

class Resource(BaseModel):
    type: str
    title: str
    link: str
    score: float

class ScrapeResponse(BaseModel):
    content: str
    resources: List[Resource]

# Authentication dependency
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # In a real implementation, you would verify the JWT token here
    # For development, we'll accept mock tokens
    if not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # For development, accept mock tokens
    if credentials.credentials in ["mock-jwt-token-for-development", "development-token"]:
        return credentials.credentials
    
    # In production, you would verify the JWT token here
    # For now, we'll accept any non-empty token
    return credentials.credentials

# Initialize agents
articles_agent = ArticlesAgent()
docs_agent = DocsAgent()
tutorials_agent = TutorialsAgent()
videos_agent = VideosAgent()
blogs_agent = BlogsAgent()
evaluation_agent = EvaluationAgent()

@app.post("/scrape_resources", response_model=ScrapeResponse)
async def scrape_resources(
    request: ScrapeRequest,
    token: str = Depends(verify_token)
):
    """
    Scrape learning resources for a given topic and level.
    Requires authentication.
    """
    try:
        logger.info(f"Scraping resources for topic: {request.topic}, level: {request.level}")
        
        # Validate level
        valid_levels = ["beginner", "intermediate", "advanced"]
        if request.level.lower() not in valid_levels:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid level. Must be one of: {valid_levels}"
            )
        
        # Run all scraping agents concurrently
        tasks = [
            articles_agent.scrape(request.topic, request.level),
            docs_agent.scrape(request.topic, request.level),
            tutorials_agent.scrape(request.topic, request.level),
            videos_agent.scrape(request.topic, request.level),
            blogs_agent.scrape(request.topic, request.level)
        ]
        
        # Wait for all agents to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Combine all resources
        all_resources = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Agent {i} failed: {result}")
                continue
            all_resources.extend(result)
        
        logger.info(f"Collected {len(all_resources)} resources from all agents")
        
        # Evaluate and filter resources
        evaluated_resources = await evaluation_agent.evaluate(
            all_resources, request.topic, request.level
        )
        
        logger.info(f"After evaluation: {len(evaluated_resources)} resources")
        
        # Format response
        response = ScrapeResponse(
            content=f"Learning resources for {request.topic} at {request.level} level",
            resources=[
                Resource(
                    type=resource["type"],
                    title=resource["title"],
                    link=resource["link"],
                    score=resource["score"]
                )
                for resource in evaluated_resources
            ]
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error in scrape_resources: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/health")
async def health_check():
    """Health check endpoint (no authentication required)"""
    return {"status": "healthy", "service": "crewai-scraper-service"}

@app.options("/scrape_resources")
async def scrape_resources_options():
    """Handle preflight OPTIONS request for CORS"""
    return {"message": "OK"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
