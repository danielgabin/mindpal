"""Gemini API client for LLM-powered features."""

import json
from typing import List, Dict, Optional
from google import genai
from app.core.config import settings


class GeminiClient:
    """Client for interacting with Google's Gemini API."""
    
    def __init__(self):
        """Initialize the Gemini client."""
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = settings.GEMINI_MODEL
    
    async def generate_split_files(
        self,
        conceptualization_content: str,
        categories: Optional[List[str]] = None,
        max_splits: int = None
    ) -> List[Dict[str, str]]:
        """
        Generate split files from a conceptualization note.
        
        Args:
            conceptualization_content: The markdown content of the conceptualization
            categories: Optional list of category names. If None, LLM will infer.
            max_splits: Maximum number of splits (default from settings)
        
        Returns:
            List of dicts with 'title' and 'content' keys
        """
        if max_splits is None:
            max_splits = settings.MAX_SPLIT_FILES
        
        # Generate categories if not provided
        if categories is None or len(categories) == 0:
            categories = await self._infer_categories(conceptualization_content)
        
        # Limit to max splits
        categories = categories[:max_splits]
        
        # Build prompt
        prompt = self._build_split_generation_prompt(
            conceptualization_content,
            categories
        )
        
        # Call Gemini API
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt
        )
        
        # Parse response
        splits = self._parse_split_response(response.text, categories)
        
        return splits
    
    async def _infer_categories(
        self,
        content: str
    ) -> List[str]:
        """
        Ask LLM to suggest appropriate categories for the content.
        
        Returns:
            List of category names (4-7 items)
        """
        prompt = f"""You are assisting a psychologist in organizing clinical notes.

Analyze the following conceptualization note and suggest 4-7 appropriate categories 
for organizing this information into separate files:

---
{content[:2000]}  # Limit to first 2000 chars for analysis
---

Return ONLY a JSON array of category names, nothing else. Example:
["Background", "Presenting Problem", "Symptoms", "Treatment Plan"]

Categories should be:
- Clinically relevant
- Distinct from each other
- Cover the main themes in the note
- Use professional terminology
"""
        
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt
        )
        
        try:
            # Extract JSON from response
            text = response.text.strip()
            # Remove markdown code blocks if present
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            text = text.strip()
            
            categories = json.loads(text)
            
            # Validate it's a list of strings
            if not isinstance(categories, list):
                raise ValueError("Response is not a list")
            
            categories = [str(c) for c in categories if c]
            
            # Ensure between 4-7 categories
            if len(categories) < 4:
                categories.extend(["Additional Notes"] * (4 - len(categories)))
            categories = categories[:7]
            
            return categories
            
        except (json.JSONDecodeError, ValueError, IndexError) as e:
            # Fallback to default categories
            return [
                "Background",
                "Presenting Problem",
                "Symptoms",
                "Mental Status",
                "Treatment Plan"
            ]
    
    def _build_split_generation_prompt(
        self,
        content: str,
        categories: List[str]
    ) -> str:
        """Build the prompt for generating split files."""
        
        categories_list = "\n".join(f"- {cat}" for cat in categories)
        
        prompt = f"""You are assisting a psychologist in organizing clinical notes.

Given the following conceptualization note from a patient's initial session:

---
{content}
---

Please generate {len(categories)} separate clinical note files based on these categories:
{categories_list}

For each category, extract and organize the relevant information from the conceptualization note.

IMPORTANT GUIDELINES:
- Use markdown formatting
- Be thorough but concise
- Only include information actually present in the source note
- If a category has no relevant information, create a brief placeholder stating "No information available for this category yet."
- Maintain professional clinical language
- Preserve any important patient quotes or observations
- Include relevant dates, names, or specific details

Return your response as a JSON array with this EXACT structure:
[
  {{
    "title": "Category Name",
    "content": "# Category Name\\n\\nMarkdown content here..."
  }},
  ...
]

Return ONLY the JSON array, no additional text before or after.
"""
        
        return prompt
    
    def _parse_split_response(
        self,
        response_text: str,
        expected_categories: List[str]
    ) -> List[Dict[str, str]]:
        """
        Parse the LLM response into structured split files.
        
        Args:
            response_text: Raw text from Gemini
            expected_categories: Categories we asked for
        
        Returns:
            List of dicts with title and content
        """
        try:
            # Clean up response
            text = response_text.strip()
            
            # Remove markdown code blocks if present
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
            
            # Remove any trailing markdown
            if text.endswith("```"):
                text = text.rsplit("```", 1)[0].strip()
            
            # Parse JSON
            splits = json.loads(text)
            
            # Validate structure
            if not isinstance(splits, list):
                raise ValueError("Response is not a list")
            
            validated_splits = []
            for split in splits:
                if isinstance(split, dict) and 'title' in split and 'content' in split:
                    validated_splits.append({
                        'title': str(split['title']),
                        'content': str(split['content'])
                    })
            
            # If we didn't get enough splits, create placeholders
            while len(validated_splits) < len(expected_categories):
                idx = len(validated_splits)
                category = expected_categories[idx]
                validated_splits.append({
                    'title': category,
                    'content': f"# {category}\n\nNo information available for this category yet."
                })
            
            return validated_splits
            
        except (json.JSONDecodeError, ValueError, KeyError, IndexError) as e:
            # Fallback: create placeholder splits
            return [
                {
                    'title': cat,
                    'content': f"# {cat}\n\nNo information available for this category yet."
                }
                for cat in expected_categories
            ]


# Global instance
gemini_client = GeminiClient()
