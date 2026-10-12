package com.realcak3d.blipling

import android.app.Application
import com.realcak3d.blipling.work.CareWorker

class BliplingApp : Application() {
    override fun onCreate() {
        super.onCreate()
        CareWorker.createChannel(this)
        CareWorker.schedule(this)
    }
}
