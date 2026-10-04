# UNTESTED. Merge into android/app/proguard-rules.pro (only matters when minifyEnabled is true).
# Capacitor finds plugins by annotation/reflection:
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { @com.getcapacitor.PluginMethod public <methods>; }
-keep class com.studioso.app.capture.StudyboardCaptureTokenPlugin { *; }
-keep class com.studioso.app.capture.StudyboardSharedQueuePlugin { *; }
# Entry points the system instantiates by name (manifest) and AppFunctions classes (generated code refers to them):
-keep class com.studioso.app.capture.ShareReceiverActivity { *; }
-keep class com.studioso.app.capture.QuickCaptureTileService { *; }
-keep class com.studioso.app.capture.StudyboardAppFunctions { *; }
-keep class com.studioso.app.capture.StudyboardApplication { *; }
# org.json and the AndroidKeyStore are platform classes: nothing to keep. Never add -keepattributes that would retain log strings with tokens.
