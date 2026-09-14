from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

SeverityLevel = Literal["critical", "high", "medium", "low"]
ComponentType = Literal["activity", "service", "receiver", "provider"]

class Finding(BaseModel):
    id: str
    severity: SeverityLevel
    title: str
    owasp_category: str
    location: str
    evidence: str
    remediation: str

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
    target_sdk_version: Optional[int] = None
    network_security_config: Optional[str] = None
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
    decompilation_incomplete: bool = False
    decompilation_warnings: List[str] = Field(default_factory=list)

class ReportSummary(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0

class Report(BaseModel):
    app_name: str
    score: int
    grade: Literal["A", "B", "C", "D", "F"]
    decompilation_incomplete: bool = False
    decompilation_warnings: List[str] = Field(default_factory=list)
    findings: List[Finding] = Field(default_factory=list)
    summary: ReportSummary = Field(default_factory=ReportSummary)

class JobResponse(BaseModel):
    job_id: str
    app_name: str
    file_size_bytes: int = 0
    status: Literal["processing", "complete", "failed", "partial"] = "processing"
    score: int = 100
    grade: Literal["A", "B", "C", "D", "F"] = "A"
    decompilation_incomplete: bool = False
    decompilation_warnings: List[str] = Field(default_factory=list)
    findings: List[Finding] = Field(default_factory=list)
    summary: ReportSummary = Field(default_factory=ReportSummary)
    manifest: Optional[ManifestData] = None
    decompilation: Optional[DecompileStats] = None
    error: Optional[str] = None
