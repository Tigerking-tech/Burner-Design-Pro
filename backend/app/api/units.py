from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import Dict, List
from app.services.unit_converter import (
    get_categories,
    get_units,
    convert,
    convert_all
)
from app.security.validator import InputValidator, ValidationError

router = APIRouter(prefix="/api/units", tags=["units"])

class ConvertRequest(BaseModel):
    value: float
    from_unit: str
    to_unit: str
    category: str
    
    @field_validator('value')
    @classmethod
    def validate_value(cls, v):
        if v < -1e10 or v > 1e10:
            raise ValueError('Value exceeds reasonable range')
        return v
    
    @field_validator('from_unit', 'to_unit', 'category')
    @classmethod
    def validate_strings(cls, v):
        if not v or len(v) > 50:
            raise ValueError('Invalid string length')
        return InputValidator.sanitize_string(v, v)

class ConvertAllRequest(BaseModel):
    value: float
    from_unit: str
    category: str
    
    @field_validator('value')
    @classmethod
    def validate_value(cls, v):
        if v < -1e10 or v > 1e10:
            raise ValueError('Value exceeds reasonable range')
        return v
    
    @field_validator('from_unit', 'category')
    @classmethod
    def validate_strings(cls, v):
        if not v or len(v) > 50:
            raise ValueError('Invalid string length')
        return InputValidator.sanitize_string(v, v)

@router.get("/categories")
def list_categories() -> Dict[str, List[Dict]]:
    categories = get_categories()
    result = {}
    for category in categories:
        result[category] = [
            {"name": unit}
            for unit in get_units(category)
        ]
    return result

@router.post("/convert")
def convert_value(request: ConvertRequest) -> Dict:
    try:
        # Validate units exist in category
        valid_units = get_units(request.category)
        if not valid_units:
            raise ValidationError('category', f'Invalid category: {request.category}')
        
        if request.from_unit not in valid_units:
            raise ValidationError('from_unit', f'Invalid unit for category: {request.from_unit}')
        
        if request.to_unit not in valid_units:
            raise ValidationError('to_unit', f'Invalid unit for category: {request.to_unit}')
        
        result = convert(
            request.value,
            request.from_unit,
            request.to_unit,
            request.category
        )
        return {
            "result": result,
            "from_value": request.value,
            "from_unit": request.from_unit,
            "to_unit": request.to_unit,
            "category": request.category
        }
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid conversion request")

@router.post("/convert-all")
def convert_all_units(request: ConvertAllRequest) -> Dict:
    try:
        # Validate category exists
        valid_units = get_units(request.category)
        if not valid_units:
            raise ValidationError('category', f'Invalid category: {request.category}')
        
        if request.from_unit not in valid_units:
            raise ValidationError('from_unit', f'Invalid unit for category: {request.from_unit}')
        
        results = convert_all(
            request.value,
            request.from_unit,
            request.category
        )
        return {
            "results": results,
            "from_value": request.value,
            "from_unit": request.from_unit,
            "category": request.category
        }
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid conversion request")
