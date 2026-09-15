import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  ActivityIndicator,
} from "react-native";
import {
  Shield,
  Upload,
  FileText,
  List,
  BookOpen,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Terminal,
  RefreshCw,
  Search,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from "lucide-react-native";

// ── DESIGN TOKENS (EXACT MATCH) ────────────────────────────────────────────────
const T = {
  bg: "#F2F4F8",
  white: "#FFFFFF",
  surf2: "#F8F9FB",
  border: "#E4E7EC",
  text1: "#101828",
  text2: "#344054",
  text3: "#667085",
  text4: "#98A2B3",
  accent: "#13B8A6",
  accentBg: "rgba(19,184,166,0.08)",
  accentRing: "rgba(19,184,166,0.25)",
  critical: "#F04438",
  critBg: "rgba(240,68,56,0.08)",
  high: "#F79009",
  highBg: "rgba(247,144,9,0.08)",
  medium: "#EAB308",
  medBg: "rgba(234,179,8,0.08)",
  low: "#98A2B3",
  lowBg: "rgba(152,162,179,0.1)",
  success: "#13B8A6",
};

type Severity = "critical" | "high" | "medium" | "low";
type Screen = "upload" | "processing" | "report" | "findings" | "rules";

interface FindingItem {
  id: string;
  severity: Severity;
  title: string;
  owasp_category: string;
  location: string;
  evidence: string;
  remediation: string;
}

const SAMPLE_FINDINGS: FindingItem[] = [
  {
    id: "SECRET_AWS_KEY",
    severity: "critical",
    title: "Hardcoded AWS Access Key",
    owasp_category: "M9: Reverse Engineering",
    location: "src/com/test/vulnerableapp/AuthManager.java",
    evidence: "Found AWS access key matching pattern: AKIA1111222233334444",
    remediation: "Do not hardcode cloud credentials in client binaries. Obtain short-lived STS session tokens dynamically from a trusted backend.",
  },
  {
    id: "MANIFEST_DEBUGGABLE",
    severity: "critical",
    title: "Application Is Debuggable",
    owasp_category: "M1: Improper Platform Usage",
    location: "AndroidManifest.xml",
    evidence: "android:debuggable is set to 'true' in the application manifest.",
    remediation: "Disable debuggable in production release variants inside build.gradle (debuggable false).",
  },
  {
    id: "SECRET_JWT",
    severity: "high",
    title: "Hardcoded JWT Token",
    owasp_category: "M2: Insecure Data Storage",
    location: "src/com/test/vulnerableapp/AuthManager.java",
    evidence: "Found hardcoded JWT token structure in static field.",
    remediation: "Never embed static JWT tokens into APK binaries. Fetch short-lived tokens from authentication endpoint at runtime.",
  },
  {
    id: "WEAK_CRYPTO_DES",
    severity: "high",
    title: "Weak Cryptographic Algorithm: DES/3DES",
    owasp_category: "M5: Insufficient Cryptography",
    location: "src/com/test/vulnerableapp/CryptoService.java",
    evidence: "Usage of weak DES/3DES cipher detected: Cipher.getInstance(\"DES/ECB/PKCS5Padding\")",
    remediation: "Upgrade from DES/3DES to authenticated AES-256 in GCM mode (AES/GCM/NoPadding).",
  },
];

interface AuthUser {
  name: string;
  email: string;
  role: string;
}

function AuthScreen({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setError("");
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (isSignUp && !name) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({
        name: isSignUp ? name : (email.split("@")[0] || "Security Auditor"),
        email: email,
        role: "Lead Security Auditor",
      });
    }, 400);
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({
        name: "Tarun Agnihotri",
        email: "tarun.security@healdroid.io",
        role: "Lead Mobile SAST Auditor",
      });
    }, 250);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={T.white} />
      <ScrollView contentContainerStyle={styles.authContainer}>
        <View style={styles.authCard}>
          {/* Logo */}
          <View style={styles.authLogoBadge}>
            <Shield size={32} color={T.white} />
          </View>

          <View style={styles.authPill}>
            <Text style={styles.authPillText}>HEALDROID MOBILE PORTAL</Text>
          </View>

          <Text style={styles.authTitle}>
            {isSignUp ? "Create Auditor Account" : "Access Security Portal"}
          </Text>
          <Text style={styles.authSubtitle}>
            {isSignUp
              ? "Register to start running static APK vulnerability assessments."
              : "Sign in to access decompilation workspaces and reports."}
          </Text>

          {/* Toggle */}
          <View style={styles.authTabRow}>
            <TouchableOpacity
              style={[styles.authTabBtn, !isSignUp && styles.authTabBtnActive]}
              onPress={() => { setIsSignUp(false); setError(""); }}
            >
              <Text style={[styles.authTabText, !isSignUp && styles.authTabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authTabBtn, isSignUp && styles.authTabBtnActive]}
              onPress={() => { setIsSignUp(true); setError(""); }}
            >
              <Text style={[styles.authTabText, isSignUp && styles.authTabTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Inputs */}
          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name / Organization</Text>
              <View style={styles.inputWrapper}>
                <User size={16} color={T.text4} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Tarun Agnihotri"
                  placeholderTextColor={T.text4}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Auditor Email</Text>
            <View style={styles.inputWrapper}>
              <Mail size={16} color={T.text4} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="name@company.com"
                placeholderTextColor={T.text4}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Security Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={16} color={T.text4} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { paddingRight: 40 }]}
                placeholder="••••••••••••"
                placeholderTextColor={T.text4}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} color={T.text4} /> : <Eye size={16} color={T.text4} />}
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={14} color={T.critical} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.primaryAuthBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={T.white} />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.primaryBtnText}>
                  {isSignUp ? "Create Auditor Account" : "Sign In to Scanner"}
                </Text>
                <ArrowRight size={16} color={T.white} />
              </View>
            )}
          </TouchableOpacity>

          {/* 1-Click Demo Access */}
          <View style={styles.orDivider}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR INSTANT ACCESS</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity
            style={styles.demoAuthBtn}
            onPress={handleDemoLogin}
          >
            <Sparkles size={16} color={T.accent} />
            <Text style={styles.demoBtnText}>Enter as Security Auditor (1-Click Demo)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.authFooter}>
          <Shield size={12} color={T.accent} />
          <Text style={styles.authFooterText}>256-Bit Encrypted Session · ISO 27001 & OWASP Aligned</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [screen, setScreen] = useState<Screen>("upload");
  const [selectedFinding, setSelectedFinding] = useState<FindingItem | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  const navItems = [
    { label: "Upload", icon: Upload, screen: "upload" as Screen },
    { label: "Report", icon: FileText, screen: "report" as Screen },
    { label: "Findings", icon: List, screen: "findings" as Screen },
    { label: "Rules", icon: BookOpen, screen: "rules" as Screen },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={T.white} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Shield size={20} color={T.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>HealDroid</Text>
            <Text style={styles.headerSubtitle}>Static APK Security Engine</Text>
          </View>
        </View>

        <View style={styles.enginePill}>
          <View style={styles.greenDot} />
          <Text style={styles.engineText}>Engine Ready</Text>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {screen === "upload" && (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.heroCard}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>OWASP MOBILE TOP 10 SAST</Text>
              </View>
              <Text style={styles.heroTitle}>Autonomous APK Vulnerability Scanner</Text>
              <Text style={styles.heroDesc}>
                Static analysis pipeline with manifest parsing, decompilation, and automated remediation generation.
              </Text>

              {/* Upload Dropzone Box */}
              <TouchableOpacity
                style={styles.dropzone}
                onPress={() => {
                  setScreen("processing");
                  setTimeout(() => setScreen("report"), 2500);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.uploadIconContainer}>
                  <Upload size={28} color={T.accent} />
                </View>
                <Text style={styles.dropzoneTitle}>Select or Drop APK File</Text>
                <Text style={styles.dropzoneSub}>Supports Android .apk binaries up to 500 MB</Text>
                <View style={styles.uploadButton}>
                  <Text style={styles.uploadButtonText}>Analyze Sample Vulnerable APK</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Quick Metrics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>20+</Text>
                <Text style={styles.metricLabel}>OWASP Rules</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>100%</Text>
                <Text style={styles.metricLabel}>Offline Ready</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricVal}>0s</Text>
                <Text style={styles.metricLabel}>Setup Time</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {screen === "processing" && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={T.accent} style={{ marginBottom: 20 }} />
            <Text style={styles.procTitle}>Decompiling & Scanning APK...</Text>
            <Text style={styles.procSub}>Evaluating binary manifest, DEX bytecode, and code heuristics</Text>
          </View>
        )}

        {screen === "report" && (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Score Card */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreRow}>
                <View>
                  <Text style={styles.scoreLabel}>OVERALL SECURITY GRADE</Text>
                  <Text style={styles.scoreValue}>Grade F (0/100)</Text>
                  <Text style={styles.scoreDesc}>Severe security vulnerabilities detected requiring immediate remediation.</Text>
                </View>
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeText}>F</Text>
                </View>
              </View>

              {/* Severity Breakdown */}
              <View style={styles.sevRow}>
                <View style={[styles.sevPill, { backgroundColor: T.critBg }]}>
                  <Text style={[styles.sevText, { color: T.critical }]}>4 Critical</Text>
                </View>
                <View style={[styles.sevPill, { backgroundColor: T.highBg }]}>
                  <Text style={[styles.sevText, { color: T.high }]}>12 High</Text>
                </View>
                <View style={[styles.sevPill, { backgroundColor: T.medBg }]}>
                  <Text style={[styles.sevText, { color: T.medium }]}>16 Medium</Text>
                </View>
              </View>
            </View>

            {/* Findings List */}
            <Text style={styles.sectionTitle}>Detected Vulnerabilities ({SAMPLE_FINDINGS.length})</Text>
            {SAMPLE_FINDINGS.map((finding) => (
              <TouchableOpacity
                key={finding.id}
                style={styles.findingCard}
                onPress={() => setSelectedFinding(finding)}
              >
                <View style={styles.findingHeader}>
                  <View
                    style={[
                      styles.findingSevBadge,
                      { backgroundColor: finding.severity === "critical" ? T.critBg : T.highBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.findingSevText,
                        { color: finding.severity === "critical" ? T.critical : T.high },
                      ]}
                    >
                      {finding.severity.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.findingOwasp}>{finding.owasp_category}</Text>
                </View>
                <Text style={styles.findingTitle}>{finding.title}</Text>
                <Text style={styles.findingLoc}>{finding.location}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {screen === "findings" && (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.sectionTitle}>All Security Findings</Text>
            {SAMPLE_FINDINGS.map((finding) => (
              <TouchableOpacity
                key={finding.id}
                style={styles.findingCard}
                onPress={() => setSelectedFinding(finding)}
              >
                <Text style={styles.findingTitle}>{finding.title}</Text>
                <Text style={styles.findingLoc}>{finding.location}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {screen === "rules" && (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.sectionTitle}>Active Security Rules (20+ Enabled)</Text>
            <View style={styles.ruleCard}>
              <Text style={styles.ruleTitle}>SECRET_AWS_KEY</Text>
              <Text style={styles.ruleDesc}>Detects hardcoded Amazon AWS Access Keys (AKIA...) embedded in source files.</Text>
            </View>
            <View style={styles.ruleCard}>
              <Text style={styles.ruleTitle}>MANIFEST_DEBUGGABLE</Text>
              <Text style={styles.ruleDesc}>Flags android:debuggable="true" which exposes the runtime to remote debugger attachment.</Text>
            </View>
            <View style={styles.ruleCard}>
              <Text style={styles.ruleTitle}>INSECURE_TRUST_ALL_CERTS</Text>
              <Text style={styles.ruleDesc}>Detects TrustManager / HostnameVerifier implementations disabling TLS certificate checks.</Text>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Finding Detail Modal */}
      <Modal visible={selectedFinding !== null} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedFinding?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedFinding(null)}>
                <X size={24} color={T.text2} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 16 }}>
              <Text style={styles.modalSubHead}>LOCATION</Text>
              <Text style={styles.modalText}>{selectedFinding?.location}</Text>

              <Text style={[styles.modalSubHead, { marginTop: 14 }]}>EVIDENCE</Text>
              <View style={styles.codeSnippet}>
                <Text style={styles.codeText}>{selectedFinding?.evidence}</Text>
              </View>

              <Text style={[styles.modalSubHead, { marginTop: 14 }]}>REMEDIATION GUIDANCE</Text>
              <Text style={styles.modalText}>{selectedFinding?.remediation}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Floating Bottom Nav (Spotlight Nav) */}
      <View style={styles.navBar}>
        {navItems.map((item, idx) => {
          const isActive = screen === item.screen;
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.navButton, isActive && styles.navButtonActive]}
              onPress={() => setScreen(item.screen)}
            >
              <Icon size={18} color={isActive ? T.accent : T.text3} />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.white,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: T.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: T.text1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: T.text3,
  },
  enginePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: T.accentBg,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.accent,
  },
  engineText: {
    fontSize: 11,
    fontWeight: "600",
    color: T.accent,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  heroCard: {
    backgroundColor: T.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 16,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: T.accentBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: T.accent,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: T.text1,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    color: T.text3,
    lineHeight: 18,
    marginBottom: 16,
  },
  dropzone: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: T.accent,
    backgroundColor: T.surf2,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  uploadIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: T.accentBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  dropzoneTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: T.text1,
    marginBottom: 4,
  },
  dropzoneSub: {
    fontSize: 12,
    color: T.text3,
    marginBottom: 14,
  },
  uploadButton: {
    backgroundColor: T.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: T.white,
    fontSize: 13,
    fontWeight: "600",
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: T.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
  },
  metricVal: {
    fontSize: 18,
    fontWeight: "700",
    color: T.text1,
  },
  metricLabel: {
    fontSize: 11,
    color: T.text3,
    marginTop: 2,
  },
  processingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  procTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: T.text1,
    marginBottom: 6,
  },
  procSub: {
    fontSize: 13,
    color: T.text3,
    textAlign: "center",
  },
  scoreCard: {
    backgroundColor: T.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: T.text3,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "700",
    color: T.critical,
    marginBottom: 4,
  },
  scoreDesc: {
    fontSize: 12,
    color: T.text3,
    maxWidth: 220,
    lineHeight: 16,
  },
  gradeBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.critBg,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeText: {
    fontSize: 24,
    fontWeight: "800",
    color: T.critical,
  },
  sevRow: {
    flexDirection: "row",
    gap: 8,
  },
  sevPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sevText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: T.text1,
    marginBottom: 12,
  },
  findingCard: {
    backgroundColor: T.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 10,
  },
  findingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  findingSevBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  findingSevText: {
    fontSize: 10,
    fontWeight: "700",
  },
  findingOwasp: {
    fontSize: 11,
    color: T.text3,
  },
  findingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: T.text1,
    marginBottom: 4,
  },
  findingLoc: {
    fontSize: 11,
    fontFamily: "monospace",
    color: T.text3,
  },
  ruleCard: {
    backgroundColor: T.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 10,
  },
  ruleTitle: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
    color: T.text1,
    marginBottom: 4,
  },
  ruleDesc: {
    fontSize: 12,
    color: T.text3,
    lineHeight: 16,
  },
  navBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    backgroundColor: T.white,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    justifyContent: "space-around",
  },
  navButton: {
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  navButtonActive: {
    backgroundColor: T.accentBg,
  },
  navLabel: {
    fontSize: 10,
    color: T.text3,
    marginTop: 2,
    fontWeight: "500",
  },
  navLabelActive: {
    color: T.accent,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: T.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: T.text1,
    maxWidth: "85%",
  },
  modalSubHead: {
    fontSize: 11,
    fontWeight: "700",
    color: T.text3,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalText: {
    fontSize: 13,
    color: T.text2,
    lineHeight: 18,
  },
  codeSnippet: {
    backgroundColor: "#1E293B",
    borderRadius: 8,
    padding: 12,
  },
  codeText: {
    color: "#E2E8F0",
    fontFamily: "monospace",
    fontSize: 12,
  },
  authContainer: {
    padding: 20,
    paddingTop: 30,
    flexGrow: 1,
    justifyContent: "space-between",
  },
  authCard: {
    backgroundColor: T.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
  },
  authLogoBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: T.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  authPill: {
    backgroundColor: T.accentBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  authPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: T.accent,
    letterSpacing: 0.5,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: T.text1,
    textAlign: "center",
    marginBottom: 4,
  },
  authSubtitle: {
    fontSize: 12,
    color: T.text3,
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 16,
  },
  authTabRow: {
    flexDirection: "row",
    backgroundColor: T.surf2,
    borderRadius: 12,
    padding: 4,
    width: "100%",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  authTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  authTabBtnActive: {
    backgroundColor: T.white,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  authTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: T.text3,
  },
  authTabTextActive: {
    color: T.text1,
    fontWeight: "700",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: T.text2,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.surf2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: T.text1,
  },
  eyeBtn: {
    padding: 4,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: T.critBg,
    padding: 10,
    borderRadius: 8,
    width: "100%",
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    color: T.critical,
  },
  primaryAuthBtn: {
    backgroundColor: T.accent,
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: T.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  primaryBtnText: {
    color: T.white,
    fontSize: 14,
    fontWeight: "700",
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: T.border,
  },
  orText: {
    fontSize: 10,
    fontWeight: "700",
    color: T.text4,
    marginHorizontal: 10,
  },
  demoAuthBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    backgroundColor: T.white,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: T.text1,
  },
  authFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
  },
  authFooterText: {
    fontSize: 11,
    color: T.text4,
  },
});
