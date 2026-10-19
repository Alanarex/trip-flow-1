// app/index.tsx - Redirect to trips list
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the trips list page
  return <Redirect href="/trips" />;
}
