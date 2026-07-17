import type { ControllerType } from "../hooks/useGamepad";

interface Props {
  type: ControllerType;
}

function SvgIcon({ path, flip }: { path: string; flip?: boolean }) {
  return (
    <img
      src={path}
      alt=""
      draggable={false}
      style={{
        width: 28,
        height: 28,
        display: "block",
        transform: flip ? "scaleX(-1)" : undefined,
      }}
    />
  );
}

export function ControllerIcons({ type }: Props) {
  if (type === "ps") {
    return {
      ConfirmIcon: () => <SvgIcon path="/icons/PS_iconpack/Button - PS L1.svg" />,
      BackIcon: () => <SvgIcon path="/icons/PS_iconpack/Button - PS R1.svg" />,
      LbIcon: () => <SvgIcon path="/icons/PS_iconpack/Button - PS L1.svg" />,
      RbIcon: () => <SvgIcon path="/icons/PS_iconpack/Button - PS R1.svg" />,
      DpadNav: () => <SvgIcon path="/icons/PS_iconpack/Button - PS Directional Arrows.svg" />,
    };
  }

  if (type === "xbox") {
    return {
      ConfirmIcon: () => <SvgIcon path="/icons/XBOX_iconpack/button_xbox_digital_a_1.svg" />,
      BackIcon: () => <SvgIcon path="/icons/XBOX_iconpack/button_xbox_digital_b_1.svg" />,
      LbIcon: () => <SvgIcon path="/icons/XBOX_iconpack/button_xbox_digital_bumper_dark_1.svg" />,
      RbIcon: () => <SvgIcon path="/icons/XBOX_iconpack/button_xbox_digital_bumper_dark_1.svg" flip />,
      DpadNav: () => <SvgIcon path="/icons/XBOX_iconpack/button_xbox_dpad_dark_1.svg" />,
    };
  }

  return {
    ConfirmIcon: () => <span style={{ fontSize: 16, fontWeight: 600, opacity: 0.5 }}>✓</span>,
    BackIcon: () => <span style={{ fontSize: 16, fontWeight: 600, opacity: 0.5 }}>✕</span>,
    LbIcon: () => <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.5 }}>◀</span>,
    RbIcon: () => <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.5 }}>▶</span>,
    DpadNav: () => <span style={{ fontSize: 16, fontWeight: 600, opacity: 0.5 }}>◆</span>,
  };
}
