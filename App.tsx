import React, { useState } from 'react';
import { View, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { Screen } from './Screen.tsx';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

LogBox.ignoreLogs([
  'Constants.manifest has been deprecated in favor of Constants.expoConfig',
]);

enableScreens();

const items = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const App = () => {
  let [state, setState] = useState(items);
  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Screen
            items={state.slice(0, 2)}
            nextItemAction={() => setState(state.slice(1))}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </View>
  );
}

export default App;
