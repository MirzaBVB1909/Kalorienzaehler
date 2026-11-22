import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../lib/theme';

/** Web-Version (auch Web-App auf dem iPhone): Live-Kamerabild, erkennt EAN/UPC-Barcodes. */
export default function BarcodeScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let controls: IScannerControls | null = null;
    let done = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Dein Browser erlaubt hier keinen Kamerazugriff. Tippe die Zahlen unter dem Strichcode unten ein.');
      return;
    }

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
    ]);
    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 });

    reader
      .decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } } }, videoRef.current ?? undefined, (result, _err, c) => {
        if (result && !done) {
          done = true;
          c.stop();
          onDetectedRef.current(result.getText());
        }
      })
      .then((c) => {
        controls = c;
        if (done) c.stop();
      })
      .catch(() =>
        setError('Kein Zugriff auf die Kamera. Erlaube den Kamerazugriff in den Einstellungen oder tippe die Zahlen unter dem Strichcode unten ein.'),
      );

    return () => {
      done = true;
      controls?.stop();
    };
  }, []);

  if (error) {
    return (
      <View style={[styles.box, styles.center]}>
        <Text style={styles.error}>📷 {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <View pointerEvents="none" style={styles.frame} />
      <Text style={styles.hint}>Strichcode in den Rahmen halten</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: 260, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', marginBottom: 12 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.card },
  error: { color: colors.text, textAlign: 'center', lineHeight: 21 },
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
