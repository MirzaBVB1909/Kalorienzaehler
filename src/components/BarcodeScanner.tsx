import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../lib/theme';
import { Button } from './ui';

/** iOS/Android-Version (z. B. in Expo Go): nutzt die Kamera über expo-camera. */
export default function BarcodeScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [done, setDone] = useState(false);

  if (!permission) return <View style={styles.box} />;

  if (!permission.granted) {
    return (
      <View style={[styles.box, styles.center]}>
        <Text style={styles.text}>📷 Für den Barcode-Scanner braucht die App Zugriff auf die Kamera.</Text>
        <Button title="Kamera erlauben" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={
          done
            ? undefined
            : ({ data }) => {
                setDone(true);
                onDetected(data);
              }
        }
      />
      <View pointerEvents="none" style={styles.frame} />
      <Text style={styles.hint}>Strichcode in den Rahmen halten</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: 260, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', marginBottom: 12 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12, backgroundColor: colors.card },
  text: { color: colors.text, textAlign: 'center', lineHeight: 21 },
  frame: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: '32%',
    bottom: '32%',
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: 12,
  },
  hint: { position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', color: '#fff', fontWeight: '600' },
});
