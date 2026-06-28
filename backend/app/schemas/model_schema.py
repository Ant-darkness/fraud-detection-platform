from pydantic import BaseModel
from typing import Optional


class ModelResponse(BaseModel):

    model_id: int
    model_name: str
    model_version: int
    model_description: Optional[str]
    model_path: str
    dataset_size: int
    activation_status: str
    is_active: bool
    class Config:
        from_attributes = True
