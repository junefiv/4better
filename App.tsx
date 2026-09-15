import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TamaguiProvider } from '@tamagui/core';
import config from './tamagui.config';
import { useAppModel } from './src/state/useAppModel';
import { Route } from './src/types/domain';
import { color } from './src/design/tokens';
import { FloatingMenu } from './src/components/FloatingMenu';
import { HomeScreen } from './src/screens/HomeScreen';
import { AdminScreen, AgreementScreen, AuthScreen, CreateLeagueScreen, ExtensionScreen, JoinScreen, LeagueScreen, ProfileScreen, RecapScreen, ResultsScreen, ReviewsScreen, StatesScreen, SubmitScreen, TimerScreen } from './src/screens/V1Screens';
import { CaptureScreen } from './src/screens/CaptureScreen';

export default function App() {
  return <TamaguiProvider config={config} defaultTheme="light"><SafeAreaProvider><AppRouter /></SafeAreaProvider></TamaguiProvider>;
}

function AppRouter() {
  const model = useAppModel();
  const [route, setRoute] = useState<Route>('auth');
  const [history, setHistory] = useState<Route[]>([]);
  const navigate = (next: Route) => { if (next === route) return; setHistory((items) => [...items, route].slice(-12)); setRoute(next); };
  const back = () => { const previous = history.at(-1) ?? 'home'; setHistory((items) => items.slice(0, -1)); setRoute(previous); };
  useEffect(() => { if (model.hydrated && model.data.signedIn && route === 'auth') setRoute('home'); }, [model.hydrated, model.data.signedIn, route]);
  useEffect(() => {
    const open = ({ url }: { url: string }) => { if (url.includes('/invite/')) navigate('agreement'); };
    Linking.getInitialURL().then((url) => url && open({ url }));
    const subscription = Linking.addEventListener('url', open);
    return () => subscription.remove();
  }, []);
  const common = { model, back, navigate };
  let screen: React.ReactNode;
  switch (route) {
    case 'auth': screen = <AuthScreen model={model} navigate={navigate} />; break;
    case 'home': screen = <HomeScreen model={model} navigate={navigate} />; break;
    case 'create': screen = <CreateLeagueScreen {...common} />; break;
    case 'join': screen = <JoinScreen {...common} />; break;
    case 'agreement': screen = <AgreementScreen {...common} />; break;
    case 'league': screen = <LeagueScreen {...common} />; break;
    case 'timer': screen = <TimerScreen {...common} />; break;
    case 'submit': screen = <SubmitScreen {...common} />; break;
    case 'reviews': screen = <ReviewsScreen model={model} back={back} />; break;
    case 'results': screen = <ResultsScreen model={model} back={back} />; break;
    case 'recap': screen = <RecapScreen {...common} />; break;
    case 'capture': screen = <CaptureScreen back={back} done={() => navigate('recap')} />; break;
    case 'extension': screen = <ExtensionScreen {...common} />; break;
    case 'profile': screen = <ProfileScreen {...common} />; break;
    case 'admin': screen = <AdminScreen back={back} />; break;
    case 'states': screen = <StatesScreen model={model} back={back} />; break;
    default: screen = <HomeScreen model={model} navigate={navigate} />;
  }
  const showMenu = model.data.signedIn && !['auth', 'capture', 'timer'].includes(route);
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}><StatusBar style="dark" /><View style={styles.app}>{screen}{showMenu ? <FloatingMenu current={route} navigate={navigate} onNew={() => navigate('create')} /> : null}</View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: color.canvas }, app: { flex: 1, backgroundColor: color.canvas } });
