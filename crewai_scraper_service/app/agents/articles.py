import asyncio
import aiohttp
import logging
from typing import List, Dict, Any
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)

class ArticlesAgent:
    def __init__(self):
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def scrape(self, topic: str, level: str) -> List[Dict[str, Any]]:
        """
        Scrape articles related to the topic and level.
        """
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            resources = []
            
            # Search for articles on various platforms
            search_queries = [
                f"{topic} {level} article",
                f"{topic} {level} guide",
                f"learn {topic} {level}",
                f"{topic} tutorial {level}"
            ]
            
            for query in search_queries:
                # Search Wikipedia
                wiki_results = await self._search_wikipedia(query)
                resources.extend(wiki_results)
                
                # Search Medium
                medium_results = await self._search_medium(query)
                resources.extend(medium_results)
                
                # Search Dev.to
                devto_results = await self._search_devto(query)
                resources.extend(devto_results)
            
            # Remove duplicates based on URL
            seen_urls = set()
            unique_resources = []
            for resource in resources:
                if resource["link"] not in seen_urls:
                    seen_urls.add(resource["link"])
                    unique_resources.append(resource)
            
            logger.info(f"Articles agent found {len(unique_resources)} unique articles")
            return unique_resources
            
        except Exception as e:
            logger.error(f"Error in articles agent: {e}")
            return []
    
    async def _search_wikipedia(self, query: str) -> List[Dict[str, Any]]:
        """Search Wikipedia for articles"""
        try:
            url = "https://en.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": query,
                "srlimit": 5
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    articles = []
                    
                    for item in data.get("query", {}).get("search", []):
                        article_url = f"https://en.wikipedia.org/wiki/{item['title'].replace(' ', '_')}"
                        articles.append({
                            "type": "article",
                            "title": item["title"],
                            "link": article_url,
                            "raw_text": item.get("snippet", ""),
                            "source": "wikipedia"
                        })
                    
                    return articles
        except Exception as e:
            logger.error(f"Error searching Wikipedia: {e}")
        
        return []
    
    async def _search_medium(self, query: str) -> List[Dict[str, Any]]:
        """Search Medium for articles"""
        try:
            # Using a simple search approach - in production, you'd use Medium's API
            search_url = f"https://medium.com/search?q={query.replace(' ', '%20')}"
            
            async with self.session.get(search_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    articles = []
                    # Look for article links (this is a simplified approach)
                    for link in soup.find_all('a', href=True):
                        href = link.get('href')
                        if href and '/@' in href and '?' not in href:
                            title = link.get_text(strip=True)
                            if title and len(title) > 10:
                                full_url = href if href.startswith('http') else f"https://medium.com{href}"
                                articles.append({
                                    "type": "article",
                                    "title": title,
                                    "link": full_url,
                                    "raw_text": title,
                                    "source": "medium"
                                })
                    
                    return articles[:5]  # Limit to 5 results
        except Exception as e:
            logger.error(f"Error searching Medium: {e}")
        
        return []
    
    async def _search_devto(self, query: str) -> List[Dict[str, Any]]:
        """Search Dev.to for articles"""
        try:
            search_url = f"https://dev.to/search?q={query.replace(' ', '%20')}"
            
            async with self.session.get(search_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    articles = []
                    # Look for article links
                    for link in soup.find_all('a', href=True):
                        href = link.get('href')
                        if href and href.startswith('/') and not href.startswith('//'):
                            title = link.get_text(strip=True)
                            if title and len(title) > 10:
                                full_url = f"https://dev.to{href}"
                                articles.append({
                                    "type": "article",
                                    "title": title,
                                    "link": full_url,
                                    "raw_text": title,
                                    "source": "devto"
                                })
                    
                    return articles[:5]  # Limit to 5 results
        except Exception as e:
            logger.error(f"Error searching Dev.to: {e}")
        
        return []
