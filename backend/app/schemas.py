from typing import List, Optional, Literal
from pydantic import BaseModel, Field

ComponentType = Literal["activity", "service", "receiver", "provider"]

class ManifestComponent(BaseModel):
    name: str
    type: ComponentType
    exported: bool = False
    permission: Optional[str] = None
    intent_filters: List[str] = Field(default_factory=list)

class ManifestData(BaseModel):
    package_name: str = ""
    min_sdk: Optional[str] = None
    target_sdk: Optional[str] = None
    permissions: List[str] = Field(default_factory=list)
    components: List[ManifestComponent] = Field(default_factory=list)
    debuggable: bool = False
    allow_backup: bool = True
    uses_cleartext_traffic: bool = False

class DecompileStats(BaseModel):
    status: Literal["pending", "decompiling", "complete", "failed"] = "pending"
    method: Literal["jadx", "raw_source", "none"] = "none"
    file_count: int = 0
    time_taken_seconds: float = 0.0
    error: Optional[str] = None

class JobResponse(BaseModel):
    job_id: str
    app_name: str
    file_size_bytes: int
    status: str = "complete"
    manifest: Optional[ManifestData] = None
    decompilation: Optional[DecompileStats] = None
