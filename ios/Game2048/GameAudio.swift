import AVFoundation
import Foundation

@objc(GameAudio)
class GameAudio: NSObject {
  private var backgroundPlayer: AVAudioPlayer?
  private var moveEffectPlayer: AVAudioPlayer?

  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc
  func startBackgroundMusic() {
    DispatchQueue.main.async {
      self.configureAudioSession()

      if let player = self.backgroundPlayer {
        if !player.isPlaying {
          player.play()
        }
        return
      }

      guard let url = Bundle.main.url(forResource: "background_song", withExtension: "mp3") else {
        return
      }

      do {
        let player = try AVAudioPlayer(contentsOf: url)
        player.numberOfLoops = -1
        player.volume = 0.45
        player.prepareToPlay()
        player.play()
        self.backgroundPlayer = player
      } catch {
        print("Failed to play background music: \(error)")
      }
    }
  }

  @objc
  func stopBackgroundMusic() {
    DispatchQueue.main.async {
      self.backgroundPlayer?.stop()
      self.backgroundPlayer = nil
    }
  }

  @objc
  func playMoveEffect() {
    DispatchQueue.main.async {
      self.configureAudioSession()

      guard let url = Bundle.main.url(forResource: "move_effect", withExtension: "mp3") else {
        return
      }

      do {
        let player = try self.moveEffectPlayer ?? AVAudioPlayer(contentsOf: url)
        player.currentTime = 0
        player.volume = 0.85
        player.prepareToPlay()
        player.play()
        self.moveEffectPlayer = player
      } catch {
        print("Failed to play move effect: \(error)")
      }
    }
  }

  private func configureAudioSession() {
    do {
      try AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default, options: [.mixWithOthers])
      try AVAudioSession.sharedInstance().setActive(true)
    } catch {
      print("Failed to configure audio session: \(error)")
    }
  }
}
