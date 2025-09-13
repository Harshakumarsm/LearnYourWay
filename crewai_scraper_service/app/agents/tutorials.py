import asyncio
import aiohttp
import logging
from typing import List, Dict, Any
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)

class TutorialsAgent:
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
        Scrape tutorials related to the topic and level.
        """
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            resources = []
            
            # Search for tutorials on various platforms
            search_queries = [
                f"{topic} {level} tutorial",
                f"learn {topic} {level} step by step",
                f"{topic} {level} guide",
                f"how to {topic} {level}"
            ]
            
            for query in search_queries:
                # Search tutorial platforms
                tutorial_sites = [
                    ("TutorialsPoint", f"https://www.tutorialspoint.com/search?q={query.replace(' ', '%20')}"),
                    ("GeeksforGeeks", f"https://www.geeksforgeeks.org/search/?query={query.replace(' ', '%20')}"),
                    ("W3Schools", f"https://www.w3schools.com/search/search.php?q={query.replace(' ', '%20')}"),
                    ("FreeCodeCamp", f"https://www.freecodecamp.org/search?query={query.replace(' ', '%20')}")
                ]
                
                for site_name, search_url in tutorial_sites:
                    try:
                        tutorials = await self._search_tutorial_site(site_name, search_url, query)
                        resources.extend(tutorials)
                    except Exception as e:
                        logger.error(f"Error searching {site_name}: {e}")
                        continue
            
            # Remove duplicates based on URL
            seen_urls = set()
            unique_resources = []
            for resource in resources:
                if resource["link"] not in seen_urls:
                    seen_urls.add(resource["link"])
                    unique_resources.append(resource)
            
            logger.info(f"Tutorials agent found {len(unique_resources)} unique tutorials")
            return unique_resources
            
        except Exception as e:
            logger.error(f"Error in tutorials agent: {e}")
            return []
    
    async def _search_tutorial_site(self, site_name: str, search_url: str, query: str) -> List[Dict[str, Any]]:
        """Search a specific tutorial site"""
        try:
            async with self.session.get(search_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    tutorials = []
                    
                    # Different selectors for different sites
                    if site_name == "TutorialsPoint":
                        tutorials = self._parse_tutorialspoint(soup, site_name)
                    elif site_name == "GeeksforGeeks":
                        tutorials = self._parse_geeksforgeeks(soup, site_name)
                    elif site_name == "W3Schools":
                        tutorials = self._parse_w3schools(soup, site_name)
                    elif site_name == "FreeCodeCamp":
                        tutorials = self._parse_freecodecamp(soup, site_name)
                    
                    return tutorials[:5]  # Limit results per site
        except Exception as e:
            logger.error(f"Error searching {site_name}: {e}")
        
        return []
    
    def _parse_tutorialspoint(self, soup: BeautifulSoup, site_name: str) -> List[Dict[str, Any]]:
        """Parse TutorialsPoint search results"""
        tutorials = []
        
        # Look for tutorial links
        for link in soup.find_all('a', href=True):
            href = link.get('href')
            title = link.get_text(strip=True)
            
            if not title or len(title) < 10:
                continue
            
            # Check if it's a tutorial link
            if '/tutorials/' in href or 'tutorial' in title.lower():
                full_url = href if href.startswith('http') else f"https://www.tutorialspoint.com{href}"
                
                # Extract description
                description = self._extract_description(link)
                
                tutorials.append({
                    "type": "tutorial",
                    "title": title,
                    "link": full_url,
                    "raw_text": description,
                    "source": site_name
                })
        
        return tutorials
    
    def _parse_geeksforgeeks(self, soup: BeautifulSoup, site_name: str) -> List[Dict[str, Any]]:
        """Parse GeeksforGeeks search results"""
        tutorials = []
        
        # Look for article links
        for link in soup.find_all('a', href=True):
            href = link.get('href')
            title = link.get_text(strip=True)
            
            if not title or len(title) < 10:
                continue
            
            # Check if it's a tutorial/article link
            if '/tutorials/' in href or '/articles/' in href or 'tutorial' in title.lower():
                full_url = href if href.startswith('http') else f"https://www.geeksforgeeks.org{href}"
                
                # Extract description
                description = self._extract_description(link)
                
                tutorials.append({
                    "type": "tutorial",
                    "title": title,
                    "link": full_url,
                    "raw_text": description,
                    "source": site_name
                })
        
        return tutorials
    
    def _parse_w3schools(self, soup: BeautifulSoup, site_name: str) -> List[Dict[str, Any]]:
        """Parse W3Schools search results"""
        tutorials = []
        
        # Look for tutorial links
        for link in soup.find_all('a', href=True):
            href = link.get('href')
            title = link.get_text(strip=True)
            
            if not title or len(title) < 5:
                continue
            
            # Check if it's a tutorial link
            if '/tutorials/' in href or 'tutorial' in title.lower():
                full_url = href if href.startswith('http') else f"https://www.w3schools.com{href}"
                
                tutorials.append({
                    "type": "tutorial",
                    "title": title,
                    "link": full_url,
                    "raw_text": title,
                    "source": site_name
                })
        
        return tutorials
    
    def _parse_freecodecamp(self, soup: BeautifulSoup, site_name: str) -> List[Dict[str, Any]]:
        """Parse FreeCodeCamp search results"""
        tutorials = []
        
        # Look for article/tutorial links
        for link in soup.find_all('a', href=True):
            href = link.get('href')
            title = link.get_text(strip=True)
            
            if not title or len(title) < 10:
                continue
            
            # Check if it's a tutorial/article link
            if '/news/' in href or 'tutorial' in title.lower():
                full_url = href if href.startswith('http') else f"https://www.freecodecamp.org{href}"
                
                # Extract description
                description = self._extract_description(link)
                
                tutorials.append({
                    "type": "tutorial",
                    "title": title,
                    "link": full_url,
                    "raw_text": description,
                    "source": site_name
                })
        
        return tutorials
    
    def _extract_description(self, link_element) -> str:
        """Extract description text from around the link"""
        try:
            # Look for parent element with description
            parent = link_element.find_parent(['div', 'article', 'section'])
            if parent:
                # Look for description paragraph
                desc_p = parent.find('p')
                if desc_p:
                    text = desc_p.get_text(strip=True)
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
