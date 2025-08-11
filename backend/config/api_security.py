# api_security.py - Industry-grade API security

from django.middleware.security import SecurityMiddleware
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings
from rest_framework.throttling import BaseThrottle
from rest_framework import status
import hashlib
import time
import json
import re
from datetime import datetime, timedelta
import logging

logger = logging.getLogger('security')

# 1. ADVANCED RATE LIMITING
class CustomRateThrottle(BaseThrottle):
    """Custom rate limiting with different rules per endpoint"""
    
    RATE_LIMITS = {
        'login': {'requests': 5, 'window': 300},      # 5 requests per 5 minutes
        'password_reset': {'requests': 3, 'window': 3600},  # 3 requests per hour
        'api_general': {'requests': 1000, 'window': 3600},  # 1000 requests per hour
        'file_upload': {'requests': 10, 'window': 600},     # 10 uploads per 10 minutes
    }
    
    def allow_request(self, request, view):
        """Check if request is allowed based on rate limits"""
        if not self.should_throttle(request, view):
            return True
        
        throttle_key = self.get_throttle_key(request, view)
        if not throttle_key:
            return True
        
        rate_limit = self.get_rate_limit(request, view)
        if not rate_limit:
            return True
        
        current_time = time.time()
        cache_key = f"throttle:{throttle_key}"
        
        # Get current request history
        history = cache.get(cache_key, [])
        
        # Remove old requests outside the window
        window_start = current_time - rate_limit['window']
        history = [req_time for req_time in history if req_time > window_start]
        
        # Check if we're within the limit
        if len(history) >= rate_limit['requests']:
            return False
        
        # Add current request and save
        history.append(current_time)
        cache.set(cache_key, history, rate_limit['window'])
        
        return True
    
    def get_throttle_key(self, request, view):
        """Get unique throttle key for the request"""
        if request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        
        endpoint = self.get_endpoint_type(request)
        return f"{endpoint}:{ident}"
    
    def get_endpoint_type(self, request):
        """Determine endpoint type for rate limiting"""
        path = request.path.lower()
        
        if 'login' in path:
            return 'login'
        elif 'password' in path and 'reset' in path:
            return 'password_reset'
        elif 'upload' in path or request.content_type.startswith('multipart'):
            return 'file_upload'
        else:
            return 'api_general'
    
    def get_rate_limit(self, request, view):
        """Get rate limit for the endpoint"""
        endpoint_type = self.get_endpoint_type(request)
        return self.RATE_LIMITS.get(endpoint_type, self.RATE_LIMITS['api_general'])

# 2. REQUEST VALIDATION MIDDLEWARE
class RequestValidationMiddleware:
    """Validate and sanitize incoming requests"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.max_request_size = 10 * 1024 * 1024  # 10MB
        self.blocked_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'vbscript:',
            r'onload\s*=',
            r'onerror\s*=',
            r'<iframe[^>]*>.*?</iframe>',
        ]
    
    def __call__(self, request):
        # Check request size
        if hasattr(request, 'content_length') and request.content_length > self.max_request_size:
            return JsonResponse({
                'error': 'Request too large'
            }, status=413)
        
        # Validate request content
        if not self.validate_request_content(request):
            logger.warning(f"Blocked malicious request from {self.get_client_ip(request)}")
            return JsonResponse({
                'error': 'Invalid request content'
            }, status=400)
        
        response = self.get_response(request)
        return response
    
    def validate_request_content(self, request):
        """Validate request content for malicious patterns"""
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                if hasattr(request, 'body') and request.body:
                    content = request.body.decode('utf-8', errors='ignore')
                    
                    for pattern in self.blocked_patterns:
                        if re.search(pattern, content, re.IGNORECASE):
                            return False
            except:
                pass
        
        return True
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

# 3. API AUTHENTICATION SECURITY
class EnhancedJWTAuthentication:
    """Enhanced JWT authentication with security features"""
    
    def __init__(self):
        self.failed_attempts = {}
        self.max_attempts = 5
        self.lockout_duration = 900  # 15 minutes
    
    def authenticate(self, request):
        """Authenticate with additional security checks"""
        client_ip = self.get_client_ip(request)
        
        # Check if IP is locked out
        if self.is_ip_locked_out(client_ip):
            return None
        
        # Standard JWT authentication
        try:
            # Your existing JWT authentication logic here
            user = self.validate_token(request)
            
            if user:
                # Reset failed attempts on successful auth
                self.reset_failed_attempts(client_ip)
                return user
            else:
                self.record_failed_attempt(client_ip)
                return None
                
        except Exception as e:
            self.record_failed_attempt(client_ip)
            logger.warning(f"Authentication failed for IP {client_ip}: {str(e)}")
            return None
    
    def is_ip_locked_out(self, ip):
        """Check if IP is locked out due to failed attempts"""
        cache_key = f"failed_auth:{ip}"
        attempts = cache.get(cache_key, [])
        
        # Remove old attempts
        current_time = time.time()
        recent_attempts = [
            attempt for attempt in attempts 
            if current_time - attempt < self.lockout_duration
        ]
        
        return len(recent_attempts) >= self.max_attempts
    
    def record_failed_attempt(self, ip):
        """Record failed authentication attempt"""
        cache_key = f"failed_auth:{ip}"
        attempts = cache.get(cache_key, [])
        attempts.append(time.time())
        cache.set(cache_key, attempts, self.lockout_duration)
    
    def reset_failed_attempts(self, ip):
        """Reset failed attempts for IP"""
        cache_key = f"failed_auth:{ip}"
        cache.delete(cache_key)

# 4. INPUT SANITIZATION
class InputSanitizer:
    """Sanitize user inputs to prevent attacks"""
    
    @staticmethod
    def sanitize_string(value, max_length=None):
        """Sanitize string input"""
        if not isinstance(value, str):
            return str(value)
        
        # Remove potentially dangerous characters
        sanitized = re.sub(r'[<>"\']', '', value)
        
        # Limit length
        if max_length:
            sanitized = sanitized[:max_length]
        
        return sanitized.strip()
    
    @staticmethod
    def sanitize_email(email):
        """Sanitize and validate email"""
        if not email:
            return None
        
        email = email.lower().strip()
        
        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return None
        
        return email
    
    @staticmethod
    def sanitize_phone(phone):
        """Sanitize phone number"""
        if not phone:
            return None
        
        # Remove all non-digit characters except +
        phone = re.sub(r'[^\d+]', '', phone)
        
        return phone if len(phone) >= 10 else None

# 5. CORS SECURITY ENHANCEMENT
ENHANCED_CORS_SETTINGS = {
    'CORS_ALLOW_CREDENTIALS': True,
    'CORS_ALLOWED_ORIGINS': [
        'https://wholesome-endurance-production.up.railway.app',
        'http://localhost:3000',  # Remove in production
    ],
    'CORS_ALLOWED_ORIGIN_REGEXES': [
        r"^https://.*\.up\.railway\.app$",
    ],
    'CORS_ALLOW_HEADERS': [
        'accept',
        'accept-encoding',
        'authorization',
        'content-type',
        'dnt',
        'origin',
        'user-agent',
        'x-csrftoken',
        'x-requested-with',
    ],
    'CORS_ALLOWED_METHODS': [
        'DELETE',
        'GET',
        'OPTIONS',
        'PATCH',
        'POST',
        'PUT',
    ],
    'CORS_PREFLIGHT_MAX_AGE': 3600,
}

# 6. API LOGGING AND MONITORING
class APISecurityLogger:
    """Enhanced logging for API security events"""
    
    @staticmethod
    def log_security_event(event_type, request, details=None):
        """Log security-related events"""
        client_ip = APISecurityLogger.get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
        
        log_data = {
            'timestamp': datetime.now().isoformat(),
            'event_type': event_type,
            'client_ip': client_ip,
            'user_agent': user_agent,
            'path': request.path,
            'method': request.method,
            'user_id': request.user.id if request.user.is_authenticated else None,
            'details': details or {}
        }
        
        logger.warning(f"Security Event: {json.dumps(log_data)}")
    
    @staticmethod
    def get_client_ip(request):
        """Get real client IP"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

# 7. FILE UPLOAD SECURITY
class SecureFileUploadValidator:
    """Secure file upload validation"""
    
    ALLOWED_EXTENSIONS = {
        'images': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        'documents': ['.pdf', '.doc', '.docx', '.txt'],
        'spreadsheets': ['.xls', '.xlsx', '.csv'],
    }
    
    DANGEROUS_EXTENSIONS = [
        '.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js', '.jar',
        '.php', '.asp', '.jsp', '.html', '.htm', '.xml'
    ]
    
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    @classmethod
    def validate_file(cls, uploaded_file, file_type='documents'):
        """Validate uploaded file"""
        errors = []
        
        # Check file size
        if uploaded_file.size > cls.MAX_FILE_SIZE:
            errors.append(f"File too large. Maximum size is {cls.MAX_FILE_SIZE // (1024*1024)}MB")
        
        # Check file extension
        file_name = uploaded_file.name.lower()
        file_ext = '.' + file_name.split('.')[-1] if '.' in file_name else ''
        
        # Check if extension is dangerous
        if file_ext in cls.DANGEROUS_EXTENSIONS:
            errors.append(f"File type not allowed: {file_ext}")
        
        # Check if extension is in allowed list
        allowed_exts = cls.ALLOWED_EXTENSIONS.get(file_type, [])
        if allowed_exts and file_ext not in allowed_exts:
            errors.append(f"File type not allowed. Allowed types: {', '.join(allowed_exts)}")
        
        # Check file content (magic bytes)
        if not cls.validate_file_content(uploaded_file, file_ext):
            errors.append("File content doesn't match extension")
        
        return errors
    
    @staticmethod
    def validate_file_content(uploaded_file, expected_ext):
        """Validate file content matches extension"""
        try:
            # Read first few bytes to check magic numbers
            uploaded_file.seek(0)
            file_header = uploaded_file.read(10)
            uploaded_file.seek(0)
            
            # Magic number validation
            magic_numbers = {
                '.pdf': b'%PDF',
                '.jpg': b'\xff\xd8\xff',
                '.jpeg': b'\xff\xd8\xff',
                '.png': b'\x89PNG',
                '.gif': b'GIF',
            }
            
            expected_magic = magic_numbers.get(expected_ext)
            if expected_magic:
                return file_header.startswith(expected_magic)
            
            return True  # Allow if we don't have magic number check
            
        except Exception:
            return False

# 8. API RESPONSE SECURITY
class SecureAPIResponse:
    """Secure API response handling"""
    
    @staticmethod
    def sanitize_response_data(data):
        """Sanitize response data to prevent information leakage"""
        if isinstance(data, dict):
            sanitized = {}
            for key, value in data.items():
                # Remove sensitive fields from responses
                if key.lower() in ['password', 'secret', 'token', 'key', 'hash']:
                    continue
                
                sanitized[key] = SecureAPIResponse.sanitize_response_data(value)
            return sanitized
        
        elif isinstance(data, list):
            return [SecureAPIResponse.sanitize_response_data(item) for item in data]
        
        elif isinstance(data, str):
            # Remove potential XSS payloads
            return data.replace('<', '&lt;').replace('>', '&gt;')
        
        return data
    
    @staticmethod
    def add_security_headers(response):
        """Add security headers to API responses"""
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
        return response

# 9. INTRUSION DETECTION
class IntrusionDetectionSystem:
    """Basic intrusion detection system"""
    
    def __init__(self):
        self.suspicious_patterns = [
            r'union\s+select',
            r'drop\s+table',
            r'insert\s+into',
            r'delete\s+from',
            r'<script',
            r'javascript:',
            r'eval\s*\(',
            r'exec\s*\(',
        ]
        
        self.alert_threshold = 5  # Alert after 5 suspicious requests
    
    def analyze_request(self, request):
        """Analyze request for suspicious patterns"""
        suspicious_score = 0
        detected_patterns = []
        
        # Check URL parameters
        for key, value in request.GET.items():
            for pattern in self.suspicious_patterns:
                if re.search(pattern, value, re.IGNORECASE):
                    suspicious_score += 1
                    detected_patterns.append(f"GET:{key}:{pattern}")
        
        # Check POST data
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                body = request.body.decode('utf-8', errors='ignore')
                for pattern in self.suspicious_patterns:
                    if re.search(pattern, body, re.IGNORECASE):
                        suspicious_score += 1
                        detected_patterns.append(f"BODY:{pattern}")
            except:
                pass
        
        if suspicious_score >= self.alert_threshold:
            self.trigger_security_alert(request, detected_patterns)
        
        return suspicious_score
    
    def trigger_security_alert(self, request, patterns):
        """Trigger security alert"""
        client_ip = self.get_client_ip(request)
        
        alert_data = {
            'ip': client_ip,
            'patterns': patterns,
            'user_agent': request.META.get('HTTP_USER_AGENT'),
            'path': request.path,
            'timestamp': datetime.now().isoformat()
        }
        
        logger.critical(f"INTRUSION DETECTED: {json.dumps(alert_data)}")
        
        # Could also send email alert, webhook, etc.
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

# 10. SECURITY TESTING UTILITIES
class SecurityTestUtils:
    """Utilities for security testing"""
    
    @staticmethod
    def test_sql_injection(client, endpoint, params):
        """Test SQL injection vulnerabilities"""
        sql_payloads = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'/*",
            "' UNION SELECT NULL--",
        ]
        
        results = []
        for payload in sql_payloads:
            test_params = params.copy()
            for key in test_params:
                test_params[key] = payload
                
                response = client.get(endpoint, test_params)
                
                # Check if payload caused error or unexpected behavior
                if response.status_code == 500:
                    results.append({
                        'payload': payload,
                        'parameter': key,
                        'status': 'VULNERABLE',
                        'response_code': response.status_code
                    })
        
        return results
    
    @staticmethod
    def test_xss_vulnerabilities(client, endpoint, params):
        """Test XSS vulnerabilities"""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<img src=x onerror=alert('XSS')>",
            "';alert('XSS');//",
        ]
        
        results = []
        for payload in xss_payloads:
            test_params = params.copy()
            for key in test_params:
                test_params[key] = payload
                
                response = client.get(endpoint, test_params)
                
                # Check if payload is reflected in response
                if payload in response.content.decode():
                    results.append({
                        'payload': payload,
                        'parameter': key,
                        'status': 'VULNERABLE'
                    })
        
        return results
