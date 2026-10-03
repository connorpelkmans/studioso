// UNTESTED + EXPERIMENTAL (see StudyboardAppFunctions.kt): supplies the AppFunctions class instance. Set android:name=".capture.StudyboardApplication"
// on <application> (AndroidManifest.additions.xml). VERIFY the AppFunctionConfiguration API names against the current androidx.appfunctions release.
package com.studioso.app.capture

import android.app.Application
import androidx.appfunctions.service.AppFunctionConfiguration

class StudyboardApplication : Application(), AppFunctionConfiguration.Provider {
    override val appFunctionConfiguration: AppFunctionConfiguration
        get() = AppFunctionConfiguration.Builder()
            .addEnclosingClassFactory(StudyboardAppFunctions::class.java) { StudyboardAppFunctions() }
            .build()
}
