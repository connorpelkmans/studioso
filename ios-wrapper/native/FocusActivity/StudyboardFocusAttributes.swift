// UNTESTED: written without compiler access
import ActivityKit
import Foundation

// The app itself supports iOS versions older than Live Activities, so the model says when it exists
@available(iOS 16.1, *)
public struct StudyboardFocusAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var mode: String
        public var label: String
        public var task: String
        public var startedAt: Date
        public var endsAt: Date
        public var pausedLeft: Int
        public var total: Int
    }
    public var accent: String
}
