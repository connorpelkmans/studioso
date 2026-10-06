# UNTESTED. Merge into android/app/proguard-rules.pro (only matters when minifyEnabled is true).
# Capacitor finds plugins by annotation/reflection:
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { @com.getcapacitor.PluginMethod public <methods>; }
-keep class com.studioso.app.capture.StudyboardCaptureTokenPlugin { *; }
-keep class com.studioso.app.capture.StudyboardSharedQueuePlugin { *; }
# Entry points the system instantiates by name (manifest):
-keep class com.studioso.app.capture.ShareReceiverActivity { *; }
-keep class com.studioso.app.capture.QuickCaptureTileService { *; }
# RevenueCat and @capacitor/push-notifications ship their own consumer rules; nothing to add for them.
# org.json and the AndroidKeyStore are platform classes: nothing to keep. Never add -keepattributes that would retain log strings with tokens.
