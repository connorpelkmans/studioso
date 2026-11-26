// JVM tests for the home-screen widgets (Robolectric, no emulator): what the widgets show for a saved day (HomeWidgetModel), the
// check-off queue (HomeWidgetStore), and the two layouts drawn for real. With SBW_SHOTS=<folder> in the environment the drawn widgets
// are also saved there as PNGs (android-widget-*.png). Run: cd android-wrapper/android && SBW_SHOTS=/tmp/shots ./gradlew testDebugUnitTest
package com.studyboardapp.studyboard.widgets

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.view.View
import android.widget.FrameLayout
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File
import java.io.FileOutputStream
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35], qualifiers = "en-rUS-xxhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class HomeWidgetsTest {
    private lateinit var ctx: Context
    private val tz: TimeZone = TimeZone.getTimeZone("America/Toronto")
    private var now = 0L
    private lateinit var today: String

    private fun at(daysFromToday: Int, h: Int, m: Int): Long = Calendar.getInstance(tz).apply {
        timeInMillis = now; add(Calendar.DAY_OF_YEAR, daysFromToday); set(Calendar.HOUR_OF_DAY, h); set(Calendar.MINUTE, m); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
    }.timeInMillis
    private fun day(n: Int) = HomeWidgetModel.dayKey(at(n, 12, 0), tz)

    @Before
    fun setUp() {
        TimeZone.setDefault(tz)
        Locale.setDefault(Locale.US)
        ctx = RuntimeEnvironment.getApplication()
        now = Calendar.getInstance(tz).apply { set(2026, Calendar.NOVEMBER, 26, 14, 10, 0); set(Calendar.MILLISECOND, 0) }.timeInMillis
        today = HomeWidgetModel.dayKey(now, tz)
    }

    // A day as src/js/70-widgets.js phoneData() sends it (v1), with the Time Cushion another part of the app adds
    private fun sample(cushion: Boolean = true, exam: Boolean = true): JSONObject {
        fun task(id: String, title: String, course: String, color: String, meta: String, done: Boolean = false, late: Boolean = false, due: String = "", time: String = "", ex: Boolean = false) =
            JSONObject().put("id", id).put("title", title).put("course", course).put("color", color).put("meta", meta).put("done", done).put("late", late)
                .put("due", due).put("time", time).put("exam", ex)
        val o = JSONObject().put("v", 1).put("day", today).put("at", now).put("dateLabel", "Thursday, November 26")
            .put("next", JSONObject().put("id", "t1").put("title", "Lab report: enzyme kinetics").put("course", "BIO 101").put("color", "#2F9E5F").put("why", "Due tomorrow").put("mins", 45))
            .put("tasks", JSONArray()
                .put(task("t1", "Lab report: enzyme kinetics", "BIO 101", "#2F9E5F", "45m today, due Fri", due = day(1)))
                .put(task("t5", "Discussion post 7", "SOC 1100", "#8E5BD8", "Overdue since Nov 24", late = true, due = day(-2)))
                .put(task("t2", "Read chapter 6", "PSYC 1010", "#3A6FD8", "30m today, due Mon", due = day(4)))
                .put(task("t3", "Problem set 4", "MATH 2210", "#D9822B", "Due 11:59 PM", due = today, time = "23:59"))
                .put(task("t6", "Flashcards: cell biology", "BIO 101", "#2F9E5F", "20m today"))
                .put(task("t4", "Essay outline", "ENGL 1020", "#C2477A", "Done", done = true, due = today)))
            .put("more", 1).put("cards", 18).put("dayOff", false)
            .put("plan", JSONArray()
                .put(JSONObject().put("from", at(0, 14, 0)).put("to", at(0, 14, 45)).put("id", "t1").put("title", "Lab report: enzyme kinetics").put("course", "BIO 101").put("color", "#2F9E5F").put("mins", 45))
                .put(JSONObject().put("from", at(0, 15, 0)).put("to", at(0, 15, 30)).put("id", "t2").put("title", "Read chapter 6").put("course", "PSYC 1010").put("color", "#3A6FD8").put("mins", 30)))
            .put("days", JSONArray()
                .put(JSONObject().put("date", day(1)).put("off", false).put("items", JSONArray().put(JSONObject().put("id", "t1").put("title", "Lab report: enzyme kinetics").put("course", "BIO 101").put("color", "#2F9E5F").put("time", "09:00").put("exam", false))).put("more", 0))
                .put(JSONObject().put("date", day(3)).put("off", false).put("items", JSONArray().put(JSONObject().put("id", "e1").put("title", "Chemistry midterm").put("course", "CHEM 1A").put("color", "#C8352E").put("time", "10:00").put("exam", true))).put("more", 0)))
            .put("theme", JSONObject().put("accent", "#2C55D6").put("accentInk", "#FFFFFF").put("late", "#C8352E"))
        if (exam) o.put("exam", JSONObject().put("id", "e1").put("title", "Chemistry midterm").put("course", "CHEM 1A").put("color", "#C8352E").put("due", day(3)).put("time", "10:00").put("days", 3).put("ready", 72))
        if (cushion) o.put("cushion", JSONObject().put("mins", 150).put("by", day(5)).put("state", "spare"))
        return o
    }

    private val clock: (Long) -> String = { ms -> java.text.SimpleDateFormat("h:mm a", Locale.US).apply { timeZone = tz }.format(ms) }
    private val clockOf: (String) -> String = { it }

    // ---- what they show ----

    @Test
    fun nothingSavedAsksToOpenTheApp() {
        val m = HomeWidgetModel.today(null, now, clock, clockOf, tz)
        assertTrue(m.setup)
        assertEquals("Open Studyboard to see your day", m.empty)
        assertTrue(HomeWidgetModel.countdown(null, now, tz).setup)
        assertNull(HomeWidgetStore.parse("{\"v\":2,\"tasks\":[]}"))
        assertNull(HomeWidgetStore.parse("not json"))
    }

    @Test
    fun doThisNextFollowsThePlanThroughTheDay() {
        val d = sample()
        val m = HomeWidgetModel.today(d, now, clock, clockOf, tz)
        assertEquals("t1", m.next?.id)
        assertEquals("Until 2:45 PM", m.next?.why)
        // in the gap before the next block: that block, with its time
        val later = HomeWidgetModel.today(d, at(0, 14, 50), clock, clockOf, tz)
        assertEquals("t2", later.next?.id)
        assertEquals("3:00 PM to 3:30 PM", later.next?.why)
        // after the plan: the page's own Do This Next
        val evening = HomeWidgetModel.today(d, at(0, 19, 0), clock, clockOf, tz)
        assertEquals("t1", evening.next?.id)
        assertEquals("Due tomorrow · 45m", evening.next?.why)
        // the list under it leaves Do This Next out and puts done tasks last
        assertEquals(listOf("t5", "t2", "t3", "t6", "t4"), m.tasks.map { it.id })
        assertEquals(1, m.more)
    }

    @Test
    fun examModeAndTheCushionLine() {
        val m = HomeWidgetModel.today(sample(), now, clock, clockOf, tz)
        assertEquals(3, m.exam?.days)
        assertEquals("Chemistry midterm in 3 days · ready 72%", HomeWidgets.examLine(m.exam!!))
        assertEquals("2h 30m to spare", m.cushion?.text)
        val tight = HomeWidgetModel.cushion(JSONObject().put("mins", 20).put("by", day(5)).put("state", "tight"), today, tz)
        assertTrue(tight!!.text.startsWith("Tight: 20m spare by "))
        assertEquals("45m short by tomorrow", HomeWidgetModel.cushion(JSONObject().put("mins", -45).put("by", day(1)).put("state", "short"), today, tz)?.text)
        assertNull("no cushion sent: no line", HomeWidgetModel.today(sample(cushion = false), now, clock, clockOf, tz).cushion)
        assertNull("an unknown state: no line", HomeWidgetModel.cushion(JSONObject().put("mins", 5).put("state", "odd"), today, tz))
    }

    @Test
    fun afterMidnightTodaysListComesFromTheWeekAhead() {
        val m = HomeWidgetModel.today(sample(), at(1, 0, 5), clock, clockOf, tz)
        assertEquals(listOf("t1"), (listOfNotNull(m.next?.id) + m.tasks.map { it.id }))
        assertEquals("", m.dateLabel)
    }

    @Test
    fun countdownPicksTheExamThenTheNextDeadline() {
        val c = HomeWidgetModel.countdown(sample(), now, tz)
        assertEquals("e1", c.item?.id)
        assertEquals(3, c.item?.days)
        assertEquals(72, c.item?.ready)
        // without Exam Mode: the exam in the week ahead still wins over nearer homework
        val c2 = HomeWidgetModel.countdown(sample(exam = false), now, tz)
        assertEquals("e1", c2.item?.id)
        assertNull(c2.item?.ready)
        // no exams at all: the nearest deadline
        val d = sample(exam = false)
        d.getJSONArray("days").remove(1)
        assertEquals("t3", HomeWidgetModel.countdown(d, now, tz).item?.id)
    }

    @Test
    fun aTickWaitsInTheQueueAndShowsAtOnce() {
        HomeWidgetStore.clear(ctx)
        assertTrue(HomeWidgetStore.save(ctx, sample().toString()))
        assertTrue(HomeWidgetStore.checkOff(ctx, "t1", now))
        assertTrue(HomeWidgetStore.checkOff(ctx, "t1", now + 5))
        assertTrue(!HomeWidgetStore.checkOff(ctx, "bad id!"))
        val q = HomeWidgetStore.actions(ctx)
        assertEquals(1, q.length())
        assertEquals("done", q.getJSONObject(0).getString("kind"))
        assertEquals("t1", q.getJSONObject(0).getString("task"))
        assertEquals(now, q.getJSONObject(0).getLong("at"))
        val saved = HomeWidgetStore.load(ctx)!!
        assertTrue(saved.getJSONArray("tasks").getJSONObject(0).getBoolean("done"))
        assertEquals("t5", saved.getJSONObject("next").getString("id"))
        HomeWidgetStore.removeActions(ctx, listOf(q.getJSONObject(0).getString("id")))
        assertEquals(0, HomeWidgetStore.actions(ctx).length())
        HomeWidgetStore.clear(ctx)
        assertNull(HomeWidgetStore.load(ctx))
    }

    // ---- drawn ----

    private fun draw(name: String, wDp: Int, hDp: Int, views: android.widget.RemoteViews) {
        val parent = FrameLayout(ctx)
        val v: View = views.apply(ctx, parent)
        val dm = ctx.resources.displayMetrics
        val w = (wDp * dm.density).toInt(); val h = (hDp * dm.density).toInt(); val pad = (16 * dm.density).toInt()
        v.measure(View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(h, View.MeasureSpec.EXACTLY))
        v.layout(0, 0, w, h)
        assertTrue("$name has a size", v.width > 0 && v.height > 0)
        val out = System.getProperty("sbw.shots").orEmpty().ifEmpty { System.getenv("SBW_SHOTS").orEmpty() }
        if (out.isEmpty()) return
        val bmp = Bitmap.createBitmap(w + 2 * pad, h + 2 * pad, Bitmap.Config.ARGB_8888)
        val c = Canvas(bmp)
        // a plain wallpaper behind it, light or dark like the system
        val night = (ctx.resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES
        c.drawColor(if (night) Color.rgb(30, 34, 44) else Color.rgb(196, 208, 226))
        c.translate(pad.toFloat(), pad.toFloat())
        v.draw(c)
        File(out).mkdirs()
        FileOutputStream(File(out, "android-widget-$name.png")).use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }

    @Test
    fun drawLight() {
        draw("today-4x4-light", 320, 330, HomeWidgets.todayViews(ctx, sample(), now, 320, 330))
        draw("today-2x2-light", 150, 160, HomeWidgets.todayViews(ctx, sample(exam = false, cushion = false), now, 150, 160))
        draw("countdown-4x2-light", 320, 110, HomeWidgets.countdownViews(ctx, sample(), now, 320, 110))
        draw("countdown-2x1-light", 150, 60, HomeWidgets.countdownViews(ctx, sample(), now, 150, 60))
        draw("today-empty-light", 250, 160, HomeWidgets.todayViews(ctx, null, now, 250, 160))
    }

    @Test
    @Config(qualifiers = "+night")
    fun drawDark() {
        draw("today-4x4-dark", 320, 330, HomeWidgets.todayViews(ctx, sample(), now, 320, 330))
        draw("countdown-4x2-dark", 320, 110, HomeWidgets.countdownViews(ctx, sample(), now, 320, 110))
        draw("countdown-2x1-dark", 150, 60, HomeWidgets.countdownViews(ctx, sample(), now, 150, 60))
        val tight = sample().put("cushion", JSONObject().put("mins", 20).put("by", day(5)).put("state", "tight"))
        draw("today-3x3-tight-dark", 250, 250, HomeWidgets.todayViews(ctx, tight, at(0, 14, 50), 250, 250))
    }

    @Test
    fun aDarkAccentIsLightenedOnTheDarkCard() {
        val blue = Color.parseColor("#2C55D6")
        assertEquals(blue, HomeWidgets.readable(blue, false))
        val l = HomeWidgets.readable(blue, true)
        assertTrue(Color.red(l) > Color.red(blue) && Color.blue(l) >= Color.blue(blue))
        val pale = Color.parseColor("#9FC2FF")
        assertEquals("a light accent is kept as it is", pale, HomeWidgets.readable(pale, true))
    }

    @Test
    fun aRowCanBeTickedAndOpened() {
        val v = HomeWidgets.todayViews(ctx, sample(), now, 320, 330).apply(ctx, FrameLayout(ctx))
        val list = v.findViewById<android.widget.LinearLayout>(com.studyboardapp.studyboard.R.id.sbw_list)
        assertNotNull(list)
        assertTrue("rows fit a 4x4 widget: " + list.childCount, list.childCount >= 4)
        val first = list.getChildAt(0)
        assertTrue(first.findViewById<View>(com.studyboardapp.studyboard.R.id.sbw_row_check).hasOnClickListeners())
        assertTrue(first.findViewById<View>(com.studyboardapp.studyboard.R.id.sbw_row_title).hasOnClickListeners())
        val small = HomeWidgets.todayViews(ctx, sample(), now, 150, 160).apply(ctx, FrameLayout(ctx))
        assertTrue("a 2x2 widget has fewer rows", small.findViewById<android.widget.LinearLayout>(com.studyboardapp.studyboard.R.id.sbw_list).childCount < list.childCount)
    }
}
