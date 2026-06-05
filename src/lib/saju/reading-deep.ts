import { OhaengCount } from "./data";
import { Category } from "../categories";
import { dominant, weakest, KO_LABEL } from "./reading-dummy";

export type DeepReading = { sections: { title: string; body: string }[] };

const FLOW: Record<Category, string> = {
  general: "전반적으로 기운이 한쪽으로 흐르는 시기예요.",
  love: "관계에서 마음이 먼저 움직이는 시기예요.",
  wealth: "돈과 기회를 보는 눈이 예민해지는 시기예요.",
  health: "몸이 보내는 신호에 더 솔직해지는 시기예요.",
  relationship: "두 사람 사이의 결이 또렷해지는 시기예요.",
};

export function generateDeepBite(category: Category, count: OhaengCount): DeepReading {
  const dom = KO_LABEL[dominant(count)];
  const weak = KO_LABEL[weakest(count)];
  return {
    sections: [
      {
        title: "요즘 당신의 흐름",
        body: `${FLOW[category]} 특히 ${dom} 기운이 두드러져, 그 방향의 일에서 자기다움이 잘 드러나요. 욕심을 조금만 덜면 흐름이 한결 부드러워집니다.`,
      },
      {
        title: "이런 결정이 잘 맞아요",
        body: `${dom} 기운을 살리는 선택이 잘 맞아요. 새로 벌이기보다 하던 것을 또렷하게 마무리하는 쪽으로, 익숙하고 잘하는 영역에서 한 걸음 더 나아가 보세요.`,
      },
      {
        title: "이 타이밍은 한 박자 쉬어가기",
        body: `${weak} 기운이 약해, 세심함과 마무리가 필요한 일에서는 서두르면 아쉬움이 남을 수 있어요. 급한 결정은 하루만 더 묵혀두면 후회가 줄어듭니다.`,
      },
    ],
  };
}
