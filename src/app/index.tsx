import { Redirect, type Href } from 'expo-router';

export default function IndexRoute() {
  return <Redirect href={'/(tabs)/private' as Href} />;
}
