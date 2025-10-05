import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, Text, View } from "react-native";
import Slider from "@react-native-community/slider";

import { Colors } from "../constants";
import { plannerStyles as styles } from "../styles";
import { HourDatum } from "../types";
import { Badge } from "../components/Badge";

interface TimeSelectionProps {
  hour: HourDatum | null;
  idx: number;
  maxIdx: number;
  themeColor: string;
  onChange: (value: number) => void;
}

export function TimeSelection({ hour, idx, maxIdx, themeColor, onChange }: TimeSelectionProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [bubbleWidth, setBubbleWidth] = useState(0);
  const bubbleVal = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;

  const safeTrack = trackWidth > 0 ? trackWidth : 1;
  const safeHalf = Number.isFinite(bubbleWidth) ? bubbleWidth / 2 : 0;

  useEffect(() => {
    Animated.timing(bubbleVal, { toValue: idx, duration: 0, useNativeDriver: false }).start();
  }, [idx, bubbleVal]);

  const handleSlide = (value: number) => {
    onChange(value);
    Animated.timing(bubbleVal, {
      toValue: value,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const onSlidingStart = () =>
    Animated.timing(bubbleOpacity, { toValue: 1, duration: 140, useNativeDriver: false }).start();
  const onSlidingComplete = () =>
    Animated.timing(bubbleOpacity, { toValue: 0, duration: 220, useNativeDriver: false }).start();

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Time window</Text>
      <View style={styles.sliderWrap} onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}>
        {trackWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.bubble,
              {
                opacity: bubbleOpacity,
                transform: [
                  {
                    translateX: bubbleVal.interpolate({
                      inputRange: [0, maxIdx],
                      outputRange: [-safeHalf, Math.max(safeTrack - 32 - safeHalf, 0)],
                      extrapolate: "clamp",
                    }),
                  },
                  { translateY: bubbleOpacity.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                  { scale: bubbleOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) },
                ],
              },
            ]}
          >
            <View
              style={[styles.bubbleInner, { borderColor: themeColor + "66" }]}
              onLayout={(e: LayoutChangeEvent) => setBubbleWidth(e.nativeEvent.layout.width)}
            >
              <Text style={styles.bubbleText}>{hour?.hourLabel ?? "--"}</Text>
            </View>
          </Animated.View>
        )}

        <Slider
          style={{ width: "100%" }}
          value={idx}
          minimumValue={0}
          maximumValue={maxIdx}
          step={1}
          minimumTrackTintColor={themeColor}
          maximumTrackTintColor={Colors.border}
          thumbTintColor={themeColor}
          onValueChange={(v) => handleSlide(v as number)}
          onSlidingStart={onSlidingStart}
          onSlidingComplete={onSlidingComplete}
        />
      </View>

      <View style={styles.inline}>
        <Text style={styles.live}>
          {hour?.hourLabel ?? "--"} • {hour?.tempF ?? "--"}°
        </Text>
        <Badge color={themeColor} label={hour?.condition ?? "—"} />
      </View>
    </View>
  );
}