import { useFonts } from 'expo-font';

export function useAppFonts() {
  return useFonts({
    WantedSansRegular: require('../../assets/fonts/WantedSans-Regular.ttf'),
    WantedSansMedium: require('../../assets/fonts/WantedSans-Medium.ttf'),
    WantedSansSemiBold: require('../../assets/fonts/WantedSans-SemiBold.ttf'),
    WantedSansBold: require('../../assets/fonts/WantedSans-Bold.ttf'),
    Paperlogy7Bold: require('../../assets/fonts/Paperlogy-7Bold.ttf'),
    Paperlogy8ExtraBold: require('../../assets/fonts/Paperlogy-8ExtraBold.ttf'),
    Paperlogy9Black: require('../../assets/fonts/Paperlogy-9Black.ttf'),
  });
}
