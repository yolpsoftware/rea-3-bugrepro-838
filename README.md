# How to sync rendering with react-native-reanimated variable updates?

This repository is a minimal example of a bug we are currently fighting against. It is a race condition between a React Native re-render (changed state) and a React Native Reanimated Shared Value update.

We have tried several things to fix the problem. Our three approaches can be seen in the three tags `mode-1`, `mode-2` and `mode-3`.

If you run one of the three "modes" on the iOS simulator, you'll see a screen with a list of green "items". These items can be swiped down, which triggers an animated transition to the next item. Only the last two items are rendered. When the rendering switches to the next two items, sometimes you see a rendering glitch: both items are rendered at the same spot. This is the problem we want to solve. The items should never be rendered at the same spot.

To make the race condition visible, we created a heavy load on the JS thread, see the last few lines of `Screen.tsx`. This load is of course not something you would want in production. However, we need it to demonstrate the problem.

If you want to see how it **should** look, go to the end of `Screen.tsx` and change the following two constants:

```
const OP_DURATION = 5;
const OP_TIMEOUT = 5;
```

With those settings, you should not see the glitch, because if it happens at all, its duration is too short to be visible.

Please note:

* The heavy JS load is of course not something that should happen in real situations. However, the underlying problem is that we have a race condition. We need a way to solve that race condition.
* One solution would be to remove the `key` prop here:
```
<Animated.View key={itemsToRender[i]} style={style}>
  <Text style={styles.text}>{itemsToRender[i]}</Text>
</Animated.View>
```
If you remove this, the glitch changes to something else. In our app, this solves the glitch to something that is never visible. However, in our app, the "items" are actually videos that are playing. If we remove the `key` prop, those videos start playing from the beginning on each re-render. So this isn't an option.
