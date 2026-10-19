// Redirect from Tab 1 to trips list
import { Redirect } from 'expo-router';

export default function TabOneScreen() {
  return <Redirect href="/trips" />;
}
