// UNTESTED + EXPERIMENTAL: written without compiler access, and without access to the current androidx.appfunctions documentation.
// VERIFY AGAINST THE CURRENT androidx.appfunctions RELEASE AND GEMINI AVAILABILITY before shipping: artifact names/versions, the annotation
// parameters, the first-parameter type (AppFunctionContext), the AppFunctionConfiguration.Provider wiring, the manifest/permission requirements,
// and whether Gemini on Pixel and on recent Samsung Galaxy devices (Galaxy AI uses Gemini) can actually discover and call app functions.
// Do not claim "works with Gemini" until a device test (README-ANDROID.md section 6) shows it. If AppFunctions is unavailable on a device, nothing
// here breaks: the share sheet, shortcuts, deep links and the tile are separate code paths.
//
// The function must be a public method of a class with a no-arg-constructible instance supplied by StudyboardApplication.
// Its KDoc is part of what the assistant reads (isDescribedByKDoc = true): keep it accurate and short.
package com.studioso.app.capture

import androidx.appfunctions.AppFunctionContext
import androidx.appfunctions.service.AppFunction

class StudyboardAppFunctions {
    /**
     * Adds a task to the user's Studyboard board.
     *
     * @param appFunctionContext the execution context.
     * @param title what the task is, for example "bio lab report".
     * @param dueDate when it is due, as the user said it, for example "friday" or "2026-11-05". Optional.
     * @param course the course it belongs to, for example "Biology". Optional.
     * @return one short sentence confirming what was added, safe to read aloud.
     */
    @AppFunction(isDescribedByKDoc = true)
    suspend fun addTask(appFunctionContext: AppFunctionContext, title: String, dueDate: String? = null, course: String? = null): String {
        return when (val r = CaptureClient.send(appFunctionContext.context, title, dueDate, course, source = "gemini")) {
            is CaptureResult.Added -> r.speech
            CaptureResult.NotConfigured -> "Studyboard isn't set up for voice yet. Open Studyboard, go to Settings, and turn on Quick Capture."
            CaptureResult.Invalid -> "I didn't catch a task to add."
            is CaptureResult.Failed -> if (r.queued) "I couldn't reach Studyboard, so I saved it on your phone and it will be added when you open the app." else "I couldn't add that to Studyboard."
        }
    }
}
