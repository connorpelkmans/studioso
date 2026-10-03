// UNTESTED: written without compiler access. Quick Settings tile "Quick capture": opens studyboard://capture. TileService is a long-stable API (API 24+).
package com.studioso.app.capture

import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService

class QuickCaptureTileService : TileService() {
    override fun onStartListening() {
        qsTile?.apply { state = Tile.STATE_INACTIVE; updateTile() }
    }

    @Suppress("DEPRECATION")
    override fun onClick() {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("studyboard://capture")).setPackage(packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        if (Build.VERSION.SDK_INT >= 34) {
            startActivityAndCollapse(PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE))
        } else {
            startActivityAndCollapse(intent)
        }
    }
}
