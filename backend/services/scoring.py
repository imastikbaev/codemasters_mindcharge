from typing import List, Optional
from models import AILevel, AgeGroup


THRESHOLDS = {
    "norm": (0, 30),
    "elevated": (31, 55),
    "burnout_risk": (56, 75),
    "critical": (76, 100),
}


def calculate_score(answers: List[int], questions) -> tuple[float, float, AILevel]:
    if not questions or not answers:
        return 0.0, 0.0, AILevel.NORM

    total_weight = sum(q.weight for q in questions)
    min_possible = sum(q.scale_min * q.weight for q in questions)
    max_possible = sum(q.scale_max * q.weight for q in questions)

    raw = 0.0
    for i, q in enumerate(questions):
        if i >= len(answers):
            break
        val = answers[i]
        if q.reverse_scored:
            val = q.scale_max - val + q.scale_min
        raw += val * q.weight

    if max_possible == min_possible:
        normalized = 0.0
    else:
        normalized = (raw - min_possible) / (max_possible - min_possible) * 100

    level = AILevel.NORM
    if normalized <= 30:
        level = AILevel.NORM
    elif normalized <= 55:
        level = AILevel.ELEVATED
    elif normalized <= 75:
        level = AILevel.BURNOUT_RISK
    else:
        level = AILevel.CRITICAL

    return raw, normalized, level


LEVEL_LABELS = {
    "ru": {
        AILevel.NORM: "Норма",
        AILevel.ELEVATED: "Повышенный стресс",
        AILevel.BURNOUT_RISK: "Риск выгорания",
        AILevel.CRITICAL: "Критическое состояние",
    },
    "en": {
        AILevel.NORM: "Normal",
        AILevel.ELEVATED: "Elevated Stress",
        AILevel.BURNOUT_RISK: "Burnout Risk",
        AILevel.CRITICAL: "Critical State",
    },
    "kz": {
        AILevel.NORM: "Қалыпты",
        AILevel.ELEVATED: "Жоғары стресс",
        AILevel.BURNOUT_RISK: "Күйіп-жану қаупі",
        AILevel.CRITICAL: "Сын жағдай",
    },
}
