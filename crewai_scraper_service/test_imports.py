#!/usr/bin/env python3
"""
Test script to verify all imports work correctly
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    try:
        print("Testing imports...")
        
        # Test agent imports
        from app.agents.articles import ArticlesAgent
        print("✓ ArticlesAgent imported successfully")
        
        from app.agents.docs import DocsAgent
        print("✓ DocsAgent imported successfully")
        
        from app.agents.tutorials import TutorialsAgent
        print("✓ TutorialsAgent imported successfully")
        
        from app.agents.videos import VideosAgent
        print("✓ VideosAgent imported successfully")
        
        from app.agents.blogs import BlogsAgent
        print("✓ BlogsAgent imported successfully")
        
        from app.agents.evaluation import EvaluationAgent
        print("✓ EvaluationAgent imported successfully")
        
        # Test main app import
        from app.main import app
        print("✓ FastAPI app imported successfully")
        
        print("\n🎉 All imports successful! The service should start correctly.")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)
