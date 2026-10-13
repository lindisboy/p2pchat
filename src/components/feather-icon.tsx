import Svg, { Path } from 'react-native-svg';

const plusPath = 'M12 5v14M5 12h14';

export function FeatherIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
      <Path d={plusPath} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
