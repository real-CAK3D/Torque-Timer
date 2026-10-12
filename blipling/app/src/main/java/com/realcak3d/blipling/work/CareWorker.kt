package com.realcak3d.blipling.work

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.realcak3d.blipling.MainActivity
import com.realcak3d.blipling.R
import com.realcak3d.blipling.data.GameRepository
import java.util.concurrent.TimeUnit

/** Wakes up every ~30 minutes, advances the simulation and nudges the owner if the buddy needs something. */
class CareWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result {
        val repo = GameRepository.get(applicationContext)
        repo.act { now -> tick(now, offline = true) }
        val g = repo.data
        val b = g.buddy
        if (!g.settings.notifications || !b.hatched || b.dead) return Result.success()
        val s = b.stats
        val msg = when {
            b.sick -> "${b.name} is sick and needs medicine! 🤒"
            s.fullness < 20 -> "${b.name} is starving! Scan something tasty. 🍽️"
            s.hygiene < 20 || b.poops >= 3 -> "${b.name} is stinky... time to clean up! 🧽"
            s.happiness < 20 -> "${b.name} feels lonely. Come say hi! 💬"
            s.health < 30 -> "${b.name}'s health is low! ❤️"
            else -> null
        } ?: return Result.success()
        val key = "notified_${msg.hashCode()}"
        if (!repo.engine.onceEvery(key, System.currentTimeMillis(), 3 * 3_600_000L)) return Result.success()
        notify(applicationContext, msg)
        return Result.success()
    }

    companion object {
        const val CHANNEL = "care"

        fun createChannel(ctx: Context) {
            if (Build.VERSION.SDK_INT >= 26) {
                val nm = ctx.getSystemService(NotificationManager::class.java)
                nm.createNotificationChannel(NotificationChannel(CHANNEL, "Buddy needs", NotificationManager.IMPORTANCE_DEFAULT).apply {
                    description = "Reminders when your Blipling is hungry, sick or lonely"
                })
            }
        }

        fun schedule(ctx: Context) {
            val req = PeriodicWorkRequestBuilder<CareWorker>(30, TimeUnit.MINUTES).build()
            WorkManager.getInstance(ctx).enqueueUniquePeriodicWork("care", ExistingPeriodicWorkPolicy.KEEP, req)
        }

        @SuppressLint("MissingPermission")
        fun notify(ctx: Context, text: String) {
            if (Build.VERSION.SDK_INT >= 33 &&
                ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
            ) return
            val pi = PendingIntent.getActivity(
                ctx, 0, Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )
            val n = NotificationCompat.Builder(ctx, CHANNEL)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentTitle("Blipling")
                .setContentText(text)
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build()
            NotificationManagerCompat.from(ctx).notify(1, n)
        }
    }
}
