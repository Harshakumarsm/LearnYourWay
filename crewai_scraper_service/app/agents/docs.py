import asyncio
import aiohttp
import logging
from typing import List, Dict, Any
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)

class DocsAgent:
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
        Scrape official documentation related to the topic and level.
        """
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            resources = []
            
            # Map topics to common documentation sources
            doc_sources = self._get_doc_sources(topic)
            
            for source_name, source_url in doc_sources.items():
                try:
                    docs = await self._scrape_doc_source(source_name, source_url, topic, level)
                    resources.extend(docs)
                except Exception as e:
                    logger.error(f"Error scraping {source_name}: {e}")
                    continue
            
            # Remove duplicates based on URL
            seen_urls = set()
            unique_resources = []
            for resource in resources:
                if resource["link"] not in seen_urls:
                    seen_urls.add(resource["link"])
                    unique_resources.append(resource)
            
            logger.info(f"Docs agent found {len(unique_resources)} unique documentation resources")
            return unique_resources
            
        except Exception as e:
            logger.error(f"Error in docs agent: {e}")
            return []
    
    def _get_doc_sources(self, topic: str) -> Dict[str, str]:
        """Get relevant documentation sources based on topic"""
        topic_lower = topic.lower()
        
        sources = {}
        
        # Programming languages and frameworks
        if any(term in topic_lower for term in ['python', 'django', 'flask', 'fastapi']):
            sources['Python'] = 'https://docs.python.org/3/'
            sources['Django'] = 'https://docs.djangoproject.com/'
            sources['FastAPI'] = 'https://fastapi.tiangolo.com/'
        
        if any(term in topic_lower for term in ['javascript', 'node', 'react', 'vue', 'angular']):
            sources['MDN'] = 'https://developer.mozilla.org/'
            sources['Node.js'] = 'https://nodejs.org/docs/'
            sources['React'] = 'https://reactjs.org/docs/'
        
        if any(term in topic_lower for term in ['java', 'spring', 'maven']):
            sources['Oracle Java'] = 'https://docs.oracle.com/javase/'
            sources['Spring'] = 'https://spring.io/docs'
        
        if any(term in topic_lower for term in ['machine learning', 'ml', 'tensorflow', 'pytorch']):
            sources['TensorFlow'] = 'https://www.tensorflow.org/learn'
            sources['PyTorch'] = 'https://pytorch.org/docs/'
            sources['Scikit-learn'] = 'https://scikit-learn.org/stable/'
        
        if any(term in topic_lower for term in ['data science', 'pandas', 'numpy']):
            sources['Pandas'] = 'https://pandas.pydata.org/docs/'
            sources['NumPy'] = 'https://numpy.org/doc/'
        
        if any(term in topic_lower for term in ['web development', 'html', 'css']):
            sources['MDN Web Docs'] = 'https://developer.mozilla.org/'
            sources['W3Schools'] = 'https://www.w3schools.com/'
        
        # If no specific sources found, add general programming docs
        if not sources:
            sources['MDN'] = 'https://developer.mozilla.org/'
            sources['W3Schools'] = 'https://www.w3schools.com/'
        
        return sources
    
    async def _scrape_doc_source(self, source_name: str, source_url: str, topic: str, level: str) -> List[Dict[str, Any]]:
        """Scrape a specific documentation source"""
        try:
            async with self.session.get(source_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    resources = []
                    
                    # Look for relevant links based on topic keywords
                    topic_keywords = topic.lower().split()
                    
                    for link in soup.find_all('a', href=True):
                        href = link.get('href')
                        title = link.get_text(strip=True)
                        
                        if not title or len(title) < 5:
                            continue
                        
                        # Check if link is relevant to topic
                        title_lower = title.lower()
                        if any(keyword in title_lower for keyword in topic_keywords):
                            # Make URL absolute
                            if href.startswith('/'):
                                full_url = f"{source_url.rstrip('/')}{href}"
                            elif href.startswith('http'):
                                full_url = href
                            else:
                                continue
                            
                            # Extract snippet from nearby text
                            snippet = self._extract_snippet(link)
                            
                            resources.append({
                                "type": "docs",
                                "title": title,
                                "link": full_url,
                                "raw_text": snippet,
                                "source": source_name
                            })
                    
                    return resources[:10]  # Limit results per source
        except Exception as e:
            logger.error(f"Error scraping {source_name}: {e}")
        
        return []
    
    def _extract_snippet(self, link_element) -> str:
        """Extract a snippet of text from around the link"""
        try:
            # Look for parent paragraph or div
            parent = link_element.find_parent(['p', 'div', 'li'])
            if parent:
                text = parent.get_text(strip=True)
                # Truncate if too long
                if len(text) > 200:
                    text = text[:200] + "..."
                return text
            return link_element.get_text(strip=True)
        except:
            return ""
