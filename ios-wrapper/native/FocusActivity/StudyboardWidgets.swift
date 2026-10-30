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

// Pause or Play, and Skip
private struct Controls: View {
    let s: StudyboardFocusAttributes.ContentState
    let fill: Color
    let second: Color
    var body: some View {
        HStack(spacing: 10) {
            Button(intent: StudyboardFocusControl(action: s.pausedLeft > 0 ? "play" : "pause")) {
                Label(s.pausedLeft > 0 ? "Resume" : "Pause", systemImage: s.pausedLeft > 0 ? "play.fill" : "pause.fill")
                    .font(.subheadline.weight(.semibold)).frame(maxWidth: .infinity)
            }
            .tint(fill)
            Button(intent: StudyboardFocusControl(action: "skip")) {
                Label("Skip", systemImage: "forward.end.fill").font(.subheadline.weight(.semibold)).frame(maxWidth: .infinity)
            }
            .tint(second)
            .disabled((s.plan ?? []).isEmpty)
        }
        .buttonStyle(.borderedProminent)
        .buttonBorderShape(.capsule)
        .foregroundStyle(.white)
    }
}

// The Lock Screen card, in Studyboard's own light and dark colours (set here, so text never lands on a matching background)
private struct LockCard: View {
    let s: StudyboardFocusAttributes.ContentState
    let accent: String
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        let dark = scheme == .dark
        let ink = dark ? Color(hex: "#E7EEFA") : Color(hex: "#0F1F3D")
        let muted = dark ? Color(hex: "#93A3C2") : Color(hex: "#56657F")
        let bg = dark ? Color(hex: "#111E38") : Color(hex: "#F7F9FC")
        let time = s.mode == "focus" ? Color(hex: dark ? "#FF6B55" : "#D9432C") : Color(hex: dark ? "#3CC794" : "#17865F")
        VStack(spacing: 12) {
        HStack(spacing: 14) {
            Tomato(s: s, size: 34)
            VStack(alignment: .leading, spacing: 2) {
                Text(s.pausedLeft > 0 ? "\(s.label) (Paused)" : s.label).font(.headline).foregroundStyle(ink).lineLimit(1)
                if !s.task.isEmpty { Text(s.task).font(.subheadline).foregroundStyle(muted).lineLimit(1) }
            }
            .layoutPriority(1)
            Spacer(minLength: 8)
            TimeLeft(s: s).font(.system(size: 34, weight: .bold, design: .rounded)).foregroundStyle(time)
                .multilineTextAlignment(.trailing).frame(minWidth: 96, alignment: .trailing)
        }
        Controls(s: s, fill: time, second: dark ? Color(hex: "#2A3B5E") : Color(hex: "#56657F"))
        }
        .padding(16)
        .activityBackgroundTint(bg)
        .activitySystemActionForegroundColor(ink)
    }
}

struct StudyboardFocusLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: StudyboardFocusAttributes.self) { context in
            LockCard(s: context.state, accent: context.attributes.accent)
        } dynamicIsland: { context in
            let s = context.state
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label { Text(s.label).foregroundStyle(.white) } icon: { Tomato(s: s) }.font(.headline)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    // a counting-down time takes all the room it's given, so it's pushed to the right edge itself
                    TimeLeft(s: s).font(.system(.title2, design: .rounded).weight(.bold)).foregroundStyle(modeColor(s))
                        .multilineTextAlignment(.trailing).frame(maxWidth: .infinity, alignment: .trailing).padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 8) {
                        if !s.task.isEmpty { Text(s.task).font(.subheadline).foregroundStyle(.white.opacity(0.85)).lineLimit(1) }
                        if s.pausedLeft > 0 {
                            ProgressView(value: Double(s.total - s.pausedLeft), total: Double(s.total)).tint(modeColor(s)).modifier(Pill())
                            Text("Paused").font(.caption).foregroundStyle(.secondary)
                        } else {
                            ProgressView(timerInterval: s.startedAt...s.endsAt, countsDown: false) { EmptyView() } currentValueLabel: { EmptyView() }.tint(modeColor(s)).modifier(Pill())
                        }
                        Controls(s: s, fill: modeColor(s), second: Color.white.opacity(0.22))
                    }
                    .padding(.horizontal, 8).padding(.top, 2)
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
