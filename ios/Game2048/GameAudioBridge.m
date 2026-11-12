#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(GameAudio, NSObject)

RCT_EXTERN_METHOD(startBackgroundMusic)
RCT_EXTERN_METHOD(stopBackgroundMusic)
RCT_EXTERN_METHOD(playMoveEffect)

@end
