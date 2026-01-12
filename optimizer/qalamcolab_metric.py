"""
QalamColabMetric: Weighted Quality Metric for SanadFlow Study Hub

Evaluates generated code across multiple dimensions:
1. Test Passage (40%) - Does the code pass functional tests?
2. Arabic RTL Quality (30%) - Does it handle RTL text correctly?
3. Error Handling (15%) - Does it have robust error handling?
4. Code Structure (15%) - Does it follow TypeScript/React best practices?

This enables GEPA/COPRO to distinguish between "barely passing" and
"production-quality" code, creating a meaningful Pareto frontier.
"""

import re
from typing import Optional, Any, List, Tuple
import dspy


class ScoreWithFeedback:
    """Helper class to return score and feedback."""
    def __init__(self, score: float, feedback: str):
        self.score = float(score)
        self.feedback = feedback

    def __float__(self):
        return self.score

    def __add__(self, other):
        return self.score + float(other)

    def __radd__(self, other):
        return self.score + float(other)

    def __lt__(self, other):
        return self.score < float(other)

    def __gt__(self, other):
        return self.score > float(other)

    def __le__(self, other):
        return self.score <= float(other)

    def __ge__(self, other):
        return self.score >= float(other)

    def __repr__(self):
        return f"ScoreWithFeedback(score={self.score}, feedback='{self.feedback[:50]}...')"


class QalamColabMetric:
    """
    Weighted metric for SanadFlow Study Hub code quality.
    
    Scoring Breakdown:
    - Test Passage: 40% (binary: pass/fail)
    - RTL Quality: 30% (0-100% based on pattern matching)
    - Error Handling: 15% (0-100% based on try/catch, validation)
    - Code Structure: 15% (0-100% based on TypeScript patterns)
    """
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self._compile_patterns()
    
    def _compile_patterns(self):
        """Compile regex patterns for quality checks."""
        # RTL patterns
        self.rtl_patterns = {
            'dir_attribute': re.compile(r'dir\s*=\s*["\']rtl["\']', re.IGNORECASE),
            'unicode_bidi': re.compile(r'unicode-bidi\s*:\s*plaintext', re.IGNORECASE),
            'text_align_right': re.compile(r'text-align\s*:\s*right', re.IGNORECASE),
            'rtl_css_class': re.compile(r'\.rtl\s*\{|className.*rtl', re.IGNORECASE),
            'direction_rtl': re.compile(r'direction\s*:\s*rtl', re.IGNORECASE),
        }
        
        # Error handling patterns
        self.error_patterns = {
            'try_catch': re.compile(r'try\s*\{.*?catch\s*\(', re.DOTALL),
            'error_type': re.compile(r':\s*Error\b|throw\s+new\s+Error', re.IGNORECASE),
            'input_validation': re.compile(r'if\s*\(.*?(!|==|===).*?(null|undefined|empty|length)', re.IGNORECASE),
            'apollo_error': re.compile(r'ApolloError|GraphQLError', re.IGNORECASE),
        }
        
        # Code structure patterns
        self.structure_patterns = {
            'typescript_interface': re.compile(r'interface\s+\w+\s*\{', re.IGNORECASE),
            'typescript_type': re.compile(r'type\s+\w+\s*=', re.IGNORECASE),
            'exports': re.compile(r'export\s+(default\s+)?(function|const|class|interface|type)', re.IGNORECASE),
            'async_await': re.compile(r'async\s+\w+|await\s+\w+', re.IGNORECASE),
            'jsdoc': re.compile(r'/\*\*.*?\*/', re.DOTALL),
        }
    
    def __call__(
        self,
        example: dspy.Example,
        prediction: dspy.Prediction,
        trace: Optional[Any] = None
    ) -> ScoreWithFeedback:
        """
        Evaluate code quality across all dimensions.
        
        Returns:
            ScoreWithFeedback: Weighted score (0.0-1.0) + detailed feedback
        """
        code = getattr(prediction, 'code_patch', '')
        
        if not code or not code.strip():
            return ScoreWithFeedback(
                score=0.0,
                feedback="ERROR: No code generated"
            )
        
        # Dimension 1: Test Passage (40%)
        test_score = self._check_test_passage(prediction)
        
        # Dimension 2: Arabic RTL Quality (30%)
        rtl_score = self._check_rtl_quality(code)
        
        # Dimension 3: Error Handling (15%)
        error_score = self._check_error_handling(code)
        
        # Dimension 4: Code Structure (15%)
        structure_score = self._check_code_structure(code)
        
        # Calculate weighted total
        dimensions = [
            ('test_passage', test_score, 0.40),
            ('rtl_quality', rtl_score, 0.30),
            ('error_handling', error_score, 0.15),
            ('code_structure', structure_score, 0.15),
        ]
        
        total_score = sum(score * weight for _, score, weight in dimensions)
        feedback = self._format_feedback(dimensions, code)
        
        return ScoreWithFeedback(
            score=total_score,
            feedback=feedback
        )
    
    def _check_test_passage(self, prediction: dspy.Prediction) -> float:
        """Check if tests passed (binary 0.0 or 1.0)."""
        # This assumes prediction.test_results exists (from GeminiSkillAdapter)
        test_results = getattr(prediction, 'test_results', '{}')
        
        try:
            import json
            data = json.loads(test_results)
            return 1.0 if data.get('success', False) else 0.0
        except:
            # If no test results, assume tests not run = fail
            return 0.0
    
    def _check_rtl_quality(self, code: str) -> float:
        """
        Check Arabic RTL handling quality (0.0-1.0).
        
        Checks:
        - dir="rtl" attribute
        - unicode-bidi: plaintext
        - text-align: right
        - direction: rtl
        - RTL CSS classes
        """
        checks = []
        
        # Check 1: Has dir="rtl" attribute
        has_dir_attr = bool(self.rtl_patterns['dir_attribute'].search(code))
        checks.append(('dir="rtl"', 1.0 if has_dir_attr else 0.0))
        
        # Check 2: Has unicode-bidi
        has_unicode_bidi = bool(self.rtl_patterns['unicode_bidi'].search(code))
        checks.append(('unicode-bidi', 1.0 if has_unicode_bidi else 0.5))
        
        # Check 3: Has text-align or direction
        has_text_align = bool(self.rtl_patterns['text_align_right'].search(code))
        has_direction = bool(self.rtl_patterns['direction_rtl'].search(code))
        checks.append(('text-align/direction', 1.0 if (has_text_align or has_direction) else 0.3))
        
        # Check 4: Has RTL CSS class or className
        has_rtl_class = bool(self.rtl_patterns['rtl_css_class'].search(code))
        checks.append(('RTL CSS', 1.0 if has_rtl_class else 0.5))
        
        # Average score
        score = sum(s for _, s in checks) / len(checks) if checks else 0.0
        return score
    
    def _check_error_handling(self, code: str) -> float:
        """
        Check error handling quality (0.0-1.0).
        
        Checks:
        - try/catch blocks
        - Error types defined
        - Input validation
        - Apollo/GraphQL error handling
        """
        checks = []
        
        # Check 1: Has try/catch
        has_try_catch = bool(self.error_patterns['try_catch'].search(code))
        checks.append(('try/catch', 1.0 if has_try_catch else 0.0))
        
        # Check 2: Has Error types
        has_error_type = bool(self.error_patterns['error_type'].search(code))
        checks.append(('Error types', 1.0 if has_error_type else 0.5))
        
        # Check 3: Has input validation
        has_validation = bool(self.error_patterns['input_validation'].search(code))
        checks.append(('Input validation', 1.0 if has_validation else 0.5))
        
        # Check 4: Apollo/GraphQL error handling
        has_apollo_error = bool(self.error_patterns['apollo_error'].search(code))
        checks.append(('Apollo errors', 1.0 if has_apollo_error else 0.7))
        
        score = sum(s for _, s in checks) / len(checks) if checks else 0.0
        return score
    
    def _check_code_structure(self, code: str) -> float:
        """
        Check TypeScript/React code structure (0.0-1.0).
        
        Checks:
        - TypeScript interfaces
        - Type definitions
        - Exports
        - Async/await
        - JSDoc comments
        """
        checks = []
        
        # Check 1: Has TypeScript interfaces or types
        has_interface = bool(self.structure_patterns['typescript_interface'].search(code))
        has_type = bool(self.structure_patterns['typescript_type'].search(code))
        checks.append(('TypeScript types', 1.0 if (has_interface or has_type) else 0.3))
        
        # Check 2: Has exports
        has_exports = bool(self.structure_patterns['exports'].search(code))
        checks.append(('Exports', 1.0 if has_exports else 0.0))
        
        # Check 3: Uses async/await
        has_async = bool(self.structure_patterns['async_await'].search(code))
        checks.append(('Async/await', 1.0 if has_async else 0.6))
        
        # Check 4: Has JSDoc comments
        has_jsdoc = bool(self.structure_patterns['jsdoc'].search(code))
        checks.append(('JSDoc', 1.0 if has_jsdoc else 0.5))
        
        score = sum(s for _, s in checks) / len(checks) if checks else 0.0
        return score
    
    def _format_feedback(self, dimensions: List[Tuple[str, float, float]], code: str) -> str:
        """Format detailed feedback for GEPA reflection."""
        lines = ["Code Quality Breakdown:"]
        
        for name, score, weight in dimensions:
            percentage = score * 100
            weighted = score * weight * 100
            emoji = "✓" if score >= 0.8 else "△" if score >= 0.5 else "✗"
            lines.append(
                f"  {emoji} {name:20s}: {percentage:5.1f}% (weighted: {weighted:5.1f}%)"
            )
        
        total = sum(score * weight for _, score, weight in dimensions) * 100
        lines.append(f"\n  TOTAL SCORE: {total:.1f}%")
        
        # Add specific recommendations if score < 75%
        if total < 75:
            lines.append("\nRecommendations:")
            
            rtl_score = dimensions[1][1]
            if rtl_score < 0.7:
                lines.append("  → Add dir=\"rtl\" and unicode-bidi: plaintext for Arabic text")
            
            error_score = dimensions[2][1]
            if error_score < 0.7:
                lines.append("  → Add try/catch blocks and input validation")
            
            structure_score = dimensions[3][1]
            if structure_score < 0.7:
                lines.append("  → Define TypeScript interfaces and add JSDoc comments")
        
        return "\n".join(lines)
