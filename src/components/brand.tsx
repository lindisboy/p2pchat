import { Image, StyleSheet, Text, View } from 'react-native';
import { Spacing, Type } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';

export function Brand({ texture = false }: { texture?: boolean }) {
  const t = useTheme();
  const dark = useIsDark();
  return (
    <View style={{ gap: Spacing.lg, flexShrink: 1, width: texture ? '100%' : undefined }}>
      <View style={styles.wordmark} accessibilityLabel="P2PCHAT">
        <Image
          accessible={false}
          source={dark ? require('../../assets/branding/p2pchat/symbol-reverse.png') : require('../../assets/branding/p2pchat/symbol.png')}
          style={styles.symbol}
          resizeMode="contain"
        />
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[Type.hero, { color: t.text, flexShrink: 1 }]} accessibilityElementsHidden>P2PCHAT</Text>
      </View>
      {texture && (
        <Image accessible={false} source={require('../../assets/branding/p2pchat/texture-band.png')} style={styles.texture} resizeMode="cover" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  symbol: { width: 48, height: 48 },
  texture: { width: '100%', height: 64 },
});
