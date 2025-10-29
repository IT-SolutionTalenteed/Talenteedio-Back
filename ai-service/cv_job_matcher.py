#!/usr/bin/env python3
"""
CV Job Matcher - AI Service
Matches a candidate's CV with a job description using OpenAI API
Returns a percentage match score with detailed analysis
"""

try:
    from openai import OpenAI
    _OPENAI_IMPORTED = True
except Exception:
    OpenAI = None
    _OPENAI_IMPORTED = False

from pydantic import Field, BaseModel
from typing import List, Optional
import json
import os
import sys
import argparse
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Configuration API ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- Data Models ---

class MatchCriteria(BaseModel):
    """Criteria for evaluating CV-Job match"""
    criterion: str = Field(..., description="Name of the criterion (e.g., Skills, Experience)")
    score: int = Field(..., description="Score out of 100 for this criterion")
    explanation: str = Field(..., description="Brief explanation of the score")


class MatchResult(BaseModel):
    """Result of CV-Job matching analysis"""
    overall_match_percentage: int = Field(..., description="Overall match percentage (0-100)")
    criteria_scores: List[MatchCriteria] = Field(..., description="Detailed scores by criteria")
    strengths: List[str] = Field(..., description="Candidate's strengths for this position")
    gaps: List[str] = Field(..., description="Areas where candidate may need improvement")
    recommendation: str = Field(..., description="Overall recommendation")


# --- AI Matching Function ---

def match_cv_with_job(
    cv_text: str,
    job_title: str,
    job_description: str,
    job_requirements: str,
    job_skills: List[str],
    experience_required: int = 0
) -> MatchResult:
    """
    Analyze CV against job posting and return match percentage with details
    
    Args:
        cv_text: Full text content of the CV
        job_title: Title of the job position
        job_description: Full job description
        job_requirements: Specific requirements for the job
        job_skills: List of required skills
        experience_required: Years of experience required
        
    Returns:
        MatchResult with percentage and detailed analysis
    """
    
    if not _OPENAI_IMPORTED:
        raise ImportError("OpenAI library not installed. Install with: pip install openai")
    
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    
    client = OpenAI(api_key=OPENAI_API_KEY)
    
    # Build the prompt
    prompt = f"""You are an expert HR recruiter and talent matcher. Analyze the following CV against the job posting and provide a detailed match analysis.

JOB POSTING:
Title: {job_title}
Description: {job_description}
Requirements: {job_requirements}
Required Skills: {', '.join(job_skills) if job_skills else 'Not specified'}
Experience Required: {experience_required} years

CANDIDATE CV:
{cv_text}

TASK:
Analyze how well this candidate matches the job requirements. Evaluate the following criteria:
1. Skills Match (technical and soft skills)
2. Experience Level (years and relevance)
3. Education & Qualifications
4. Role Fit (alignment with job responsibilities)
5. Career Trajectory (growth and progression)

Provide:
- An overall match percentage (0-100)
- Individual scores for each criterion with brief explanations
- Top 3-5 strengths of the candidate for this role
- Top 3-5 gaps or areas for improvement
- A brief recommendation (1-2 sentences)

Be objective and realistic in your assessment. A perfect 100% match is rare."""

    try:
        # Call OpenAI API with structured output
        response = client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert HR recruiter specializing in candidate assessment and job matching."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format=MatchResult,
            temperature=0.3,  # Lower temperature for more consistent results
        )
        
        result = response.choices[0].message.parsed
        
        if result is None:
            raise ValueError("Failed to parse AI response")
        
        return result
        
    except Exception as e:
        print(f"Error calling OpenAI API: {e}", file=sys.stderr)
        raise


# --- CLI Interface ---

def main():
    """Command-line interface for CV-Job matching"""
    parser = argparse.ArgumentParser(description="Match CV with Job using AI")
    parser.add_argument("--cv", required=True, help="Path to CV text file or CV text")
    parser.add_argument("--job-title", required=True, help="Job title")
    parser.add_argument("--job-description", required=True, help="Job description")
    parser.add_argument("--job-requirements", default="", help="Job requirements")
    parser.add_argument("--job-skills", default="", help="Comma-separated list of required skills")
    parser.add_argument("--experience", type=int, default=0, help="Years of experience required")
    parser.add_argument("--output", help="Output JSON file path (optional)")
    
    args = parser.parse_args()
    
    # Read CV text
    if os.path.isfile(args.cv):
        with open(args.cv, 'r', encoding='utf-8') as f:
            cv_text = f.read()
    else:
        cv_text = args.cv
    
    # Parse skills
    job_skills = [s.strip() for s in args.job_skills.split(',')] if args.job_skills else []
    
    # Perform matching
    print("Analyzing CV against job posting...", file=sys.stderr)
    result = match_cv_with_job(
        cv_text=cv_text,
        job_title=args.job_title,
        job_description=args.job_description,
        job_requirements=args.job_requirements,
        job_skills=job_skills,
        experience_required=args.experience
    )
    
    # Output result
    result_json = result.model_dump_json(indent=2)
    
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(result_json)
        print(f"Results saved to {args.output}", file=sys.stderr)
    else:
        print(result_json)
    
    print(f"\n✓ Match Score: {result.overall_match_percentage}%", file=sys.stderr)


if __name__ == "__main__":
    main()
