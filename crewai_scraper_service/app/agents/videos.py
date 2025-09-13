import asyncio
import aiohttp
import logging
from typing import List, Dict, Any
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)

class VideosAgent:
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
        Scrape video tutorials related to the topic and level.
        """
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            resources = []
            
            # Search for videos on various platforms
            search_queries = [
                f"{topic} {level} tutorial",
                f"learn {topic} {level}",
                f"{topic} {level} course",
                f"{topic} {level} video"
            ]
            
            for query in search_queries:
                # Search YouTube (using a simple approach - in production, use YouTube API)
                youtube_results = await self._search_youtube(query)
                resources.extend(youtube_results)
                
                # Search other video platforms
                other_results = await self._search_other_video_platforms(query)
                resources.extend(other_results)
            
            # Remove duplicates based on URL
            seen_urls = set()
            unique_resources = []
            for resource in resources:
                if resource["link"] not in seen_urls:
                    seen_urls.add(resource["link"])
                    unique_resources.append(resource)
            
            logger.info(f"Videos agent found {len(unique_resources)} unique video resources")
            return unique_resources
            
        except Exception as e:
            logger.error(f"Error in videos agent: {e}")
            return []
    
    async def _search_youtube(self, query: str) -> List[Dict[str, Any]]:
        """Search YouTube for videos (simplified approach)"""
        try:
            # This is a simplified approach - in production, use YouTube Data API
            search_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
            
            async with self.session.get(search_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    videos = []
                    
                    # Look for video links (this is a simplified approach)
                    for link in soup.find_all('a', href=True):
                        href = link.get('href')
                        title = link.get_text(strip=True)
                        
                        if not title or len(title) < 10:
                            continue
                        
                        # Check if it's a video link
                        if href.startswith('/watch?v='):
                            video_id = href.split('v=')[1].split('&')[0]
                            full_url = f"https://www.youtube.com/watch?v={video_id}"
                            
                            # Extract description from nearby elements
                            description = self._extract_video_description(link)
                            
                            videos.append({
                                "type": "video",
                                "title": title,
                                "link": full_url,
                                "raw_text": description,
                                "source": "youtube"
                            })
                    
                    return videos[:10]  # Limit results
        except Exception as e:
            logger.error(f"Error searching YouTube: {e}")
        
        return []
    
    async def _search_other_video_platforms(self, query: str) -> List[Dict[str, Any]]:
        """Search other video platforms"""
        videos = []
        
        # Search Vimeo (simplified approach)
        try:
            vimeo_results = await self._search_vimeo(query)
            videos.extend(vimeo_results)
        except Exception as e:
            logger.error(f"Error searching Vimeo: {e}")
        
        # Search educational platforms
        try:
            edx_results = await self._search_edx(query)
            videos.extend(edx_results)
        except Exception as e:
            logger.error(f"Error searching edX: {e}")
        
        try:
            coursera_results = await self._search_coursera(query)
            videos.extend(coursera_results)
        except Exception as e:
            logger.error(f"Error searching Coursera: {e}")
        
        return videos
    
    async def _search_vimeo(self, query: str) -> List[Dict[str, Any]]:
        """Search Vimeo for videos"""
        try:
            search_url = f"https://vimeo.com/search?q={query.replace(' ', '%20')}"
            
            async with self.session.get(search_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    videos = []
                    
                    # Look for video links
                    for link in soup.find_all('a', href=True):
                        href = link.get('href')
                        title = link.get_text(strip=True)
                        
                        if not title or len(title) < 10:
                            continue
                        
                        # Check if it's a video link
                        if href.startswith('/') and not href.startswith('//'):
                            full_url = f"https://vimeo.com{href}"
                            
                            videos.append({
                                "type": "video",
                                "title": title,
                                "link": full_url,
                                "raw_text": title,
                                "source": "vimeo"
                            })
                    
                    return videos[:5]  # Limit results
        except Exception as e:
            logger.error(f"Error searching Vimeo: {e}")
        
        return []
    
    async def _search_edx(self, query: str) -> List[Dict[str, Any]]:
        """Search edX for courses"""
        try:
            search_url = f"https://www.edx.org/search?q={query.replace(' ', '%20')}"
            
            async with self.session.get(search_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    courses = []
                    
                    # Look for course links
                    for link in soup.find_all('a', href=True):
                        href = link.get('href')
                        title = link.get_text(strip=True)
                        
                        if not title or len(title) < 10:
                            continue
                        
                        # Check if it's a course link
                        if '/course/' in href or '/learn/' in href:
                            full_url = href if href.startswith('http') else f"https://www.edx.org{href}"
                            
                            courses.append({
                                "type": "video",
                                "title": title,
                                "link": full_url,
                                "raw_text": title,
                                "source": "edx"
                            })
                    
                    return courses[:5]  # Limit results
        except Exception as e:
            logger.error(f"Error searching edX: {e}")
        
        return []
    
    async def _search_coursera(self, query: str) -> List[Dict[str, Any]]:
        """Search Coursera for courses"""
        try:
            search_url = f"https://www.coursera.org/search?query={query.replace(' ', '%20')}"
            
            async with self.session.get(search_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    courses = []
                    
                    # Look for course links
                    for link in soup.find_all('a', href=True):
                        href = link.get('href')
                        title = link.get_text(strip=True)
                        
                        if not title or len(title) < 10:
                            continue
                        
                        # Check if it's a course link
                        if '/learn/' in href or '/course/' in href:
                            full_url = href if href.startswith('http') else f"https://www.coursera.org{href}"
                            
                            courses.append({
                                "type": "video",
                                "title": title,
                                "link": full_url,
                                "raw_text": title,
                                "source": "coursera"
                            })
                    
                    return courses[:5]  # Limit results
        except Exception as e:
            logger.error(f"Error searching Coursera: {e}")
        
        return []
    
    def _extract_video_description(self, link_element) -> str:
        """Extract video description from around the link"""
        try:
            # Look for parent element with description
            parent = link_element.find_parent(['div', 'ytd-video-renderer'])
            if parent:
                # Look for description element
                desc_element = parent.find(['span', 'p'], class_=re.compile(r'description|snippet'))
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
