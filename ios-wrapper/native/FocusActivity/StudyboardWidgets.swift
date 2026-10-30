// UNTESTED: written without compiler access
import ActivityKit
import AppIntents
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

// the mode's colour (not called tint: inside a view that name is SwiftUI's own .tint modifier)
private func modeColor(_ s: StudyboardFocusAttributes.ContentState) -> Color { s.mode == "focus" ? tomatoRed : leafGreen }
private func clock(_ secs: Int) -> String { String(format: "%d:%02d", secs / 60, secs % 60) }

// The time left
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

// Studyboard's tomato (the same drawing as the app's focus button, on a 24 by 24 grid)
private struct TomatoBody: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: 12, y: 7.2))
        p.addCurve(to: CGPoint(x: 4, y: 13.9), control1: CGPoint(x: 7.4, y: 7.2), control2: CGPoint(x: 4, y: 10.1))
        p.addCurve(to: CGPoint(x: 12, y: 21), control1: CGPoint(x: 4, y: 17.8), control2: CGPoint(x: 7.6, y: 21))
        p.addCurve(to: CGPoint(x: 20, y: 13.9), control1: CGPoint(x: 16.4, y: 21), control2: CGPoint(x: 20, y: 17.8))
        p.addCurve(to: CGPoint(x: 12, y: 7.2), control1: CGPoint(x: 20, y: 10.1), control2: CGPoint(x: 16.6, y: 7.2))
        p.closeSubpath()
        return p.applying(CGAffineTransform(scaleX: r.width / 24, y: r.height / 24))
    }
}
private struct TomatoLeaves: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: 12, y: 7.5)); p.addLine(to: CGPoint(x: 12, y: 4.2))
        p.move(to: CGPoint(x: 12, y: 6.6))
        p.addCurve(to: CGPoint(x: 7.2, y: 5.3), control1: CGPoint(x: 10.6, y: 5.0), control2: CGPoint(x: 8.6, y: 4.7))
        p.addCurve(to: CGPoint(x: 10.2, y: 7.9), control1: CGPoint(x: 8.4, y: 5.7), control2: CGPoint(x: 9.6, y: 6.6))
        p.move(to: CGPoint(x: 12, y: 6.6))
        p.addCurve(to: CGPoint(x: 16.8, y: 5.3), control1: CGPoint(x: 13.4, y: 5.0), control2: CGPoint(x: 15.4, y: 4.7))
        p.addCurve(to: CGPoint(x: 13.8, y: 7.9), control1: CGPoint(x: 15.6, y: 5.7), control2: CGPoint(x: 14.4, y: 6.6))
        return p.applying(CGAffineTransform(scaleX: r.width / 24, y: r.height / 24))
    }
}
private struct Tomato: View {
    let s: StudyboardFocusAttributes.ContentState
    var size: CGFloat = 22
    var body: some View {
        ZStack {
            TomatoBody().fill(Color(red: 1.0, green: 0.42, blue: 0.33))
            TomatoLeaves().stroke(Color(red: 0.24, green: 0.78, blue: 0.58), style: StrokeStyle(lineWidth: 1.8 * size / 24, lineCap: .round))
        }
        .frame(width: size, height: size)
    }
}

// A thicker progress bar with round ends (the system bar, so it still moves on its own)
private struct Pill: ViewModifier {
    func body(content: Content) -> some View {
        content.progressViewStyle(.linear).scaleEffect(x: 1, y: 2.2, anchor: .center).frame(height: 9).clipShape(Capsule())
    }
}

// How far through: moves on its own while running, still while paused
private struct Bar: View {
    let s: StudyboardFocusAttributes.ContentState
    let color: Color
    var body: some View {
        if s.pausedLeft > 0 {
            ProgressView(value: Double(s.total - s.pausedLeft), total: Double(s.total)).tint(color).modifier(Pill())
        } else {
            ProgressView(timerInterval: s.startedAt...s.endsAt, countsDown: false) { EmptyView() } currentValueLabel: { EmptyView() }.tint(color).modifier(Pill())
        }
    }
}

// Reset, Pause or Play, and Skip: round buttons centred under the timer
private struct Controls: View {
    let s: StudyboardFocusAttributes.ContentState
    let fill: Color
    let second: Color
    var done = false
    var body: some View {
        let paused = s.pausedLeft > 0
        HStack(spacing: 18) {
            Round(action: "reset", icon: "arrow.counterclockwise", size: 36, bg: second, label: "Reset")
            // a finished session has nothing to pause: Skip starts the next one
            if !done {
                Toggle(isOn: !paused, intent: StudyboardFocusPlayPause()) { Text(paused ? "Resume" : "Pause") }
                    .toggleStyle(PlayPauseStyle(bg: fill))
            }
            Round(action: "skip", icon: "forward.end.fill", size: 36, bg: second, label: "Skip").opacity((s.plan ?? []).isEmpty ? 0.4 : 1)
                .disabled((s.plan ?? []).isEmpty)
        }
        .frame(maxWidth: .infinity)
    }
}
// draws the switch as the round Play / Pause button, from the switch's own state (which iOS flips at once)
private struct PlayPauseStyle: ToggleStyle {
    let bg: Color
    func makeBody(configuration: Configuration) -> some View {
        // swapped at once, not cross-faded (iOS fades changes on a Live Activity unless told otherwise)
        Image(systemName: configuration.isOn ? "pause.fill" : "play.fill").font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
            .contentTransition(.identity).transition(.identity).animation(nil, value: configuration.isOn)
            .frame(width: 44, height: 44).background(Circle().fill(bg))
            .contentShape(Circle())
            .accessibilityLabel(configuration.isOn ? "Pause" : "Resume")
    }
}
private struct Round: View {
    let action: String, icon: String, size: CGFloat, bg: Color, label: String
    var body: some View {
        Button(intent: StudyboardFocusControl(action: action)) {
            Image(systemName: icon).font(.system(size: size * 0.4, weight: .bold)).foregroundStyle(.white)
                .frame(width: size, height: size).background(Circle().fill(bg))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}

// The Lock Screen card: Studyboard's deep blue in light and dark mode alike, as a see-through tint on the Lock Screen's
// glass (the wallpaper shows through, blurred)
private struct LockCard: View {
    let s: StudyboardFocusAttributes.ContentState
    let accent: String
    let done: Bool
    var body: some View {
        let navy = Color(hex: "#071433")
        let ink = Color(hex: "#E7EEFA")
        let muted = Color(hex: "#A9BADC")
        let time = s.mode == "focus" ? Color(hex: "#FF6B55") : Color(hex: "#3CC794")
        VStack(spacing: 12) {
        HStack(spacing: 14) {
            Tomato(s: s, size: 34)
            VStack(alignment: .leading, spacing: 2) {
                Text(done ? "\(s.label) Complete" : s.label).font(.headline).foregroundStyle(ink).lineLimit(1)
                if !s.task.isEmpty { Text(s.task).font(.subheadline).foregroundStyle(muted).lineLimit(1) }
            }
            .layoutPriority(1)
            Spacer(minLength: 8)
            TimeLeft(s: s).font(.system(size: 34, weight: .bold, design: .rounded)).foregroundStyle(time)
                .multilineTextAlignment(.trailing).frame(minWidth: 96, alignment: .trailing)
        }
        Controls(s: s, fill: time, second: Color.white.opacity(0.16), done: done)
        }
        .padding(16)
        .activityBackgroundTint(navy.opacity(0.62))
        .activitySystemActionForegroundColor(ink)
    }
}

struct StudyboardFocusLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: StudyboardFocusAttributes.self) { context in
            LockCard(s: context.state, accent: context.attributes.accent, done: context.isStale)
        } dynamicIsland: { context in
            let s = context.state
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label { Text(s.label).foregroundStyle(.white).lineLimit(1).minimumScaleFactor(0.6) } icon: { Tomato(s: s) }
                        .font(.headline).padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    // a counting-down time takes all the room it's given, so it's pushed to the right edge itself
                    TimeLeft(s: s).font(.system(.title2, design: .rounded).weight(.bold)).foregroundStyle(modeColor(s))
                        .multilineTextAlignment(.trailing).frame(maxWidth: .infinity, alignment: .trailing).padding(.trailing, 10)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 10) {
                        Bar(s: s, color: modeColor(s))
                        Controls(s: s, fill: modeColor(s), second: Color.white.opacity(0.2), done: context.isStale)
                    }
                    .padding(.horizontal, 8)
                }
            } compactLeading: {
                Tomato(s: s)
            } compactTrailing: {
                TimeLeft(s: s).multilineTextAlignment(.trailing).frame(maxWidth: 52, alignment: .trailing).foregroundStyle(modeColor(s))
            } minimal: {
                Tomato(s: s)
            }
            .keylineTint(modeColor(s))
        }
    }
}
