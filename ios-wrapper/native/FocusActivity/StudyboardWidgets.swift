// UNTESTED: written without compiler access. Widget extension target ("StudyboardWidgets", File > New > Target > Widget Extension,
// with "Include Live Activity" ticked; replace the generated Swift files with this one). Also add StudyboardFocusAttributes.swift to this target.
//
// The Focus timer in the Dynamic Island (iPhone 14 Pro and later) and on the Lock Screen (every iPhone on iOS 16.2+):
//   compact:  tomato | 24:59      minimal: tomato      expanded: mode, countdown, what you're working on, progress
// The countdown runs by itself (Text(timerInterval:)), so the app doesn't need to be open or send updates every second.
import ActivityKit
import SwiftUI
import WidgetKit

@main
struct StudyboardWidgets: WidgetBundle {
    var body: some Widget { StudyboardFocusLiveActivity() }
}

private extension Color {
    init(hex: String) {
        var v: UInt64 = 0
        Scanner(string: String(hex.dropFirst())).scanHexInt64(&v)
        self.init(red: Double((v >> 16) & 0xFF) / 255, green: Double((v >> 8) & 0xFF) / 255, blue: Double(v & 0xFF) / 255)
    }
}

private let tomatoRed = Color(red: 0.90, green: 0.33, blue: 0.24)
private let leafGreen = Color(red: 0.24, green: 0.66, blue: 0.40)

private func tint(_ s: StudyboardFocusAttributes.ContentState) -> Color { s.mode == "focus" ? tomatoRed : leafGreen }
private func clock(_ secs: Int) -> String { String(format: "%d:%02d", secs / 60, secs % 60) }

/// The time left: counts down by itself while running, a fixed time (and "Paused") while paused.
private struct TimeLeft: View {
    let s: StudyboardFocusAttributes.ContentState
    var body: some View {
        if s.pausedLeft > 0 {
            Text(clock(s.pausedLeft)).monospacedDigit()
        } else {
            Text(timerInterval: s.startedAt...s.endsAt, countsDown: true).monospacedDigit()
        }
    }
}

private struct Tomato: View {
    let s: StudyboardFocusAttributes.ContentState
    var body: some View {
        Image(systemName: s.mode == "focus" ? "timer" : "cup.and.saucer.fill").foregroundStyle(tint(s))
    }
}

struct StudyboardFocusLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: StudyboardFocusAttributes.self) { context in
            // Lock Screen and notification banner
            let s = context.state
            HStack(spacing: 14) {
                Tomato(s: s).font(.title2)
                VStack(alignment: .leading, spacing: 2) {
                    Text(s.pausedLeft > 0 ? "\(s.label), paused" : s.label).font(.headline)
                    if !s.task.isEmpty { Text(s.task).font(.subheadline).foregroundStyle(.secondary).lineLimit(1) }
                }
                Spacer(minLength: 8)
                TimeLeft(s: s).font(.system(size: 34, weight: .bold, design: .rounded)).foregroundStyle(tint(s))
            }
            .padding(16)
            .activityBackgroundTint(Color(.systemBackground).opacity(0.9))
            .activitySystemActionForegroundColor(Color(hex: context.attributes.accent))
        } dynamicIsland: { context in
            let s = context.state
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label { Text(s.label) } icon: { Tomato(s: s) }.font(.headline)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    TimeLeft(s: s).font(.system(.title2, design: .rounded).weight(.bold)).foregroundStyle(tint(s))
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 6) {
                        if !s.task.isEmpty { Text(s.task).font(.subheadline).lineLimit(1) }
                        if s.pausedLeft > 0 {
                            ProgressView(value: Double(s.total - s.pausedLeft), total: Double(s.total)).tint(tint(s))
                            Text("Paused").font(.caption).foregroundStyle(.secondary)
                        } else {
                            ProgressView(timerInterval: s.startedAt...s.endsAt, countsDown: false) { EmptyView() } currentValueLabel: { EmptyView() }.tint(tint(s))
                        }
                    }
                }
            } compactLeading: {
                Tomato(s: s)
            } compactTrailing: {
                TimeLeft(s: s).frame(maxWidth: 52).foregroundStyle(tint(s))
            } minimal: {
                Tomato(s: s)
            }
            .keylineTint(tint(s))
        }
    }
}
