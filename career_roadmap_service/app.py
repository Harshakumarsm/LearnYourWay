from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import json
import os

# Configure Gemini API (use environment variable in production)
API_KEY = "AIzaSyD9bFJHeAVVhhQ35xGjIH1Zu-Z_SHH3PlQ"
genai.configure(api_key=API_KEY)

app = FastAPI(title="Career Roadmap API", version="1.0.0")

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_career_roadmap(career_title: str):
    """Generate a career roadmap using Gemini AI"""
    prompt = f"""
    You are a career roadmap strategist and mentor.
    Input: {career_title}
    
    Task: Create a comprehensive, well-structured career roadmap to succeed in this career.
    
    Requirements:
    1. Provide detailed, actionable guidance
    2. Include specific examples and real-world applications
    3. Structure the content in clear, digestible sections
    4. Make it inspiring and motivational
    
    Output Format - Return ONLY a valid JSON object with these exact keys:
    {{
        "overview": "A compelling 2-3 sentence overview of the career path and its potential",
        "key_skills": [
            "Skill 1: Brief description of why it's important",
            "Skill 2: Brief description of why it's important",
            "Skill 3: Brief description of why it's important"
        ],
        "tools_tech": [
            "Tool/Technology 1: What it's used for",
            "Tool/Technology 2: What it's used for", 
            "Tool/Technology 3: What it's used for"
        ],
        "learning_path": [
            "Step 1: Beginner level - What to start with",
            "Step 2: Intermediate level - Building expertise",
            "Step 3: Advanced level - Specialization areas"
        ],
        "milestones": [
            "0-6 months: Initial goals and achievements",
            "6-18 months: Intermediate milestones",
            "18+ months: Advanced career objectives"
        ],
        "salary_range": "Expected salary range and growth potential",
        "job_market": "Current market demand and future outlook"
    }}
    
    Career: {career_title}
    """
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        
        # Clean the response text
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        response_text = response_text.strip()
        
        # Try to parse as JSON
        try:
            parsed_data = json.loads(response_text)
            
            # Ensure all required keys exist with proper structure
            structured_response = {
                "overview": parsed_data.get("overview", f"Comprehensive career path for {career_title}"),
                "key_skills": parsed_data.get("key_skills", []),
                "tools_tech": parsed_data.get("tools_tech", []),
                "learning_path": parsed_data.get("learning_path", []),
                "milestones": parsed_data.get("milestones", []),
                "salary_range": parsed_data.get("salary_range", "Competitive salary with growth potential"),
                "job_market": parsed_data.get("job_market", "Growing field with opportunities")
            }
            
            return structured_response
            
        except json.JSONDecodeError:
            # Fallback with sample structured data
            return {
                "overview": f"Exciting career path in {career_title} with strong growth potential and diverse opportunities.",
                "key_skills": [
                    "Technical expertise: Core competencies in your field",
                    "Problem-solving: Analytical thinking and solution development",
                    "Communication: Ability to explain complex concepts clearly"
                ],
                "tools_tech": [
                    "Industry-standard software and platforms",
                    "Programming languages or specialized tools",
                    "Collaboration and project management tools"
                ],
                "learning_path": [
                    "Foundation: Build core knowledge through courses and tutorials",
                    "Practice: Work on projects and gain hands-on experience", 
                    "Specialization: Focus on specific areas of expertise"
                ],
                "milestones": [
                    "0-6 months: Complete foundational learning and first project",
                    "6-18 months: Build portfolio and gain practical experience",
                    "18+ months: Pursue advanced certifications and leadership roles"
                ],
                "salary_range": "Competitive compensation with growth potential",
                "job_market": "Strong demand with positive outlook",
                "raw_response": response_text
            }
            
    except Exception as e:
        return {
            "error": f"Failed to generate roadmap: {str(e)}",
            "career": career_title,
            "overview": f"Unable to generate roadmap for {career_title} at this time.",
            "key_skills": [],
            "tools_tech": [],
            "learning_path": [],
            "milestones": [],
            "salary_range": "N/A",
            "job_market": "N/A"
        }

@app.get("/")
async def root():
    return {"message": "Career Roadmap API is running", "version": "1.0.0"}

@app.get("/roadmap")
async def get_roadmap(career: str = Query(..., description="Career title to generate roadmap for")):
    """Generate a career roadmap for the specified career"""
    roadmap = generate_career_roadmap(career)
    return {
        "career": career,
        "roadmap": roadmap,
        "status": "success"
    }

@app.get("/search")
async def search_careers(query: str = Query(..., description="Search query for career suggestions")):
    """Search for career suggestions based on query"""
    # Sample careers database - replace with actual database in production
    sample_careers = [
        "Data Scientist", "Machine Learning Engineer", "Software Developer", 
        "AI Researcher", "Cloud Architect", "DevOps Engineer", "Product Manager",
        "UX/UI Designer", "Cybersecurity Analyst", "Full Stack Developer",
        "Mobile App Developer", "Game Developer", "Blockchain Developer",
        "Digital Marketing Specialist", "Business Analyst", "Project Manager"
    ]
    
    # Simple search logic
    results = [career for career in sample_careers if query.lower() in career.lower()]
    
    return {
        "query": query,
        "results": results,
        "total": len(results)
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "career-roadmap-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)