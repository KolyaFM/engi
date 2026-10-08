# Mobile swipe and image usability fixes

- Both object introduction and binary conveyor use a shared axis-lock gesture controller. Their touch surfaces declare `touch-action: none` before touch begins. Vertical gestures scroll the actual containing viewport with momentum; horizontal gestures move the card. Ambiguous diagonal movement waits for clear intent and cannot change axis after selection. Wheel scrolling remains native. Pointer cancellation resets safely. Transform updates are limited to one animation frame.
- Introduction properties and media selection are memoized instead of recomputed on every swipe frame. Accepted swipes keep their exit position during saving.
- Conveyor objects have entity keys: resetting the offset belongs to the next object, rather than animating the departing object back. Exit animation and answer saving run concurrently. Both buttons and swipe gestures share the same answer service, request identity and failure recovery.
- Chronology image rows grow from 100–142px to 200–300px, use more of the available width, and preserve full images with contain. Larger lists scroll; chronology drag autoscroll remains available.
- Error-resolution and learning-milestone banners are removed. A decrease in the scoped error count animates the badge briefly, including the transition to zero. Reduced-motion preferences suppress the animation.

Browser validation: `tests/mobile-swipe-browser.mjs` checks touch scrolling, diagonal swipes, both introduction directions, both conveyor directions, and error badge animation. Existing introduction decisions test checks an accepted swipe under delayed database writes. Conveyor and chronology browser suites check wrong-answer queues, persistence, larger full images, pointer/touch sorting and narrow screens.

References: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action and https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events . No content-pack or memory scheduling changes.
