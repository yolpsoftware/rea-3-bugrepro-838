import React, { useCallback, useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming, useAnimatedGestureHandler, runOnJS } from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

interface Props {
  items: string[];
  nextItemAction?: () => void;
}

export const Screen = (props: Props) => {
  const panRef = useRef<PanGestureHandler>(null);

  const animationDuration: number = 300;

  const [itemsToRender, setItemsToRender] = useState<string[]>([]);
  useEffect(() => {
    if (props.items) {
      const array = [...props.items];
      if (itemsToRender.length === 0) {
        setItemsToRender(array);
      } else if (itemsToRender.length < 2 && array.length > 1) {
        if (itemsToRender[0] === array[0]) {
          setItemsToRender(array);
        } else {
          setItemsToRender([itemsToRender[0], array[0]]);
        }
      }
    }
  }, [props.items.join(', '), itemsToRender.join(', '), setItemsToRender]);

  // Layout stuff, gets copied from the LayoutHelper.getStyles style object
  const size = Dimensions.get('window');
  const windowHeight = size.height;
  const isPanning = useSharedValue(false);

  /**
   * This value goes from 0 to 1 during the transition to the next item.
   */
  const switchingValue = useSharedValue(0);

  /**
   * The input data of the PanGestureHandler.
   */
  const panInput = {
    posY: useSharedValue(0),
    state: isPanning,
  }
  /**
   * Nodes controlling the panning of the current item.
   */
  const panTranslationValues = {
    transY: useSharedValue(0),
  }

  const moveItemToOff = () => {
    'worklet'
    const targetY = windowHeight;
    panTranslationValues.transY.value = withTiming(targetY, { duration: animationDuration });
    switchingValue.value = 0.001;      // this makes sure that the subsequent (spurious) second pan gesture onEnd does not move the item back to the center
    switchingValue.value = withTiming(1, { duration: animationDuration });
  }

  const initTransitionToNextItem = useCallback(() => {
    setTimeout(() => {
      setItemsToRender(itemsToRender.slice(1));
      switchingValue.value = 0;
      panTranslationValues.transY.value = 0;
      panInput.posY.value = 0;
    }, animationDuration);
    props.nextItemAction && props.nextItemAction();
  }, [itemsToRender.join(', ')]);

  const onPanEvent = useAnimatedGestureHandler({
    onStart: (event, ctx) => {
      if (!itemsToRender[0]) {
        return;
      }
      isPanning.value = true;
    },
    onActive: (event, ctx) => {
      if (!isPanning.value) {
        isPanning.value = false;
        return;
      }
      panInput.posY.value = event.y;
      const diffY = event.translationY;
      panTranslationValues.transY.value = diffY;
    },
    onEnd: (event, ctx) => {
      if (isPanning.value) {
        if (panTranslationValues.transY.value > 50) {
          moveItemToOff();
          runOnJS(initTransitionToNextItem)();
        } else {
          panTranslationValues.transY.value = withTiming(0, { duration: animationDuration });
        }
      }
      isPanning.value = false;
    },
    onCancel: (event, ctx) => {
      isPanning.value = false;
      panTranslationValues.transY.value = withTiming(0, { duration: animationDuration });
    },
    onFail: (event, ctx) => {
      isPanning.value = false;
      panTranslationValues.transY.value = withTiming(0, { duration: animationDuration });
    },
  }, [itemsToRender.join(', '), initTransitionToNextItem]);

  const currentItemTransform = useAnimatedStyle(() => ({
    transform: [{
      translateY: windowHeight / 2 + panTranslationValues.transY.value + interpolate(switchingValue.value, [0, 1], [0, windowHeight / 2]),
    }],
  }), [itemsToRender.join(', ')]);

  const nextItemTransform = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(switchingValue.value, [0, 1], [0, windowHeight / 2]),
    }]
  }), [switchingValue, itemsToRender.join(', ')]);

  const itemStyles: any[] = [];

  if (itemsToRender[0]) {
    itemStyles.push([
      styles.item,
      { transform: [{
        translateY: windowHeight / 2,
      }] },
      currentItemTransform,
    ]);
    if (itemsToRender[1]) {
      itemStyles.push([
        styles.item,
        nextItemTransform,
      ]);
    }
  }
  return (
    <View style={styles.container}>
      <PanGestureHandler
        ref={panRef}
        avgTouches
        onGestureEvent={onPanEvent}
        onHandlerStateChange={onPanEvent}
      >
        <Animated.View style={styles.itemContainer}>
          {(itemsToRender.length === 2 ? [1, 0] : itemsToRender.length === 1 ? [0] : []).map(i => {
            const style = itemStyles[i];
            return (
              <Animated.View key={itemsToRender[i]} style={style}>
                <Text style={styles.text}>{itemsToRender[i]}</Text>
              </Animated.View>
            )
          })}
        </Animated.View>
      </PanGestureHandler>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: 600,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  itemContainer: {
    paddingHorizontal: 0,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  item: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '60%',
    opacity: 0.6,
    backgroundColor: 'green',
  },
  text: {
    fontSize: 80,
    textAlign: 'center',
    color: 'white',
  },
});

// simulate heavy operations on the JS thread
const OP_DURATION = 100;
const OP_TIMEOUT = 0;

const heavyOp = () => {
  const start = new Date().getTime();
  while (new Date().getTime() < start + OP_DURATION) {
    // do nothing
  }
  setTimeout(heavyOp, OP_TIMEOUT);
}
setTimeout(heavyOp, 0);
