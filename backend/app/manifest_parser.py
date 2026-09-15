import os
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Optional, List

from loguru import logger
logger.remove()
logger.add(sys.stderr, level="WARNING")

from backend.app.models import ManifestData, ManifestComponent

ANDROID_NS = "http://schemas.android.com/apk/res/android"
NS_MAP = {"android": ANDROID_NS}

def _clean_str(val: Optional[str]) -> Optional[str]:
    if val is None:
        return None
    s = str(val).strip()
    if s.startswith("b'") and s.endswith("'"):
        s = s[2:-1]
    if s.startswith('b"') and s.endswith('"'):
        s = s[1:-1]
    return s

def _parse_with_androguard(apk_path: str | Path) -> Optional[ManifestData]:
    try:
        from androguard.core.apk import APK
        apk = APK(str(apk_path))
        if not apk.is_valid_APK():
            return None
            
        pkg = apk.get_package() or ""
        min_sdk = str(apk.get_min_sdk_version() or "")
        target_sdk = str(apk.get_target_sdk_version() or "")
        target_sdk_version = int(target_sdk) if target_sdk and target_sdk.isdigit() else None
        
        permissions = list(apk.get_permissions() or [])
        components: List[ManifestComponent] = []
        
        manifest_xml = apk.get_android_manifest_xml()
        app_elem = manifest_xml.find("application") if manifest_xml is not None else None
        
        debuggable = False
        allow_backup = True
        uses_cleartext = False
        network_sec_config: Optional[str] = None
        
        if app_elem is not None:
            dbg = app_elem.get(f"{{{ANDROID_NS}}}debuggable")
            if dbg is not None:
                debuggable = str(dbg).lower() in ("true", "1")
                
            ab = app_elem.get(f"{{{ANDROID_NS}}}allowBackup")
            if ab is not None:
                allow_backup = str(ab).lower() not in ("false", "0")
                
            ct = app_elem.get(f"{{{ANDROID_NS}}}usesCleartextTraffic")
            if ct is not None:
                uses_cleartext = str(ct).lower() in ("true", "1")
                
            nsc = app_elem.get(f"{{{ANDROID_NS}}}networkSecurityConfig")
            if nsc is not None:
                network_sec_config = _clean_str(nsc)

            tag_type_map = {
                "activity": "activity",
                "service": "service",
                "receiver": "receiver",
                "provider": "provider"
            }
            
            for tag, comp_type in tag_type_map.items():
                for elem in app_elem.findall(tag):
                    name = _clean_str(elem.get(f"{{{ANDROID_NS}}}name")) or ""
                    exp_val = elem.get(f"{{{ANDROID_NS}}}exported")
                    perm = _clean_str(elem.get(f"{{{ANDROID_NS}}}permission"))
                    grant_uri_val = elem.get(f"{{{ANDROID_NS}}}grantUriPermissions")
                    grant_uri = str(grant_uri_val).lower() in ("true", "1") if grant_uri_val is not None else False
                    
                    intent_filters: List[str] = []
                    categories: List[str] = []
                    data_schemes: List[str] = []
                    data_hosts: List[str] = []
                    auto_verify = False

                    for ifilter in elem.findall("intent-filter"):
                        av_val = ifilter.get(f"{{{ANDROID_NS}}}autoVerify")
                        if av_val is not None and str(av_val).lower() in ("true", "1"):
                            auto_verify = True
                        for action in ifilter.findall("action"):
                            a_name = _clean_str(action.get(f"{{{ANDROID_NS}}}name"))
                            if a_name:
                                intent_filters.append(a_name)
                        for cat in ifilter.findall("category"):
                            c_name = _clean_str(cat.get(f"{{{ANDROID_NS}}}name"))
                            if c_name:
                                categories.append(c_name)
                        for data in ifilter.findall("data"):
                            s_name = _clean_str(data.get(f"{{{ANDROID_NS}}}scheme"))
                            if s_name:
                                data_schemes.append(s_name)
                            h_name = _clean_str(data.get(f"{{{ANDROID_NS}}}host"))
                            if h_name:
                                data_hosts.append(h_name)
                                
                    has_filters = len(intent_filters) > 0 or len(elem.findall("intent-filter")) > 0
                    if exp_val is not None:
                        exported = str(exp_val).lower() in ("true", "1")
                    else:
                        exported = has_filters
                        
                    components.append(ManifestComponent(
                        name=name,
                        type=comp_type,
                        exported=exported,
                        permission=perm,
                        intent_filters=intent_filters,
                        categories=categories,
                        data_schemes=data_schemes,
                        data_hosts=data_hosts,
                        auto_verify=auto_verify,
                        grant_uri_permissions=grant_uri
                    ))

        return ManifestData(
            package_name=pkg,
            min_sdk=min_sdk or None,
            target_sdk=target_sdk or None,
            target_sdk_version=target_sdk_version,
            network_security_config=network_sec_config,
            permissions=permissions,
            components=components,
            debuggable=debuggable,
            allow_backup=allow_backup,
            uses_cleartext_traffic=uses_cleartext
        )
    except Exception as e:
        logger.warning(f"Androguard parsing failed: {e}")
        return None

def _parse_with_elementtree(xml_bytes: bytes) -> ManifestData:
    root = ET.fromstring(xml_bytes)
    pkg = root.attrib.get("package", "")
    
    uses_sdk = root.find("uses-sdk")
    min_sdk = None
    target_sdk = None
    target_sdk_version = None
    if uses_sdk is not None:
        min_sdk = uses_sdk.attrib.get(f"{{{ANDROID_NS}}}minSdkVersion")
        target_sdk = uses_sdk.attrib.get(f"{{{ANDROID_NS}}}targetSdkVersion")
        if target_sdk and target_sdk.isdigit():
            target_sdk_version = int(target_sdk)
        
    permissions = []
    for perm_elem in root.findall("uses-permission"):
        p_name = perm_elem.attrib.get(f"{{{ANDROID_NS}}}name")
        if p_name:
            permissions.append(p_name)
            
    components: List[ManifestComponent] = []
    app_elem = root.find("application")
    debuggable = False
    allow_backup = True
    uses_cleartext = False
    network_sec_config = None
    
    if app_elem is not None:
        dbg = app_elem.attrib.get(f"{{{ANDROID_NS}}}debuggable")
        if dbg is not None:
            debuggable = dbg.lower() in ("true", "1")
            
        ab = app_elem.attrib.get(f"{{{ANDROID_NS}}}allowBackup")
        if ab is not None:
            allow_backup = ab.lower() not in ("false", "0")
            
        ct = app_elem.attrib.get(f"{{{ANDROID_NS}}}usesCleartextTraffic")
        if ct is not None:
            uses_cleartext = ct.lower() in ("true", "1")
            
        nsc = app_elem.attrib.get(f"{{{ANDROID_NS}}}networkSecurityConfig")
        if nsc is not None:
            network_sec_config = nsc
            
        tag_type_map = {
            "activity": "activity",
            "service": "service",
            "receiver": "receiver",
            "provider": "provider"
        }
        
        for tag, comp_type in tag_type_map.items():
            for elem in app_elem.findall(tag):
                name = elem.attrib.get(f"{{{ANDROID_NS}}}name") or ""
                exported_attr = elem.attrib.get(f"{{{ANDROID_NS}}}exported")
                grant_uri_attr = elem.attrib.get(f"{{{ANDROID_NS}}}grantUriPermissions")
                grant_uri = grant_uri_attr.lower() in ("true", "1") if grant_uri_attr is not None else False
                
                intent_filters = []
                categories = []
                data_schemes = []
                data_hosts = []
                auto_verify = False

                for ifilter in elem.findall("intent-filter"):
                    av_attr = ifilter.attrib.get(f"{{{ANDROID_NS}}}autoVerify")
                    if av_attr is not None and av_attr.lower() in ("true", "1"):
                        auto_verify = True
                    for action in ifilter.findall("action"):
                        a_name = action.attrib.get(f"{{{ANDROID_NS}}}name")
                        if a_name:
                            intent_filters.append(a_name)
                    for cat in ifilter.findall("category"):
                        c_name = cat.attrib.get(f"{{{ANDROID_NS}}}name")
                        if c_name:
                            categories.append(c_name)
                    for data in ifilter.findall("data"):
                        s_name = data.attrib.get(f"{{{ANDROID_NS}}}scheme")
                        if s_name:
                            data_schemes.append(s_name)
                        h_name = data.attrib.get(f"{{{ANDROID_NS}}}host")
                        if h_name:
                            data_hosts.append(h_name)
                
                has_filters = len(intent_filters) > 0 or len(elem.findall("intent-filter")) > 0
                if exported_attr is not None:
                    exported = exported_attr.lower() in ("true", "1")
                else:
                    exported = has_filters
                    
                perm = elem.attrib.get(f"{{{ANDROID_NS}}}permission")
                            
                components.append(ManifestComponent(
                    name=name,
                    type=comp_type,
                    exported=exported,
                    permission=perm,
                    intent_filters=intent_filters,
                    categories=categories,
                    data_schemes=data_schemes,
                    data_hosts=data_hosts,
                    auto_verify=auto_verify,
                    grant_uri_permissions=grant_uri
                ))
                
    return ManifestData(
        package_name=pkg,
        min_sdk=min_sdk,
        target_sdk=target_sdk,
        target_sdk_version=target_sdk_version,
        network_security_config=network_sec_config,
        permissions=permissions,
        components=components,
        debuggable=debuggable,
        allow_backup=allow_backup,
        uses_cleartext_traffic=uses_cleartext
    )

def parse_manifest(apk_path: str | Path) -> ManifestData:
    """
    Dual-mode parser:
    1. Try Androguard binary AXML parser (standard compiled APKs).
    2. Fallback to raw ElementTree if the APK contains plain XML AndroidManifest.xml.
    """
    apk_path = Path(apk_path)
    res = _parse_with_androguard(apk_path)
    if res and res.package_name:
        return res
        
    # ElementTree fallback from zip
    with zipfile.ZipFile(apk_path, "r") as z:
        manifest_name = None
        for name in z.namelist():
            if name.endswith("AndroidManifest.xml"):
                manifest_name = name
                break
        if not manifest_name:
            raise ValueError(f"AndroidManifest.xml not found in {apk_path}")
            
        xml_bytes = z.read(manifest_name)
        return _parse_with_elementtree(xml_bytes)
