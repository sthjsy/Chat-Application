# Video Call Camera Toggle Bug - Fix Summary

## Issue
Video call receivers were unable to turn on/off their camera during an active call, even though audio functionality worked perfectly.

## Root Cause
In `src/contexts/CallContext.jsx` line 358, when a video call receiver didn't have a camera available initially, the WebRTC transceiver was configured as `'recvonly'`, which only allows receiving video but **not sending**.

## The Fix

### Change Made
**File**: `src/contexts/CallContext.jsx`  
**Line**: 358

```diff
- peerConnection.addTransceiver('video', { direction: 'recvonly' });
+ peerConnection.addTransceiver('video', { direction: 'sendrecv' });
```

### Why It Works
- **`'recvonly'`** = Can only receive video (broken for receiver)
- **`'sendrecv'`** = Can send AND receive video (correct for p2p calls)

When using `'sendrecv'`, the receiver can:
1. Join the call without a camera
2. Later enable their camera using the toggle button
3. Successfully send video to the caller

## Testing the Fix

### Scenario 1: Receiver Has Camera Available
- Before: ✅ Works (camera visible)
- After: ✅ Works (no change)

### Scenario 2: Receiver Joins Without Camera
- Before: ❌ Camera toggle does nothing
- After: ✅ Camera toggle enables video immediately

### Scenario 3: Disable Camera Mid-Call
- Before: ⚠️ Undefined behavior
- After: ✅ Works correctly

## Impact
- ✅ No breaking changes
- ✅ Minimal code change (1 line)
- ✅ Solid WebRTC best practice
- ✅ Immediately fixes video receiver functionality

## Related Code
The fix aligns with existing code at line 133 which already uses `'sendrecv'`:
```javascript
return peerConnection.addTransceiver('video', { direction: 'sendrecv' }).sender;
```

## Deployment Notes
1. No database migrations needed
2. No API changes required
3. Safe to deploy immediately
4. Works with existing peer connections (new calls use the fix)

## Technical Details

### WebRTC Transceiver Directions
| Direction | Send | Receive | Use Case |
|-----------|------|---------|----------|
| inactive | ❌ | ❌ | Track disabled |
| sendonly | ✅ | ❌ | Broadcasting only |
| recvonly | ❌ | ✅ | ⚠️ **Problematic** |
| sendrecv | ✅ | ✅ | ✅ **Correct for peer-to-peer** |

### Why `'recvonly'` Was Wrong
```javascript
// Receiver flow (non-initiator):
setupPeerConnection(callType='video', isInitiator=false)
  ↓
getCallMediaStream('video')
  ↓
If camera unavailable → stream has only audio
  ↓
addTransceiver('video', { direction: 'recvonly' })
  ↓
Later: toggleVideo() → acquireCameraTrack()
  ↓
updateLocalVideoTrack(newTrack)
  ↓
sender.replaceTrack(newTrack)
  ↓
❌ Fails because 'recvonly' transceiver cannot send!
```

### Why `'sendrecv'` Fixes It
```javascript
// Same flow with 'sendrecv':
setupPeerConnection(callType='video', isInitiator=false)
  ↓
getCallMediaStream('video')
  ↓
If camera unavailable → stream has only audio
  ↓
addTransceiver('video', { direction: 'sendrecv' })
  ↓
Later: toggleVideo() → acquireCameraTrack()
  ↓
updateLocalVideoTrack(newTrack)
  ↓
sender.replaceTrack(newTrack)
  ↓
✅ Success! 'sendrecv' transceiver can send video!
```

## Files Changed
- ✅ `src/contexts/CallContext.jsx` (1 line modified)

## Files Created (Documentation)
- ✅ `PROJECT_ANALYSIS.md` - Complete project analysis
- ✅ `BUG_FIX_SUMMARY.md` - This file

---

**Status**: 🟢 FIXED  
**Date**: June 7, 2026  
**Severity**: Medium (Blocks video receive camera toggle)  
**Complexity**: Low (Single line fix)

