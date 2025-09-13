import asyncio
import aiohttp
import logging
from typing import List, Dict, Any
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)

class BlogsAgent:
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
        Scrape blog posts related to the topic and level.
        """
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            resources = []
            
            # Search for blog posts on various platforms
            search_queries = [
                f"{topic} {level} blog",
                f"{topic} {level} post",
                f"learn {topic} {level}",
                f"{topic} {level} experience"
            ]
            
            for query in search_queries:
                # Search popular blog platforms
                blog_platforms = [
                    ("Hashnode", f"https://hashnode.com/search?q={query.replace(' ', '%20')}"),
                    ("Dev.to", f"https://dev.to/search?q={query.replace(' ', '%20')}"),
                    ("Medium", f"https://medium.com/search?q={query.replace(' ', '%20')}"),
                    ("Personal Blogs", f"https://www.google.com/search?q={query.replace(' ', '+')}+site:blogspot.com+OR+site:wordpress.com")
                ]
                
                for platform_name, search_url in blog_platforms:
                    try:
                        if platform_name == "Personal Blogs":
                            blogs = await self._search_personal_blogs(query)
                        else:
                            blogs = await self._search_blog_platform(platform_name, search_url, query)
                        resources.extend(blogs)
                    except Exception as e:
                        logger.error(f"Error searching {platform_name}: {e}")
                        continue
            
            # Remove duplicates based on URL
            seen_urls = set()
            unique_resources = []
            for resource in resources:
                if resource["link"] not in seen_urls:
                    seen_urls.add(resource["link"])
                    unique_resources.append(resource)
            
            logger.info(f"Blogs agent found {len(unique_resources)} unique blog posts")
            return unique_resources
            
        except Exception as e:
            logger.error(f"Error in blogs agent: {e}")
            return []
    
    async def _search_blog_platform(self, platform_name: str, search_url: str, query: str) -> List[Dict[str, Any]]:
        """Search a specific blog platform"""
        try:
            async with self.session.get(search_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    blogs = []
                    
                    # Different parsing for different platforms
                    if platform_name == "Hashnode":
                        blogs = self._parse_hashnode(soup, platform_name)
                    elif platform_name == "Dev.to":
                        blogs = self._parse_devto(soup, platform_name)
                    elif platform_name == "Medium":
                        blogs = self._parse_medium(soup, platform_name)
                    
                    return blogs[:5]  # Limit results per platform
        except Exception as e:
            logger.error(f"Error searching {platform_name}: {e}")
        
        return []
    
    def _parse_hashnode(self, soup: BeautifulSoup, platform_name: str) -> List[Dict[str, Any]]:
        """Parse Hashnode search results"""
        blogs = []
        
        # Look for blog post links
        for link in soup.find_all('a', href=True):
            href = link.get('href')
            title = link.get_text(strip=True)
            
            if not title or len(title) < 10:
                continue
            
            # Check if it's a blog post link
            if '/@' in href and not href.startswith('//'):
                full_url = href if href.startswith('http') else f"https://hashnode.com{href}"
                
                # Extract description
                description = self._extract_blog_description(link)
                
                blogs.append({
                    "type": "blog",
                    "title": title,
                    "link": full_url,
                    "raw_text": description,
                    "source": platform_name
                })
        
        return blogs
    
    def _parse_devto(self, soup: BeautifulSoup, platform_name: str) -> List[Dict[str, Any]]:
        """Parse Dev.to search results"""
        blogs = []
        
        # Look for article links
        for link in soup.find_all('a', href=True):
            href = link.get('href')
            title = link.get_text(strip=True)
            
            if not title or len(title) < 10:
                continue
            
            # Check if it's an article link
            if href.startswith('/') and not href.startswith('//') and len(href) > 5:
                full_url = f"https://dev.to{href}"
                
                # Extract description
                description = self._extract_blog_description(link)
                
                blogs.append({
                    "type": "blog",
                    "title": title,
                    "link": full_url,
                    "raw_text": description,
                    "source": platform_name
                })
        
        return blogs
    
    def _parse_medium(self, soup: BeautifulSoup, platform_name: str) -> List[Dict[str, Any]]:
        """Parse Medium search results"""
        blogs = []
        
        # Look for article links
        for link in soup.find_all('a', href=True):
            href = link.get('href')
            title = link.get_text(strip=True)
            
            if not title or len(title) < 10:
                continue
            
            # Check if it's an article link
            if '/@' in href and not href.startswith('//'):
                full_url = href if href.startswith('http') else f"https://medium.com{href}"
                
                # Extract description
                description = self._extract_blog_description(link)
                
                blogs.append({
                    "type": "blog",
                    "title": title,
                    "link": full_url,
                    "raw_text": description,
                    "source": platform_name
                })
        
        return blogs
    
    async def _search_personal_blogs(self, query: str) -> List[Dict[str, Any]]:
        """Search for personal blog posts using Google search"""
        try:
            # This is a simplified approach - in production, you'd use Google Custom Search API
            search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}+site:blogspot.com+OR+site:wordpress.com"
            
            async with self.session.get(search_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    blogs = []
                    
                    # Look for search result links
                    for link in soup.find_all('a', href=True):
                        href = link.get('href')
                        title = link.get_text(strip=True)
                        
                        if not title or len(title) < 10:
                            continue
                        
                        # Check if it's a blog post link
                        if any(domain in href for domain in ['blogspot.com', 'wordpress.com', 'tumblr.com']):
                            # Extract description from search result
                            description = self._extract_search_result_description(link)
                            
                            blogs.append({
                                "type": "blog",
                                "title": title,
                                "link": href,
                                "raw_text": description,
                                "source": "personal_blog"
                            })
                    
                    return blogs[:5]  # Limit results
        except Exception as e:
            logger.error(f"Error searching personal blogs: {e}")
        
        return []
    
    def _extract_blog_description(self, link_element) -> str:
        """Extract blog description from around the link"""
        try:
            # Look for parent element with description
            parent = link_element.find_parent(['div', 'article', 'section'])
            if parent:
                # Look for description paragraph or span
                desc_element = parent.find(['p', 'span'], class_=re.compile(r'description|excerpt|summary'))
                if desc_element:
                    text = desc_element.get_text(strip=True)
                    if len(text) > 200:
                        text = text[:200] + "..."
                    return text
                
                # Fallback to parent text
                text = parent.get_text(strip=True)
                if len(text) > 200:
                    text = text[:200] + "..."
                return text
            
            return link_element.get_text(strip=True)
        except:
            return ""
    
    def _extract_search_result_description(self, link_element) -> str:
        """Extract description from Google search result"""
        try:
            # Look for parent div containing the search result
            parent = link_element.find_parent('div')
            if parent:
                # Look for description text
                desc_element = parent.find('span', class_=re.compile(r'st|description'))
                if desc_element:
                    text = desc_element.get_text(strip=True)
                    if len(text) > 200:
                        text = text[:200] + "..."
                    return text
                
                # Fallback to parent text
                text = parent.get_text(strip=True)
                if len(text) > 200:
                    text = text[:200] + "..."
                return text
            
            return link_element.get_text(strip=True)
        except:
            return ""
