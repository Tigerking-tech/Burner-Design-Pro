from typing import Any, Dict, Optional
import re
from datetime import datetime

class ValidationError(Exception):
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(message)

class InputValidator:
    # SQL injection prevention patterns
    SQL_PATTERNS = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b)",
        r"(--|;|\/\*|\*\/)",
        r"('|;|\\x|--)"
    ]
    
    @staticmethod
    def sanitize_string(value: str, field_name: str, max_length: int = 255) -> str:
        if not isinstance(value, str):
            raise ValidationError(field_name, f"{field_name} must be a string")
        
        if len(value) > max_length:
            raise ValidationError(field_name, f"{field_name} exceeds maximum length of {max_length}")
        
        # Check for SQL injection patterns
        for pattern in InputValidator.SQL_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValidationError(field_name, f"Invalid characters in {field_name}")
        
        return value.strip()
    
    @staticmethod
    def validate_positive_number(value: float, field_name: str, 
                                min_value: float = 0, 
                                max_value: Optional[float] = None) -> float:
        if not isinstance(value, (int, float)):
            raise ValidationError(field_name, f"{field_name} must be a number")
        
        if value < min_value:
            raise ValidationError(field_name, f"{field_name} must be at least {min_value}")
        
        if max_value is not None and value > max_value:
            raise ValidationError(field_name, f"{field_name} must not exceed {max_value}")
        
        return float(value)
    
    @staticmethod
    def validate_percentage(value: float, field_name: str) -> float:
        return InputValidator.validate_positive_number(
            value, field_name, min_value=0, max_value=100
        )
    
    @staticmethod
    def validate_pollutant(value: str) -> str:
        allowed_pollutants = ['NOx', 'CO', 'CO2', 'SOx']
        sanitized = InputValidator.sanitize_string(value.upper(), 'pollutant')
        if sanitized not in allowed_pollutants:
            raise ValidationError('pollutant', 
                f"Invalid pollutant. Allowed: {', '.join(allowed_pollutants)}")
        return sanitized
    
    @staticmethod
    def validate_unit(value: str, allowed_units: list) -> str:
        sanitized = InputValidator.sanitize_string(value, 'unit')
        if sanitized not in allowed_units:
            raise ValidationError('unit', 
                f"Invalid unit. Allowed: {', '.join(allowed_units)}")
        return sanitized
    
    @staticmethod
    def validate_fuel_type(value: str) -> str:
        allowed_fuel_types = [
            'natural_gas_low', 'natural_gas_high', 'diesel_low',
            'heavy_oil_low', 'coal', 'natural_gas', 'heavy_oil', 'solid'
        ]
        sanitized = InputValidator.sanitize_string(value, 'fuel_type')
        if sanitized not in allowed_fuel_types:
            raise ValidationError('fuel_type', 
                f"Invalid fuel type. Allowed: {', '.join(allowed_fuel_types)}")
        return sanitized
    
    @staticmethod
    def validate_pressure_range(value: float, field_name: str) -> float:
        return InputValidator.validate_positive_number(
            value, field_name, min_value=0, max_value=1000000
        )
    
    @staticmethod
    def validate_temperature_range(value: float, field_name: str) -> float:
        if value < -273.15:  # Below absolute zero
            raise ValidationError(field_name, "Temperature cannot be below absolute zero (-273.15°C)")
        if value > 10000:
            raise ValidationError(field_name, "Temperature exceeds reasonable range")
        return float(value)
    
    @staticmethod
    def validate_o2_percentage(value: float) -> float:
        if value < 0 or value > 21:
            raise ValidationError('O2', "O2 percentage must be between 0 and 21")
        return float(value)
    
    @staticmethod
    def validate_load_factor(value: float) -> float:
        if value <= 0 or value > 1:
            raise ValidationError('load_factor', "Load factor must be between 0 and 1")
        return float(value)
    
    @staticmethod
    def validate_annual_hours(value: float) -> float:
        if value < 0 or value > 8760:  # 8760 hours in a year
            raise ValidationError('annual_hours', "Annual hours must be between 0 and 8760")
        return float(value)
