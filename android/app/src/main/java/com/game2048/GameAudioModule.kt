package com.game2048

import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.SoundPool
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class GameAudioModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var backgroundPlayer: MediaPlayer? = null
  private var moveEffectId = 0
  private var moveEffectLoaded = false

  private val soundPool: SoundPool = SoundPool.Builder()
    .setMaxStreams(4)
    .setAudioAttributes(
      AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_GAME)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build(),
    )
    .build()

  init {
    soundPool.setOnLoadCompleteListener { _, sampleId, status ->
      if (sampleId == moveEffectId && status == 0) {
        moveEffectLoaded = true
      }
    }
    moveEffectId = soundPool.load(reactContext, R.raw.move_effect, 1)
  }

  override fun getName() = "GameAudio"

  @ReactMethod
  fun startBackgroundMusic() {
    val existingPlayer = backgroundPlayer
    if (existingPlayer != null) {
      if (!existingPlayer.isPlaying) {
        existingPlayer.start()
      }
      return
    }

    backgroundPlayer = MediaPlayer.create(reactContext, R.raw.background_song)?.apply {
      isLooping = true
      setVolume(0.45f, 0.45f)
      start()
    }
  }

  @ReactMethod
  fun stopBackgroundMusic() {
    backgroundPlayer?.stop()
    backgroundPlayer?.release()
    backgroundPlayer = null
  }

  @ReactMethod
  fun playMoveEffect() {
    if (moveEffectLoaded) {
      soundPool.play(moveEffectId, 0.85f, 0.85f, 1, 0, 1f)
    }
  }

  override fun invalidate() {
    super.invalidate()
    stopBackgroundMusic()
    soundPool.release()
  }
}
