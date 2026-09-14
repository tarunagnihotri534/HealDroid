import os
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Optional

from backend.app.schemas import ManifestData, ManifestComponent

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
        permissions = list(apk.get_permissions() or [])
        
        # Details on components
        components: list[ManifestComponent] = []
        
        # Activities
        for act in apk.get_activities() or []:
            act_clean = _clean_str(act)
            if not act_clean:
                continue
            is_exp = False
            perm = None
            try:
                elem = apk.get_android_element("activity", act_clean)
                if elem is not None:
                    exp_val = elem.get(f"{{{ANDROID_NS}}}exported")
                    if exp_val is not None:
                        is_exp = str(exp_val).lower() in ("true", "1")
                    perm = _clean_str(elem.get(f"{{{ANDROID_NS}}}permission"))
            except Exception:
                pass
            components.append(ManifestComponent(
                name=act_clean,
                type="activity",
                exported=is_exp,
                permission=perm,
            ))
            
        # Services
        for srv in apk.get_services() or []:
            srv_clean = _clean_str(srv)
            if not srv_clean:
                continue
            is_exp = False
            perm = None
            try:
                elem = apk.get_android_element("service", srv_clean)
                if elem is not None:
                    exp_val = elem.get(f"{{{ANDROID_NS}}}exported")
                    if exp_val is not None:
                        is_exp = str(exp_val).lower() in ("true", "1")
                    perm = _clean_str(elem.get(f"{{{ANDROID_NS}}}permission"))
            except Exception:
                pass
            components.append(ManifestComponent(
                name=srv_clean,
                type="service",
                exported=is_exp,
                permission=perm,
            ))

        # Receivers
        for rec in apk.get_receivers() or []:
            rec_clean = _clean_str(rec)
            if not rec_clean:
                continue
            is_exp = False
            perm = None
            try:
                elem = apk.get_android_element("receiver", rec_clean)
                if elem is not None:
                    exp_val = elem.get(f"{{{ANDROID_NS}}}exported")
                    if exp_val is not None:
                        is_exp = str(exp_val).lower() in ("true", "1")
                    perm = _clean_str(elem.get(f"{{{ANDROID_NS}}}permission"))
            except Exception:
                pass
            components.append(ManifestComponent(
                name=rec_clean,
                type="receiver",
                exported=is_exp,
                permission=perm,
            ))

        # Providers
        for prv in apk.get_providers() or []:
            prv_clean = _clean_str(prv)
            if not prv_clean:
                continue
            is_exp = False
            perm = None
            try:
                elem = apk.get_android_element("provider", prv_clean)
                if elem is not None:
                    exp_val = elem.get(f"{{{ANDROID_NS}}}exported")
                    if exp_val is not None:
                        is_exp = str(exp_val).lower() in ("true", "1")
                    perm = _clean_str(elem.get(f"{{{ANDROID_NS}}}permission"))
            except Exception:
                pass
            components.append(ManifestComponent(
                name=prv_clean,
                type="provider",
                exported=is_exp,
                permission=perm,
            ))

        # Flags
        debuggable = False
        allow_backup = True
        uses_cleartext = False
        
        app_elem = None
        try:
            manifest_xml = apk.get_android_manifest_xml()
            if manifest_xml is not None:
                app_elem = manifest_xml.find("application")
        except Exception:
            pass

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

        return ManifestData(
            package_name=pkg,
            min_sdk=min_sdk or None,
            target_sdk=target_sdk or None,
            permissions=permissions,
            components=components,
            debuggable=debuggable,
            allow_backup=allow_backup,
            uses_cleartext_traffic=uses_cleartext
        )
    except Exception:
        return None

def _parse_with_elementtree(xml_bytes: bytes) -> ManifestData:
    root = ET.fromstring(xml_bytes)
    pkg = root.attrib.get("package", "")
    
    uses_sdk = root.find("uses-sdk")
    min_sdk = None
    target_sdk = None
    if uses_sdk is not None:
        min_sdk = uses_sdk.attrib.get(f"{{{ANDROID_NS}}}minSdkVersion")
        target_sdk = uses_sdk.attrib.get(f"{{{ANDROID_NS}}}targetSdkVersion")
        
    permissions = []
    for perm_elem in root.findall("uses-permission"):
        p_name = perm_elem.attrib.get(f"{{{ANDROID_NS}}}name")
        if p_name:
            permissions.append(p_name)
            
    components: list[ManifestComponent] = []
    app_elem = root.find("application")
    debuggable = False
    allow_backup = True
    uses_cleartext = False
    
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
                has_filters = len(elem.findall("intent-filter")) > 0
                
                if exported_attr is not None:
                    exported = exported_attr.lower() in ("true", "1")
                else:
                    # Default in Android: exported if intent-filters exist
                    exported = has_filters
                    
                perm = elem.attrib.get(f"{{{ANDROID_NS}}}permission")
                intent_filters = []
                for ifilter in elem.findall("intent-filter"):
                    for action in ifilter.findall("action"):
                        a_name = action.attrib.get(f"{{{ANDROID_NS}}}name")
                        if a_name:
                            intent_filters.append(a_name)
                            
                components.append(ManifestComponent(
                    name=name,
                    type=comp_type,
                    exported=exported,
                    permission=perm,
                    intent_filters=intent_filters
                ))
                
    return ManifestData(
        package_name=pkg,
        min_sdk=min_sdk,
        target_sdk=target_sdk,
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
