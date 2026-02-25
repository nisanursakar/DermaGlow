import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Ellipse, Line } from 'react-native-svg';
import type { CameraMode } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_PADDING = 24;
const OVAL_WIDTH = SCREEN_WIDTH - PREVIEW_PADDING * 2;
const OVAL_HEIGHT = OVAL_WIDTH * 1.2;
const CENTER_X = OVAL_WIDTH / 2;
const CENTER_Y = OVAL_HEIGHT / 2;

type CameraOverlayProps = {
  mode: CameraMode;
};

export default function CameraOverlay({ mode }: CameraOverlayProps) {
  if (mode === 'skin') {
    return (
      <View style={styles.overlay} pointerEvents="none">
        <Svg width={OVAL_WIDTH} height={OVAL_HEIGHT} style={styles.ovalSvg}>
          <Ellipse
            cx={CENTER_X}
            cy={CENTER_Y}
            rx={CENTER_X - 20}
            ry={CENTER_Y - 20}
            stroke="rgba(255,255,255,0.8)"
            strokeWidth={2}
            fill="transparent"
          />
        </Svg>
      </View>
    );
  }

  // Scalp mode: grid overlay
  const gridLines = 4;
  const spacing = OVAL_WIDTH / (gridLines + 1);

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Svg width={OVAL_WIDTH} height={OVAL_HEIGHT} style={styles.ovalSvg}>
        {Array.from({ length: gridLines }).map((_, i) => {
          const x = spacing * (i + 1);
          return (
            <Line
              key={`v-${i}`}
              x1={x}
              y1={0}
              x2={x}
              y2={OVAL_HEIGHT}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={1}
            />
          );
        })}
        {Array.from({ length: gridLines }).map((_, i) => {
          const y = (OVAL_HEIGHT / (gridLines + 1)) * (i + 1);
          return (
            <Line
              key={`h-${i}`}
              x1={0}
              y1={y}
              x2={OVAL_WIDTH}
              y2={y}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={1}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ovalSvg: {
    alignSelf: 'center',
  },
});
