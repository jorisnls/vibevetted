from models.scan import Finding
from openai import OpenAI
import dotenv
import os

dotenv.load_dotenv()
client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def explain_findings(findings: list[Finding]) -> list[Finding]:
    findings.sort(key=lambda f: SEVERITY_ORDER.get(f.severity.value, 99))

    for finding in findings[:25]:
        prompt = f"""
        You are a security expert helping indie hackers understand and fix security issues in their vibe-coded apps.

        Explain this finding concisely in English (max 150 words total):

        Tool: {finding.tool}
        Severity: {finding.severity}
        Title: {finding.title}
        Description: {finding.description}
        File: {finding.file_path}
        Line: {finding.line_number}
        CWE: {finding.cwe}

        Respond in EXACTLY this format:

        **What's wrong:** [1-2 sentences]

        **How to fix it:** [Concrete fix, with code snippet if applicable]

        **Why it matters:** [1 sentence on why vibe-coded apps often have this]
        """

        try:
            response = client.responses.create(
            model='gpt-5.4-mini-2026-03-17',
            input=prompt
            )
            finding.fix_explanation = response.output_text
        except Exception:
            finding.fix_explanation = 'Explanation unavailable'

    return findings
