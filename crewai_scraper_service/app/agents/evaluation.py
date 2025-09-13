import logging
from typing import List, Dict, Any
from rapidfuzz import fuzz
import re

logger = logging.getLogger(__name__)

class EvaluationAgent:
    def __init__(self):
        self.min_score_threshold = 0.4
        self.max_results_per_category = 5
        
        # Source credibility scores
        self.source_credibility = {
            'wikipedia': 1.0,
            'mdn': 0.95,
            'oracle': 0.9,
            'tensorflow': 0.9,
            'pytorch': 0.9,
            'scikit-learn': 0.9,
            'pandas': 0.9,
            'numpy': 0.9,
            'spring': 0.9,
            'django': 0.9,
            'fastapi': 0.9,
            'react': 0.9,
            'node.js': 0.9,
            'tutorialspoint': 0.8,
            'geeksforgeeks': 0.8,
            'w3schools': 0.8,
            'freecodecamp': 0.8,
            'edx': 0.85,
            'coursera': 0.85,
            'youtube': 0.7,
            'vimeo': 0.7,
            'hashnode': 0.75,
            'dev.to': 0.75,
            'medium': 0.7,
            'personal_blog': 0.6,
            'blogspot': 0.6,
            'wordpress': 0.6,
            'tumblr': 0.5
        }
        
        # Level keywords for content depth scoring
        self.level_keywords = {
            'beginner': ['beginner', 'basic', 'intro', 'introduction', 'getting started', 'learn', 'tutorial', 'guide', 'simple', 'easy'],
            'intermediate': ['intermediate', 'advanced', 'deep dive', 'comprehensive', 'detailed', 'expert', 'professional', 'production'],
            'advanced': ['advanced', 'expert', 'master', 'professional', 'production', 'enterprise', 'optimization', 'performance']
        }
    
    async def evaluate(self, resources: List[Dict[str, Any]], topic: str, level: str) -> List[Dict[str, Any]]:
        """
        Evaluate and filter resources based on relevance, content depth, and source credibility.
        """
        try:
            logger.info(f"Evaluating {len(resources)} resources for topic: {topic}, level: {level}")
            
            evaluated_resources = []
            
            for resource in resources:
                try:
                    # Calculate individual scores
                    relevance_score = self._calculate_relevance_score(resource, topic)
                    content_depth_score = self._calculate_content_depth_score(resource, level)
                    credibility_score = self._calculate_credibility_score(resource)
                    
                    # Calculate weighted final score
                    final_score = (
                        relevance_score * 0.4 +
                        content_depth_score * 0.3 +
                        credibility_score * 0.3
                    )
                    
                    # Add score to resource
                    resource['score'] = round(final_score, 2)
                    
                    # Only include resources above threshold
                    if final_score >= self.min_score_threshold:
                        evaluated_resources.append(resource)
                        logger.debug(f"Resource '{resource['title']}' scored {final_score}")
                    else:
                        logger.debug(f"Resource '{resource['title']}' filtered out (score: {final_score})")
                
                except Exception as e:
                    logger.error(f"Error evaluating resource {resource.get('title', 'Unknown')}: {e}")
                    continue
            
            # Sort by score (highest first)
            evaluated_resources.sort(key=lambda x: x['score'], reverse=True)
            
            # Group by type and limit results per category
            filtered_resources = self._filter_by_category(evaluated_resources)
            
            logger.info(f"After evaluation: {len(filtered_resources)} resources passed filtering")
            return filtered_resources
            
        except Exception as e:
            logger.error(f"Error in evaluation agent: {e}")
            return []
    
    def _calculate_relevance_score(self, resource: Dict[str, Any], topic: str) -> float:
        """Calculate relevance score based on topic keyword matching"""
        try:
            title = resource.get('title', '').lower()
            raw_text = resource.get('raw_text', '').lower()
            topic_lower = topic.lower()
            
            # Split topic into keywords
            topic_keywords = re.findall(r'\b\w+\b', topic_lower)
            
            # Calculate title relevance
            title_score = 0
            for keyword in topic_keywords:
                if keyword in title:
                    # Exact match gets higher score
                    if keyword == title or f" {keyword} " in f" {title} ":
                        title_score += 1.0
                    else:
                        title_score += 0.7
            
            # Calculate content relevance
            content_score = 0
            for keyword in topic_keywords:
                if keyword in raw_text:
                    content_score += 0.5
            
            # Use fuzzy matching for partial matches
            title_fuzzy = fuzz.partial_ratio(topic_lower, title) / 100
            content_fuzzy = fuzz.partial_ratio(topic_lower, raw_text) / 100
            
            # Combine scores
            relevance = (
                (title_score / len(topic_keywords)) * 0.6 +
                (content_score / len(topic_keywords)) * 0.2 +
                title_fuzzy * 0.1 +
                content_fuzzy * 0.1
            )
            
            return min(relevance, 1.0)  # Cap at 1.0
            
        except Exception as e:
            logger.error(f"Error calculating relevance score: {e}")
            return 0.0
    
    def _calculate_content_depth_score(self, resource: Dict[str, Any], level: str) -> float:
        """Calculate content depth score based on level appropriateness"""
        try:
            title = resource.get('title', '').lower()
            raw_text = resource.get('raw_text', '').lower()
            level_lower = level.lower()
            
            # Get level keywords
            level_keywords = self.level_keywords.get(level_lower, [])
            
            # Check for level indicators in title and content
            level_indicators = 0
            total_checks = 0
            
            for keyword in level_keywords:
                total_checks += 1
                if keyword in title or keyword in raw_text:
                    level_indicators += 1
            
            # Base score from level keyword matching
            if total_checks > 0:
                base_score = level_indicators / total_checks
            else:
                base_score = 0.5  # Neutral score if no level keywords found
            
            # Bonus for specific level indicators
            if level_lower == 'beginner':
                if any(word in title for word in ['tutorial', 'guide', 'learn', 'intro']):
                    base_score += 0.2
            elif level_lower == 'intermediate':
                if any(word in title for word in ['advanced', 'deep', 'comprehensive']):
                    base_score += 0.2
            elif level_lower == 'advanced':
                if any(word in title for word in ['expert', 'master', 'professional']):
                    base_score += 0.2
            
            # Penalty for mismatched level indicators
            if level_lower == 'beginner':
                if any(word in title for word in ['expert', 'advanced', 'master']):
                    base_score -= 0.3
            elif level_lower == 'advanced':
                if any(word in title for word in ['beginner', 'intro', 'basic']):
                    base_score -= 0.3
            
            return max(0.0, min(base_score, 1.0))  # Clamp between 0 and 1
            
        except Exception as e:
            logger.error(f"Error calculating content depth score: {e}")
            return 0.5  # Neutral score on error
    
    def _calculate_credibility_score(self, resource: Dict[str, Any]) -> float:
        """Calculate credibility score based on source reputation"""
        try:
            source = resource.get('source', '').lower()
            link = resource.get('link', '').lower()
            
            # Check source credibility
            source_score = self.source_credibility.get(source, 0.5)
            
            # Additional checks based on URL patterns
            if 'wikipedia.org' in link:
                source_score = max(source_score, 1.0)
            elif 'github.com' in link:
                source_score = max(source_score, 0.8)
            elif 'stackoverflow.com' in link:
                source_score = max(source_score, 0.8)
            elif 'docs.' in link:
                source_score = max(source_score, 0.9)
            elif 'tutorial' in link:
                source_score = max(source_score, 0.7)
            
            return source_score
            
        except Exception as e:
            logger.error(f"Error calculating credibility score: {e}")
            return 0.5  # Neutral score on error
    
    def _filter_by_category(self, resources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter resources to limit results per category"""
        try:
            # Group by type
            by_type = {}
            for resource in resources:
                resource_type = resource.get('type', 'unknown')
                if resource_type not in by_type:
                    by_type[resource_type] = []
                by_type[resource_type].append(resource)
            
            # Take top results from each category
            filtered_resources = []
            for resource_type, type_resources in by_type.items():
                # Sort by score and take top N
                type_resources.sort(key=lambda x: x['score'], reverse=True)
                top_resources = type_resources[:self.max_results_per_category]
                filtered_resources.extend(top_resources)
            
            # Sort all filtered resources by score
            filtered_resources.sort(key=lambda x: x['score'], reverse=True)
            
            return filtered_resources
            
        except Exception as e:
            logger.error(f"Error filtering by category: {e}")
            return resources  # Return original list on error
