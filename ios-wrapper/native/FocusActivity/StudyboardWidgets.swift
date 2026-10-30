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


// What to show for the time: worked out from whether it's running as far as the Play/Pause switch knows. iOS flips the switch
// the instant it's tapped and draws the card again, so the time and the bar stop (or start) at that moment; the app makes it
// real a moment later in the background, with the same result.
private struct Clock {
    let running: Bool, left: Int, start: Date, end: Date, total: Int
    init(_ s: StudyboardFocusAttributes.ContentState, running: Bool, at now: Date = Date()) {
        total = max(1, s.total)
        left = s.pausedLeft > 0 ? s.pausedLeft : max(0, Int(s.endsAt.timeIntervalSince(now).rounded(.up)))
        self.running = running
        if running && s.pausedLeft > 0 {          // just resumed here: counting on from now
            end = now.addingTimeInterval(Double(s.pausedLeft)); start = end.addingTimeInterval(-Double(total))
        } else if running {
            end = s.endsAt; start = s.startedAt
        } else {                                   // paused (or just paused here): still
            end = now; start = now
        }
    }
}
private struct ClockTime: View {
    let c: Clock
    var body: some View {
        if c.running { Text(timerInterval: c.start...c.end, countsDown: true).monospacedDigit() }
        else { Text(clock(c.left)).monospacedDigit() }
    }
}

// A thicker progress bar with round ends (the system bar, so it still moves on its own)
private struct Pill: ViewModifier {
    func body(content: Content) -> some View {
        content.progressViewStyle(.linear).scaleEffect(x: 1, y: 2.2, anchor: .center).frame(height: 9).clipShape(Capsule())
    }
}
private struct Bar: View {
    let c: Clock
    let color: Color
    var body: some View {
        if c.running {
            ProgressView(timerInterval: c.start...c.end, countsDown: false) { EmptyView() } currentValueLabel: { EmptyView() }.tint(color).modifier(Pill())
        } else {
            ProgressView(value: Double(c.total - c.left), total: Double(c.total)).tint(color).modifier(Pill())
        }
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

// The look of the card and the expanded island
private struct Look {
    let ink: Color, muted: Color, time: Color, second: Color
    let island: Bool
}

// The whole card, drawn from one running/paused state, with the round Play/Pause button in the middle of the bottom row
private struct Face: View {
    let s: StudyboardFocusAttributes.ContentState
    let c: Clock
    let look: Look
    let done: Bool
    let showPlay: Bool
    var playing: Bool? = nil     // the button's state (the switch's), when it differs from the time's
    var body: some View {
        let on = playing ?? c.running
        VStack(spacing: look.island ? 10 : 12) {
            HStack(spacing: look.island ? 10 : 14) {
                Tomato(s: s, size: look.island ? 22 : 34)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.headline).foregroundStyle(look.ink).lineLimit(1).minimumScaleFactor(0.6)
                    if !look.island && !s.task.isEmpty { Text(s.task).font(.subheadline).foregroundStyle(look.muted).lineLimit(1) }
                }
                .layoutPriority(1)
                Spacer(minLength: 8)
                ClockTime(c: c)
                    .font(look.island ? Font.system(.title2, design: .rounded).weight(.bold) : Font.system(size: 34, weight: .bold, design: .rounded))
                    .foregroundStyle(look.time)
                    .multilineTextAlignment(.trailing).frame(minWidth: look.island ? 70 : 96, alignment: .trailing)
            }
            if look.island { Bar(c: c, color: look.time) }
            HStack(spacing: 18) {
                Color.clear.frame(width: 36, height: 36)
                if showPlay {
                    // swapped at once, not cross-faded (iOS fades changes on a Live Activity unless told otherwise)
                    Image(systemName: on ? "pause.fill" : "play.fill").font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                        .contentTransition(.identity).transition(.identity).animation(nil, value: on)
                        .frame(width: 44, height: 44).background(Circle().fill(look.time))
                } else {
                    Color.clear.frame(width: 44, height: 44)
                }
                Color.clear.frame(width: 36, height: 36)
            }
            .frame(maxWidth: .infinity)
        }
    }
    private var title: String {
        if done { return "\(s.label) Complete" }
        return look.island && s.mode != "focus" ? "Break" : s.label
    }
}

// Only the round button in the middle of the bottom row takes the tap (the rest of the card opens the app as usual)
private struct PlayHit: Shape {
    func path(in r: CGRect) -> Path { Path(ellipseIn: CGRect(x: r.midX - 22, y: r.maxY - 44, width: 44, height: 44)) }
}
private struct FaceStyle: ToggleStyle {
    let s: StudyboardFocusAttributes.ContentState
    let look: Look
    // The time for the switch's state. Just tapped (the switch differs from the card): with the App Group the time stops or
    // starts at the tap, which the app then uses too; without it the time stays as the card says until the app has acted,
    // so it never jumps.
    private func clock(_ on: Bool) -> Clock {
        let cardRunning = s.pausedLeft == 0
        if on == cardRunning { return Clock(s, running: on) }
        if StudyboardTap.available { return Clock(s, running: on, at: StudyboardTap.note(s, running: on)) }
        return Clock(s, running: cardRunning)
    }
    func makeBody(configuration: Configuration) -> some View {
        Face(s: s, c: clock(configuration.isOn), look: look, done: false, showPlay: true, playing: configuration.isOn)
            .contentShape(PlayHit())
            .accessibilityLabel(configuration.isOn ? "Pause" : "Resume")
    }
}

// The card with its buttons: Play/Pause is the switch (the whole face, so it all changes at once), Reset and Skip sit over it
private struct Panel: View {
    let s: StudyboardFocusAttributes.ContentState
    let look: Look
    let done: Bool
    var body: some View {
        ZStack(alignment: .bottom) {
            if done {
                Face(s: s, c: Clock(s, running: false), look: look, done: true, showPlay: false)
            } else {
                Toggle(isOn: s.pausedLeft == 0, intent: StudyboardFocusPlayPause()) { Text("Pause") }
                    .toggleStyle(FaceStyle(s: s, look: look))
            }
            HStack(spacing: 18) {
                Round(action: "reset", icon: "arrow.counterclockwise", size: 36, bg: look.second, label: "Reset")
                Color.clear.frame(width: 44, height: 44).allowsHitTesting(false)
                Round(action: "skip", icon: "forward.end.fill", size: 36, bg: look.second, label: "Skip").opacity((s.plan ?? []).isEmpty ? 0.4 : 1)
                    .disabled((s.plan ?? []).isEmpty)
            }
            .frame(maxWidth: .infinity)
        }
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
        Panel(s: s, look: Look(ink: ink, muted: Color(hex: "#A9BADC"), time: s.mode == "focus" ? Color(hex: "#FF6B55") : Color(hex: "#3CC794"),
                               second: Color.white.opacity(0.16), island: false), done: done)
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
                // all in one region, so the time can change together with the Play/Pause switch (see Clock)
                DynamicIslandExpandedRegion(.bottom) {
                    Panel(s: s, look: Look(ink: .white, muted: .white.opacity(0.7), time: modeColor(s), second: Color.white.opacity(0.2), island: true),
                          done: context.isStale)
                        .padding(.horizontal, 8).padding(.bottom, 4)
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
