import { ManifestData, ManifestComponent, ComponentType } from "./types";

interface AxmlAttribute {
  ns: string;
  name: string;
  rawValue: string | null;
  typedValue: any;
}

interface AxmlNode {
  tag: string;
  attributes: Record<string, any>;
  children: AxmlNode[];
}

/**
 * Android Binary XML (AXML) Parser
 */
export class AxmlParser {
  private buffer: Buffer;
  private offset: number = 0;
  private stringPool: string[] = [];

  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  public parse(): AxmlNode | null {
    if (this.buffer.length < 8) return null;

    // Check magic number
    const magic = this.buffer.readUInt32LE(0);
    if (magic !== 0x00080003) {
      return null;
    }

    this.offset = 8;
    let rootNode: AxmlNode | null = null;
    const nodeStack: AxmlNode[] = [];

    while (this.offset < this.buffer.length) {
      const chunkType = this.buffer.readUInt32LE(this.offset);
      const chunkSize = this.buffer.readUInt32LE(this.offset + 4);

      if (chunkSize <= 0 || this.offset + chunkSize > this.buffer.length + 8) {
        break;
      }

      switch (chunkType) {
        case 0x00010001: {
          // String Pool
          this.parseStringPool(this.offset);
          break;
        }
        case 0x00100102: {
          // START_ELEMENT
          const node = this.parseStartElement(this.offset);
          if (node) {
            if (nodeStack.length > 0) {
              nodeStack[nodeStack.length - 1].children.push(node);
            } else {
              rootNode = node;
            }
            nodeStack.push(node);
          }
          break;
        }
        case 0x00100103: {
          // END_ELEMENT
          if (nodeStack.length > 0) {
            nodeStack.pop();
          }
          break;
        }
        default:
          break;
      }

      this.offset += chunkSize;
    }

    return rootNode;
  }

  private parseStringPool(chunkStart: number) {
    const stringCount = this.buffer.readUInt32LE(chunkStart + 8);
    const flags = this.buffer.readUInt32LE(chunkStart + 16);
    const stringsStart = chunkStart + this.buffer.readUInt32LE(chunkStart + 20);
    const isUtf8 = (flags & (1 << 8)) !== 0;

    const stringOffsets: number[] = [];
    for (let i = 0; i < stringCount; i++) {
      stringOffsets.push(this.buffer.readUInt32LE(chunkStart + 28 + i * 4));
    }

    this.stringPool = [];
    for (let i = 0; i < stringCount; i++) {
      const strPos = stringsStart + stringOffsets[i];
      if (strPos >= this.buffer.length) {
        this.stringPool.push("");
        continue;
      }

      if (isUtf8) {
        let p = strPos;
        // Skip length byte(s)
        if ((this.buffer[p] & 0x80) !== 0) p += 2;
        else p += 1;
        let u8Len = this.buffer[p];
        if ((u8Len & 0x80) !== 0) {
          u8Len = ((u8Len & 0x7f) << 8) | this.buffer[p + 1];
          p += 2;
        } else {
          p += 1;
        }
        const str = this.buffer.toString("utf8", p, p + u8Len);
        this.stringPool.push(str);
      } else {
        // UTF-16LE
        let p = strPos;
        let u16Len = this.buffer.readUInt16LE(p);
        p += 2;
        if ((u16Len & 0x8000) !== 0) {
          u16Len = ((u16Len & 0x7fff) << 16) | this.buffer.readUInt16LE(p);
          p += 2;
        }
        const str = this.buffer.toString("utf16le", p, p + u16Len * 2);
        this.stringPool.push(str);
      }
    }
  }

  private parseStartElement(chunkStart: number): AxmlNode | null {
    const nameIdx = this.buffer.readUInt32LE(chunkStart + 20);
    const tagName = this.stringPool[nameIdx] || "unknown";

    const attrCount = this.buffer.readUInt16LE(chunkStart + 28);
    const attrStart = chunkStart + 36;

    const attributes: Record<string, any> = {};

    for (let i = 0; i < attrCount; i++) {
      const aPos = attrStart + i * 20;
      if (aPos + 20 > this.buffer.length) break;

      const attrNameIdx = this.buffer.readUInt32LE(aPos + 4);
      const rawValIdx = this.buffer.readInt32LE(aPos + 8);
      const type = this.buffer.readUInt32LE(aPos + 12) >> 24;
      const data = this.buffer.readUInt32LE(aPos + 16);

      const attrName = this.stringPool[attrNameIdx] || `attr_${i}`;
      let val: any = null;

      if (rawValIdx >= 0 && rawValIdx < this.stringPool.length) {
        val = this.stringPool[rawValIdx];
      } else if (type === 0x12) {
        // TYPE_INT_BOOLEAN
        val = data !== 0;
      } else if (type === 0x10 || type === 0x11) {
        // TYPE_INT_DEC or TYPE_INT_HEX
        val = data;
      } else if (type === 0x01) {
        // TYPE_REFERENCE
        val = `@0x${data.toString(16)}`;
      } else if (type === 0x03) {
        // TYPE_STRING
        val = this.stringPool[data] || String(data);
      } else {
        val = data;
      }

      attributes[attrName] = val;
    }

    return {
      tag: tagName,
      attributes,
      children: [],
    };
  }
}

/**
 * Plain XML Parser (for uncompiled test APK manifests)
 */
function parsePlainXml(xmlText: string): ManifestData {
  const pkgMatch = xmlText.match(/package\s*=\s*["']([^"']+)["']/i);
  const pkg = pkgMatch ? pkgMatch[1] : "";

  const minSdkMatch = xmlText.match(/android:minSdkVersion\s*=\s*["']?(\d+)["']?/i);
  const min_sdk = minSdkMatch ? minSdkMatch[1] : null;

  const targetSdkMatch = xmlText.match(/android:targetSdkVersion\s*=\s*["']?(\d+)["']?/i);
  const target_sdk = targetSdkMatch ? targetSdkMatch[1] : null;
  const target_sdk_version = target_sdk ? parseInt(target_sdk, 10) : null;

  // Permissions
  const permissions: string[] = [];
  const permRegex = /<uses-permission[^>]+android:name\s*=\s*["']([^"']+)["'][^>]*\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = permRegex.exec(xmlText)) !== null) {
    permissions.push(match[1]);
  }

  // Application attributes
  const appMatch = xmlText.match(/<application\b([^>]*)>/i);
  const appAttrs = appMatch ? appMatch[1] : "";

  const debuggableMatch = appAttrs.match(/android:debuggable\s*=\s*["'](true|false|1|0)["']/i);
  const debuggable = debuggableMatch ? debuggableMatch[1].toLowerCase() === "true" || debuggableMatch[1] === "1" : false;

  const allowBackupMatch = appAttrs.match(/android:allowBackup\s*=\s*["'](true|false|1|0)["']/i);
  const allow_backup = allowBackupMatch ? allowBackupMatch[1].toLowerCase() !== "false" && allowBackupMatch[1] !== "0" : true;

  const cleartextMatch = appAttrs.match(/android:usesCleartextTraffic\s*=\s*["'](true|false|1|0)["']/i);
  const uses_cleartext_traffic = cleartextMatch ? cleartextMatch[1].toLowerCase() === "true" || cleartextMatch[1] === "1" : false;

  const nscMatch = appAttrs.match(/android:networkSecurityConfig\s*=\s*["']([^"']+)["']/i);
  const network_security_config = nscMatch ? nscMatch[1] : null;

  // Components: activity, service, receiver, provider
  const components: ManifestComponent[] = [];
  const compTags: ComponentType[] = ["activity", "service", "receiver", "provider"];

  for (const tag of compTags) {
    const blockRegex = new RegExp(`<${tag}\\b([\\s\\S]*?)(?:\\/>|<\\/${tag}>)`, "gi");
    let compBlock: RegExpExecArray | null;
    while ((compBlock = blockRegex.exec(xmlText)) !== null) {
      const content = compBlock[1];
      const nameMatch = content.match(/android:name\s*=\s*["']([^"']+)["']/i);
      const name = nameMatch ? nameMatch[1] : "";

      const expMatch = content.match(/android:exported\s*=\s*["'](true|false|1|0)["']/i);
      const permMatch = content.match(/android:permission\s*=\s*["']([^"']+)["']/i);
      const permission = permMatch ? permMatch[1] : null;

      const intentFilters: string[] = [];
      const actionRegex = /<action[^>]+android:name\s*=\s*["']([^"']+)["'][^>]*\/?>/gi;
      let actMatch: RegExpExecArray | null;
      while ((actMatch = actionRegex.exec(content)) !== null) {
        intentFilters.push(actMatch[1]);
      }

      const hasIntentFilters = intentFilters.length > 0 || /<intent-filter\b/i.test(content);
      let exported = false;
      if (expMatch) {
        exported = expMatch[1].toLowerCase() === "true" || expMatch[1] === "1";
      } else {
        exported = hasIntentFilters;
      }

      components.push({
        name,
        type: tag,
        exported,
        permission,
        intent_filters: intentFilters,
      });
    }
  }

  return {
    package_name: pkg,
    min_sdk,
    target_sdk,
    target_sdk_version,
    network_security_config,
    permissions,
    components,
    debuggable,
    allow_backup,
    uses_cleartext_traffic,
  };
}

/**
 * Manifest parsing from Binary AXML DOM Node
 */
function parseAxmlNode(root: AxmlNode): ManifestData {
  const pkg = root.attributes["package"] || "";

  let min_sdk: string | null = null;
  let target_sdk: string | null = null;
  let target_sdk_version: number | null = null;
  let network_security_config: string | null = null;
  const permissions: string[] = [];
  const components: ManifestComponent[] = [];
  let debuggable = false;
  let allow_backup = true;
  let uses_cleartext_traffic = false;

  const compTypeMap: Record<string, ComponentType> = {
    activity: "activity",
    service: "service",
    receiver: "receiver",
    provider: "provider",
  };

  function traverse(node: AxmlNode) {
    if (node.tag === "uses-sdk") {
      const min = node.attributes["minSdkVersion"];
      if (min !== undefined) min_sdk = String(min);
      const target = node.attributes["targetSdkVersion"];
      if (target !== undefined) {
        target_sdk = String(target);
        const parsed = parseInt(target_sdk, 10);
        if (!isNaN(parsed)) target_sdk_version = parsed;
      }
    } else if (node.tag === "uses-permission") {
      const p = node.attributes["name"];
      if (p) permissions.push(String(p));
    } else if (node.tag === "application") {
      if (node.attributes["debuggable"] !== undefined) {
        debuggable = Boolean(node.attributes["debuggable"]);
      }
      if (node.attributes["allowBackup"] !== undefined) {
        allow_backup = Boolean(node.attributes["allowBackup"]);
      }
      if (node.attributes["usesCleartextTraffic"] !== undefined) {
        uses_cleartext_traffic = Boolean(node.attributes["usesCleartextTraffic"]);
      }
      if (node.attributes["networkSecurityConfig"] !== undefined) {
        network_security_config = String(node.attributes["networkSecurityConfig"]);
      }
    } else if (compTypeMap[node.tag]) {
      const cType = compTypeMap[node.tag];
      const name = String(node.attributes["name"] || "");
      const expAttr = node.attributes["exported"];
      const permission = node.attributes["permission"] ? String(node.attributes["permission"]) : null;

      const intentFilters: string[] = [];
      for (const child of node.children) {
        if (child.tag === "intent-filter") {
          for (const ifChild of child.children) {
            if (ifChild.tag === "action" && ifChild.attributes["name"]) {
              intentFilters.push(String(ifChild.attributes["name"]));
            }
          }
        }
      }

      let exported = false;
      if (expAttr !== undefined) {
        exported = Boolean(expAttr);
      } else {
        exported = intentFilters.length > 0 || node.children.some((c) => c.tag === "intent-filter");
      }

      components.push({
        name,
        type: cType,
        exported,
        permission,
        intent_filters: intentFilters,
      });
    }

    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(root);

  return {
    package_name: pkg,
    min_sdk,
    target_sdk,
    target_sdk_version,
    network_security_config,
    permissions,
    components,
    debuggable,
    allow_backup,
    uses_cleartext_traffic,
  };
}

/**
 * Universal Manifest Parser: Handles Binary AXML and Plain Text XML.
 */
export function parseManifestBuffer(buffer: Buffer): ManifestData {
  // 1. Check if binary AXML
  if (buffer.length >= 4 && buffer.readUInt32LE(0) === 0x00080003) {
    try {
      const axml = new AxmlParser(buffer);
      const root = axml.parse();
      if (root) {
        return parseAxmlNode(root);
      }
    } catch (e) {
      console.warn("Binary AXML parsing encountered an error, attempting XML text fallback", e);
    }
  }

  // 2. Fallback: Parse as UTF-8 XML string
  const xmlText = buffer.toString("utf8");
  return parsePlainXml(xmlText);
}
