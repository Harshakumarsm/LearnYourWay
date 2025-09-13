#!/usr/bin/env python3
"""
Example usage of the CrewAI Scraper Service
"""

import asyncio
import aiohttp
import json

async def test_scraper_service():
    """Test the scraper service with example requests"""
    
    base_url = "http://localhost:8000"
    
    # Test data
    test_requests = [
        {
            "topic": "Machine Learning",
            "level": "beginner"
        },
        {
            "topic": "Python Programming",
            "level": "intermediate"
        },
        {
            "topic": "Web Development",
            "level": "advanced"
        }
    ]
    
    async with aiohttp.ClientSession() as session:
        # Test health endpoint
        print("Testing health endpoint...")
        async with session.get(f"{base_url}/health") as response:
            if response.status == 200:
                health_data = await response.json()
                print(f"Health check: {health_data}")
            else:
                print(f"Health check failed: {response.status}")
        
        # Test scrape_resources endpoint
        print("\nTesting scrape_resources endpoint...")
        
        for i, request_data in enumerate(test_requests, 1):
            print(f"\n--- Test {i}: {request_data['topic']} ({request_data['level']}) ---")
            
            # Note: In a real implementation, you would need a valid JWT token
            headers = {
                "Authorization": "Bearer your-jwt-token-here",
                "Content-Type": "application/json"
            }
            
            try:
                async with session.post(
                    f"{base_url}/scrape_resources",
                    json=request_data,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"Success! Found {len(data['resources'])} resources:")
                        
                        for resource in data['resources'][:3]:  # Show first 3
                            print(f"  - {resource['type']}: {resource['title']} (score: {resource['score']})")
                            print(f"    Link: {resource['link']}")
                    elif response.status == 401:
                        print("Authentication required - please provide a valid JWT token")
                    else:
                        error_data = await response.json()
                        print(f"Error {response.status}: {error_data}")
                        
            except Exception as e:
                print(f"Request failed: {e}")

async def test_individual_agents():
    """Test individual agents directly"""
    print("\n--- Testing Individual Agents ---")
    
    # Import agents
    from app.agents.articles import ArticlesAgent
    from app.agents.docs import DocsAgent
    from app.agents.tutorials import TutorialsAgent
    from app.agents.videos import VideosAgent
    from app.agents.blogs import BlogsAgent
    from app.agents.evaluation import EvaluationAgent
    
    topic = "Python Programming"
    level = "beginner"
    
    # Test articles agent
    print(f"\nTesting Articles Agent for '{topic}' ({level})...")
    async with ArticlesAgent() as articles_agent:
        articles = await articles_agent.scrape(topic, level)
        print(f"Found {len(articles)} articles")
        for article in articles[:2]:
            print(f"  - {article['title']} ({article['source']})")
    
    # Test docs agent
    print(f"\nTesting Docs Agent for '{topic}' ({level})...")
    async with DocsAgent() as docs_agent:
        docs = await docs_agent.scrape(topic, level)
        print(f"Found {len(docs)} documentation resources")
        for doc in docs[:2]:
            print(f"  - {doc['title']} ({doc['source']})")
    
    # Test evaluation agent
    print(f"\nTesting Evaluation Agent...")
    evaluation_agent = EvaluationAgent()
    
    # Create sample resources
    sample_resources = [
        {
            "type": "article",
            "title": "Python Programming for Beginners",
            "link": "https://example.com/python-basics",
            "raw_text": "Learn Python programming from scratch with this comprehensive guide",
            "source": "wikipedia"
        },
        {
            "type": "tutorial",
            "title": "Advanced Python Techniques",
            "link": "https://example.com/advanced-python",
            "raw_text": "Master advanced Python programming concepts",
            "source": "tutorialspoint"
        }
    ]
    
    evaluated = await evaluation_agent.evaluate(sample_resources, topic, level)
    print(f"Evaluated {len(evaluated)} resources:")
    for resource in evaluated:
        print(f"  - {resource['title']} (score: {resource['score']})")

if __name__ == "__main__":
    print("CrewAI Scraper Service - Example Usage")
    print("=" * 50)
    
    # Run the tests
    asyncio.run(test_scraper_service())
    asyncio.run(test_individual_agents())
    
    print("\n" + "=" * 50)
    print("Example completed!")
    print("\nTo run the service:")
    print("1. Install dependencies: pip install -r requirements.txt")
    print("2. Start the service: uvicorn app.main:app --reload")
    print("3. Test with: python example_usage.py")
