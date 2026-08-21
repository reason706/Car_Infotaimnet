import React from 'react';
import { View } from 'react-native';
import Svg, {
  Path, Rect, Defs, LinearGradient, Stop, RadialGradient, Circle, Ellipse, G,
} from 'react-native-svg';

type Props = {
  width?: number;
  height?: number;
  brakeGlow?: boolean;
  testID?: string;
};

/**
 * Top-down modern sedan illustration (all-SVG). Clean silhouette with:
 * hood, windshield, panoramic sunroof, rear window, trunk, side mirrors,
 * headlights, rear brake bar and brake-light halos, and visible wheels.
 */
export function TopDownCar({ width = 240, height = 480, brakeGlow = true, testID }: Props) {
  const cx = width / 2;
  const bodyW = width * 0.72;
  const bodyH = height * 0.94;
  const bodyX = cx - bodyW / 2;
  const bodyY = (height - bodyH) / 2;

  const wheelW = 12;
  const wheelH = bodyH * 0.1;
  const frontWheelY = bodyY + bodyH * 0.14;
  const rearWheelY = bodyY + bodyH * 0.74;

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }} testID={testID}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="paint" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#191B21" />
            <Stop offset="0.15" stopColor="#2E323A" />
            <Stop offset="0.5" stopColor="#3A3E46" />
            <Stop offset="0.85" stopColor="#2E323A" />
            <Stop offset="1" stopColor="#191B21" />
          </LinearGradient>
          <LinearGradient id="paintTop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#42464E" />
            <Stop offset="0.25" stopColor="#22252B" />
            <Stop offset="0.75" stopColor="#1B1D22" />
            <Stop offset="1" stopColor="#2A2D34" />
          </LinearGradient>
          <LinearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0A0C10" />
            <Stop offset="0.5" stopColor="#1C1F27" />
            <Stop offset="1" stopColor="#0A0C10" />
          </LinearGradient>
          <RadialGradient id="brake" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#FF3B3B" stopOpacity="1" />
            <Stop offset="0.35" stopColor="#FF3B3B" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#FF3B3B" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="head" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#FFF6D5" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#FFF6D5" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Ground shadow */}
        <Ellipse cx={cx} cy={bodyY + bodyH + 10} rx={bodyW * 0.55} ry={10} fill="#000" opacity={0.55} />

        {/* WHEELS (drawn under body so tires poke out) */}
        {[
          { x: bodyX - 4, y: frontWheelY },
          { x: bodyX + bodyW - wheelW + 4, y: frontWheelY },
          { x: bodyX - 4, y: rearWheelY },
          { x: bodyX + bodyW - wheelW + 4, y: rearWheelY },
        ].map((p, i) => (
          <G key={i}>
            <Rect x={p.x} y={p.y} width={wheelW} height={wheelH} rx={3} fill="#0A0B0D" />
            <Rect x={p.x + 2} y={p.y + 3} width={wheelW - 4} height={wheelH - 6} rx={2} fill="#191B21" />
          </G>
        ))}

        {/* Main body — rounded rectangle with subtle nose/tail tapers */}
        <Path
          d={`
            M ${bodyX + 24} ${bodyY + 2}
            Q ${cx} ${bodyY - 4}, ${bodyX + bodyW - 24} ${bodyY + 2}
            Q ${bodyX + bodyW + 2} ${bodyY + 20}, ${bodyX + bodyW + 2} ${bodyY + bodyH * 0.5}
            Q ${bodyX + bodyW + 2} ${bodyY + bodyH - 20}, ${bodyX + bodyW - 24} ${bodyY + bodyH - 2}
            Q ${cx} ${bodyY + bodyH + 4}, ${bodyX + 24} ${bodyY + bodyH - 2}
            Q ${bodyX - 2} ${bodyY + bodyH - 20}, ${bodyX - 2} ${bodyY + bodyH * 0.5}
            Q ${bodyX - 2} ${bodyY + 20}, ${bodyX + 24} ${bodyY + 2}
            Z
          `}
          fill="url(#paint)"
          stroke="#050608"
          strokeWidth={1}
        />

        {/* Long center highlight strip */}
        <Path
          d={`M ${cx} ${bodyY + 30} L ${cx} ${bodyY + bodyH - 30}`}
          stroke="#FFFFFF"
          strokeWidth={0.8}
          opacity={0.07}
        />

        {/* HOOD (front panel — subtle darker plane) */}
        <Path
          d={`
            M ${bodyX + 26} ${bodyY + 8}
            Q ${cx} ${bodyY + 2}, ${bodyX + bodyW - 26} ${bodyY + 8}
            L ${bodyX + bodyW - 34} ${bodyY + bodyH * 0.22}
            Q ${cx} ${bodyY + bodyH * 0.2}, ${bodyX + 34} ${bodyY + bodyH * 0.22}
            Z
          `}
          fill="url(#paintTop)"
          opacity={0.8}
        />

        {/* WINDSHIELD */}
        <Path
          d={`
            M ${bodyX + 36} ${bodyY + bodyH * 0.24}
            Q ${cx} ${bodyY + bodyH * 0.2}, ${bodyX + bodyW - 36} ${bodyY + bodyH * 0.24}
            L ${bodyX + bodyW - 44} ${bodyY + bodyH * 0.4}
            Q ${cx} ${bodyY + bodyH * 0.38}, ${bodyX + 44} ${bodyY + bodyH * 0.4}
            Z
          `}
          fill="url(#glass)"
        />

        {/* ROOF + PANORAMIC SUNROOF */}
        <Rect
          x={bodyX + 44}
          y={bodyY + bodyH * 0.4}
          width={bodyW - 88}
          height={bodyH * 0.2}
          rx={4}
          fill="#0B0D11"
        />
        <Rect
          x={bodyX + 50}
          y={bodyY + bodyH * 0.43}
          width={bodyW - 100}
          height={bodyH * 0.14}
          rx={3}
          fill="url(#glass)"
        />
        <Rect
          x={bodyX + 50}
          y={bodyY + bodyH * 0.435}
          width={bodyW - 100}
          height={1.5}
          fill="#FFFFFF"
          opacity={0.1}
        />

        {/* REAR WINDOW */}
        <Path
          d={`
            M ${bodyX + 44} ${bodyY + bodyH * 0.6}
            L ${bodyX + bodyW - 44} ${bodyY + bodyH * 0.6}
            L ${bodyX + bodyW - 38} ${bodyY + bodyH * 0.76}
            Q ${cx} ${bodyY + bodyH * 0.79}, ${bodyX + 38} ${bodyY + bodyH * 0.76}
            Z
          `}
          fill="url(#glass)"
        />

        {/* TRUNK panel */}
        <Path
          d={`
            M ${bodyX + 32} ${bodyY + bodyH * 0.78}
            Q ${cx} ${bodyY + bodyH * 0.82}, ${bodyX + bodyW - 32} ${bodyY + bodyH * 0.78}
            L ${bodyX + bodyW - 26} ${bodyY + bodyH - 8}
            Q ${cx} ${bodyY + bodyH}, ${bodyX + 26} ${bodyY + bodyH - 8}
            Z
          `}
          fill="url(#paintTop)"
          opacity={0.85}
        />

        {/* Panel gap lines */}
        <Path d={`M ${bodyX + 6} ${bodyY + bodyH * 0.5} L ${bodyX + bodyW - 6} ${bodyY + bodyH * 0.5}`} stroke="#050608" strokeWidth={0.7} opacity={0.7} />
        <Path d={`M ${bodyX + 6} ${bodyY + bodyH * 0.22} L ${bodyX + bodyW - 6} ${bodyY + bodyH * 0.22}`} stroke="#050608" strokeWidth={0.5} opacity={0.5} />
        <Path d={`M ${bodyX + 6} ${bodyY + bodyH * 0.78} L ${bodyX + bodyW - 6} ${bodyY + bodyH * 0.78}`} stroke="#050608" strokeWidth={0.5} opacity={0.5} />

        {/* SIDE MIRRORS */}
        <Path
          d={`M ${bodyX - 2} ${bodyY + bodyH * 0.28}
              Q ${bodyX - 10} ${bodyY + bodyH * 0.3}, ${bodyX - 8} ${bodyY + bodyH * 0.34}
              L ${bodyX + 4} ${bodyY + bodyH * 0.34}
              L ${bodyX + 4} ${bodyY + bodyH * 0.28} Z`}
          fill="#1B1D22"
          stroke="#050608"
          strokeWidth={0.5}
        />
        <Path
          d={`M ${bodyX + bodyW + 2} ${bodyY + bodyH * 0.28}
              Q ${bodyX + bodyW + 10} ${bodyY + bodyH * 0.3}, ${bodyX + bodyW + 8} ${bodyY + bodyH * 0.34}
              L ${bodyX + bodyW - 4} ${bodyY + bodyH * 0.34}
              L ${bodyX + bodyW - 4} ${bodyY + bodyH * 0.28} Z`}
          fill="#1B1D22"
          stroke="#050608"
          strokeWidth={0.5}
        />

        {/* HEADLIGHTS */}
        <G>
          <Circle cx={bodyX + 40} cy={bodyY + 6} r={20} fill="url(#head)" />
          <Circle cx={bodyX + bodyW - 40} cy={bodyY + 6} r={20} fill="url(#head)" />
          <Rect x={bodyX + 30} y={bodyY + 4} width={30} height={5} rx={2} fill="#FFF6D5" opacity={0.85} />
          <Rect x={bodyX + bodyW - 60} y={bodyY + 4} width={30} height={5} rx={2} fill="#FFF6D5" opacity={0.85} />
          {/* Front grille */}
          <Rect x={bodyX + bodyW * 0.36} y={bodyY} width={bodyW * 0.28} height={4} rx={2} fill="#050608" />
        </G>

        {/* CENTER BRAKE BAR */}
        {brakeGlow && (
          <Rect
            x={bodyX + bodyW * 0.28}
            y={bodyY + bodyH * 0.78 - 3}
            width={bodyW * 0.44}
            height={3}
            rx={1.5}
            fill="#FF3B3B"
            opacity={0.85}
          />
        )}

        {/* REAR BRAKE LIGHTS */}
        {brakeGlow && (
          <G>
            <Circle cx={bodyX + 30} cy={bodyY + bodyH - 6} r={22} fill="url(#brake)" />
            <Circle cx={bodyX + bodyW - 30} cy={bodyY + bodyH - 6} r={22} fill="url(#brake)" />
            <Rect x={bodyX + 18} y={bodyY + bodyH - 14} width={26} height={5} rx={2.5} fill="#FF3B3B" />
            <Rect x={bodyX + bodyW - 44} y={bodyY + bodyH - 14} width={26} height={5} rx={2.5} fill="#FF3B3B" />
          </G>
        )}
      </Svg>
    </View>
  );
}
