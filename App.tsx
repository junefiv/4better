import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAppModel } from './src/state/useAppModel';
import { Route } from './src/types/domain';
import { color } from './src/design/tokens';
import { paperTheme } from './src/theme/paper';
import { FloatingMenu } from './src/components/FloatingMenu';
import { HomeScreen } from './src/screens/HomeScreen';
import { AdminScreen, AgreementScreen, AuthScreen, CreateLeagueScreen, ExtensionScreen, JoinScreen, LeagueScreen, ProfileScreen, RecapScreen, ResultsScreen, ReviewsScreen, StatesScreen, SubmitScreen, TimerScreen } from './src/screens/V1Screens';
import { CaptureScreen } from './src/screens/CaptureScreen';
import { MorningScreen } from './src/screens/MorningScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <AppRouter />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

function AppRouter() {
  const model = useAppModel();
  const [route, setRoute] = useState<Route>('auth');
  const [history, setHistory] = useState<Route[]>([]);
  const navigate = (next: Route) => { if (next === route) return; setHistory((items) => [...items, route].slice(-12)); setRoute(next); };
  const back = () => { const previous = history.at(-1) ?? 'home'; setHistory((items) => items.slice(0, -1)); setRoute(previous); };
  useEffect(() => { if (model.hydrated && model.data.signedIn && !model.needsNicknameSetup && route === 'auth') setRoute('home'); }, [model.hydrated, model.data.signedIn, model.needsNicknameSetup, route]);
  useEffect(() => { if (model.hydrated && !model.data.signedIn && route !== 'auth') { setHistory([]); setRoute('auth'); } }, [model.hydrated, model.data.signedIn, route]);
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
    case 'morning': screen = <MorningScreen {...common} />; break;
    case 'extension': screen = <ExtensionScreen {...common} />; break;
    case 'profile': screen = <ProfileScreen {...common} />; break;
    case 'admin': screen = <AdminScreen back={back} />; break;
    case 'states': screen = <StatesScreen model={model} back={back} />; break;
    default: screen = <HomeScreen model={model} navigate={navigate} />;
  }
  const showMenu = model.data.signedIn && !['auth', 'capture', 'timer', 'morning'].includes(route);
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}><StatusBar style="dark" /><View style={styles.app}>{screen}{showMenu ? <FloatingMenu current={route} navigate={navigate} /> : null}</View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: color.canvas }, app: { flex: 1, backgroundColor: color.canvas } });
