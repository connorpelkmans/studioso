// UNTESTED: written without compiler access. Add this file to BOTH targets: the App target and the "StudyboardWidgets" widget extension.
// What a Focus timer Live Activity carries (Dynamic Island and Lock Screen). The page sends it through StudyboardFocusActivityPlugin.
import ActivityKit
import Foundation

public struct StudyboardFocusAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var mode: String        // "focus", "short" or "long"
        public var label: String       // "Focus", "Short Break", "Long Break"
        public var task: String        // what the person is working on ("" for none)
        public var startedAt: Date     // start of the current stretch, for the progress bar (running only)
        public var endsAt: Date        // when the running timer reaches 0:00
        public var pausedLeft: Int     // seconds left while paused; 0 while running
        public var total: Int          // the session's full length in seconds
    }
    public var accent: String          // the theme's accent colour, "#RRGGBB"
}
