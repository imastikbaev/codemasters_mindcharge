import re
import json
from typing import List
from config import settings
from models import AILevel

# ─── Client setup: OpenAI → Groq → fallback ─────────────────────────────────

def _make_client():
    if settings.OPENAI_API_KEY:
        from openai import OpenAI
        return "openai", OpenAI(api_key=settings.OPENAI_API_KEY), settings.OPENAI_MODEL
    if settings.GROQ_API_KEY:
        from groq import Groq
        return "groq", Groq(api_key=settings.GROQ_API_KEY), settings.GROQ_MODEL
    return "none", None, None

AI_PROVIDER, ai_client, AI_MODEL = _make_client()


def _chat_completion(system: str, messages: list, json_mode: bool = True) -> str:
    kwargs = dict(
        model=AI_MODEL,
        messages=[{"role": "system", "content": system}] + messages,
        temperature=0.8,
        max_tokens=600,
    )
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    if AI_PROVIDER == "openai":
        resp = ai_client.chat.completions.create(**kwargs)
    elif AI_PROVIDER == "groq":
        resp = ai_client.chat.completions.create(**kwargs)
    else:
        raise RuntimeError("No AI client available")

    return resp.choices[0].message.content


# ─── Prompts ─────────────────────────────────────────────────────────────────

CHAT_SYSTEM = {
    "ru": """Ты — AI-ассистент MindCharge по имени EMi. Ты тёплый, живой собеседник — как умный друг, который разбирается в психологии.

ГЛАВНОЕ ПРАВИЛО: сначала выслушай и поддержи человека. НЕ торопись предлагать тесты и курсы.

Как вести диалог:
- Первые 1-2 сообщения — только слушай, задавай уточняющие вопросы, проявляй эмпатию
- Давай конкретные советы и техники (дыхание, упражнения, мысли) когда человек рассказал о проблеме
- Тесты и курсы предлагай ТОЛЬКО если: человек сам спросил, или ты уже хорошо поговорили (3+ сообщений), или ситуация явно требует диагностики
- НЕ предлагай тест/курс в каждом сообщении — максимум раз за весь разговор
- Если человек в кризисе — будь рядом, не переключай на функции платформы

Стиль: короткие абзацы, живой язык, без канцелярщины. Говори на «ты».

Отвечай ТОЛЬКО в формате JSON:
{"reply": "твой ответ", "actions": []}

actions добавляй РЕДКО и только когда реально уместно:
{"type": "suggest_test", "label": "Пройти тест на стресс"}
{"type": "suggest_course", "label": "Курс по управлению стрессом"}""",

    "en": """You are EMi, MindCharge's AI assistant. You're a warm, genuine conversationalist — like a smart friend who understands psychology.

MAIN RULE: listen and support first. DON'T rush to suggest tests and courses.

How to have a conversation:
- First 1-2 messages: just listen, ask clarifying questions, show empathy
- Give specific advice and techniques once the person has shared their problem
- Only suggest tests/courses if: they asked, you've already had a good conversation (3+ messages), or the situation clearly needs assessment
- DON'T suggest a test/course in every message — at most once per conversation
- If someone is in crisis — be present, don't redirect to platform features

Style: short paragraphs, natural language, casual tone.

Reply ONLY in JSON format:
{"reply": "your response", "actions": []}

Add actions RARELY and only when truly appropriate:
{"type": "suggest_test", "label": "Take stress test"}
{"type": "suggest_course", "label": "Stress management course"}""",

    "kz": """Сен — MindCharge платформасының EMi атты AI-ассистентісің. Сен жылы, тірі әңгімелесуші — психологияны түсінетін ақылды досың сияқты.

НЕГІЗГІ ЕРЕЖЕ: алдымен тыңда және қолда. Тесттер мен курстарды асықпа ұсын.

Диалог жүргізу:
- Алғашқы 1-2 хабарламада тек тыңда, нақтылаушы сұрақтар қой, эмпатия көрсет
- Адам мәселесін айтқан соң нақты кеңес пен техникалар бер
- Тесттер мен курстарды ТЕК мынада ұсын: адам өзі сұраса, немесе 3+ хабарламадан кейін

Тек JSON форматында жауап бер:
{"reply": "жауабың", "actions": []}

actions-ты СИРЕК қос:
{"type": "suggest_test", "label": "Стресс тесті"}
{"type": "suggest_course", "label": "Курс"}""",
}

TEST_ANALYSIS_SYSTEM = {
    "ru": """Ты — психолог-консультант AI на платформе MindCharge. 
Проанализируй результаты психологического теста и дай поддерживающий, грамотный ответ.
Не пугай. Не ставь клинические диагнозы. Говори человечно и с заботой.
Ответь строго в JSON формате.""",
    "en": """You are an AI psychological consultant on MindCharge platform.
Analyze the psychological test results and give a supportive, professional response.
Don't scare. Don't make clinical diagnoses. Speak humanly and with care.
Reply strictly in JSON format.""",
    "kz": """Сен — MindCharge платформасындағы AI психолог-кеңесшісің.
Психологиялық тест нәтижелерін талда және қолдаушы, сауатты жауап бер.
Үрейлендірме. Клиникалық диагноз қойма. Адамгершілікпен және қамқорлықпен сөйле.
Тек JSON форматында жауап бер.""",
}


# ─── Rule-based fallback (when no API key) ───────────────────────────────────

RULES = {
    "ru": [
        (r"упражнени|дыхани|техник|релакс",
         "Попробуй технику **4-7-8**: вдохни на 4 счёта, задержи дыхание на 7, выдохни на 8. Повтори 3–4 раза — это быстро снимает напряжение.", []),
        (r"стресс|нервни|напряж|тревог|беспоко",
         "Стресс — сигнал, что тело и разум работают на пределе. Прямо сейчас: 3 глубоких вдоха, стакан воды, 5 минут без экрана. Хочешь пройти тест на стресс?",
         [{"type": "suggest_test", "label": "Тест на стресс PSS-10"}]),
        (r"устал|выгор|сил нет|нет сил|нет энерги|вымот",
         "Усталость — это не слабость, это сигнал о том, что тебе нужна забота о себе. Курс по профилактике выгорания поможет найти баланс.",
         [{"type": "suggest_course", "label": "Профилактика выгорания"}]),
        (r"грустн|плох|плохо|печал|тоскл|подавлен",
         "Мне жаль, что тебе сейчас нелегко. Это случается с каждым. Расскажи подробнее — что происходит? Иногда просто выговориться уже помогает.", []),
        (r"не могу сконцентрир|отвлека|прокрастина|откладыва",
         "Трудности с концентрацией часто связаны с перегрузкой. Попробуй технику Помодоро: 25 минут работы — 5 минут отдыха.",
         [{"type": "suggest_course", "label": "Курс по мотивации"}]),
        (r"не сплю|бессониц|сон|засну",
         "Проблемы со сном сильно влияют на самочувствие. За час до сна убери телефон, проветри комнату, сделай упражнение на расслабление.", []),
        (r"тест|проверить себя|узнать.*состоян",
         "Отличная идея! На платформе есть тесты на стресс (PSS-10), тревожность (GAD-7), выгорание (MBI) и мотивацию.",
         [{"type": "suggest_test", "label": "Выбрать тест"}]),
        (r"курс|обучени|хочу.*научить",
         "В библиотеке 5 курсов: управление стрессом, профилактика выгорания, эмоциональный интеллект, мотивация и mindfulness.",
         [{"type": "suggest_course", "label": "Открыть курсы"}]),
        (r"психолог|помощь специалист",
         "Обратиться к специалисту — правильный шаг. На платформе есть психолог учреждения. Линия помощи: 8-800-2000-122 (бесплатно).", []),
        (r"привет|здравствуй|добр|хай",
         "Привет! Я EMi, твой ассистент по психологическому благополучию 😊 Как ты себя чувствуешь сегодня?", []),
        (r"спасибо|благодар",
         "Рад помочь! Береги себя 💙", []),
        (r"mindfulness|медитаци|осознанност",
         "Mindfulness — практика присутствия в настоящем моменте. Начни с 5 минут в день: сиди тихо и наблюдай за дыханием.",
         [{"type": "suggest_course", "label": "Курс по Mindfulness"}]),
        (r"мотива|не хочу|лень|нет желани",
         "Потеря мотивации — частый признак усталости. Поставь одну маленькую цель на сегодня — маленькие победы восстанавливают энергию.",
         [{"type": "suggest_test", "label": "Тест на мотивацию"}]),
    ],
    "en": [
        (r"exercise|breath|relax|technique",
         "Try **4-7-8 breathing**: inhale 4 counts, hold 7, exhale 8. Repeat 3–4 times.", []),
        (r"stress|nervous|anxious|worried",
         "Stress is your body's signal it's overloaded. Right now: 3 deep breaths, a glass of water, 5 min away from screens.",
         [{"type": "suggest_test", "label": "Stress test PSS-10"}]),
        (r"tired|burnout|exhausted|no energy",
         "Tiredness is a signal you need self-care. The burnout prevention course can help you find balance.",
         [{"type": "suggest_course", "label": "Burnout prevention"}]),
        (r"sad|bad|down|depressed",
         "I'm sorry you're not feeling well. Tell me more — what's going on?", []),
        (r"test|check|assess",
         "The platform has tests for stress, anxiety, burnout and motivation.",
         [{"type": "suggest_test", "label": "Choose a test"}]),
        (r"course|learn",
         "5 courses available: stress management, burnout prevention, emotional intelligence, motivation, mindfulness.",
         [{"type": "suggest_course", "label": "Browse courses"}]),
        (r"hi|hello|hey",
         "Hi! I'm EMi, your MindCharge wellness assistant 😊 How are you feeling today?", []),
        (r"thank",
         "Happy to help! Take care 💙", []),
    ],
    "kz": [
        (r"жаттығ|тыныс|релакс",
         "**4-7-8 тыныс алу**: 4 санда дем ал, 7 санда ұста, 8 санда шығар. 3–4 рет қайтала.", []),
        (r"стресс|жүйке|мазасыз",
         "Стресс — шегіне жеткенінің белгісі. Қазір 3 терең дем ал, су іш.",
         [{"type": "suggest_test", "label": "Стресс тесті"}]),
        (r"шарша|күйіп|энерги жоқ",
         "Шаршау — өзіңді күту керек деген сигнал.",
         [{"type": "suggest_course", "label": "Күйіп-жануды болдырмау"}]),
        (r"сәлем|қайырлы",
         "Сәлем! Мен EMi — MindCharge ассистентімін 😊 Бүгін өзіңді қалай сезінесің?", []),
        (r"рахмет",
         "Көмектесе алғаныма қуаныштымын! Өзіңді күт 💙", []),
        (r"тест",
         "Платформада стресс, мазасыздық, күйіп-жану және мотивация тесттері бар.",
         [{"type": "suggest_test", "label": "Тест тапсыру"}]),
        (r"курс",
         "Платформада 5 курс бар: стрессті басқару, күйіп-жануды болдырмау, эмоционалдық интеллект, мотивация және зейінділік.",
         [{"type": "suggest_course", "label": "Курстар"}]),
    ],
}

DEFAULT_REPLIES = {
    "ru": "Понимаю. Расскажи подробнее — что именно происходит? Я здесь, чтобы помочь.",
    "en": "I understand. Tell me more — what's going on? I'm here to help.",
    "kz": "Түсінемін. Толығырақ айт — не болды? Мен помогуға дайынмын.",
}


def _rule_based_reply(text: str, language: str) -> dict:
    lang_rules = RULES.get(language, RULES["ru"])
    for rule in lang_rules:
        pattern, reply, actions = rule
        if re.search(pattern, text.lower(), re.IGNORECASE):
            return {"reply": reply, "actions": actions}
    return {"reply": DEFAULT_REPLIES.get(language, DEFAULT_REPLIES["ru"]), "actions": []}


# ─── Public API ──────────────────────────────────────────────────────────────

def chat_with_ai(messages: list, language: str = "ru") -> dict:
    last_user_msg = next(
        (m["content"] for m in reversed(messages) if m.get("role") == "user"), ""
    )

    if not ai_client:
        return _rule_based_reply(last_user_msg, language)

    lang = language if language in CHAT_SYSTEM else "ru"
    try:
        raw = _chat_completion(CHAT_SYSTEM[lang], messages, json_mode=True)
        result = json.loads(raw)
        if "reply" not in result:
            result["reply"] = raw
        if "actions" not in result:
            result["actions"] = []
        return result
    except Exception as e:
        return _rule_based_reply(last_user_msg, language)


def analyze_test_with_ai(
    answers_summary: str,
    normalized_score: float,
    deterministic_level,
    age_group,
    language: str = "ru",
    available_courses: List[dict] = [],
) -> dict:
    if not ai_client:
        return _fallback_analysis(deterministic_level, language)

    lang = language if language in TEST_ANALYSIS_SYSTEM else "ru"
    age_label = {"child": "до 14 лет", "teen": "14–18 лет", "adult": "18+ лет"}.get(str(age_group), "взрослый")
    courses_text = "\n".join(f"- {c['id']}: {c['name']}" for c in available_courses[:8])

    user_msg = f"""Пользователь ({age_label}) прошёл тест. Результаты:
{answers_summary}
Нормализованный балл: {normalized_score:.1f}/100
Предварительный уровень: {deterministic_level}

Доступные курсы:
{courses_text}

Ответь в JSON:
{{
  "level": "norm | elevated | burnout_risk | critical",
  "summary": "2-3 поддерживающих предложения о состоянии",
  "actions": ["конкретное действие 1", "конкретное действие 2", "конкретное действие 3"],
  "recommended_courses": ["id курса если уместно"]
}}"""

    try:
        raw = _chat_completion(TEST_ANALYSIS_SYSTEM[lang], [{"role": "user", "content": user_msg}])
        result = json.loads(raw)
        level_map = {
            "norm": AILevel.NORM, "elevated": AILevel.ELEVATED,
            "burnout_risk": AILevel.BURNOUT_RISK, "critical": AILevel.CRITICAL,
        }
        result["level"] = level_map.get(result.get("level", "norm"), deterministic_level)
        return result
    except Exception:
        return _fallback_analysis(deterministic_level, language)


def _fallback_analysis(level, language: str) -> dict:
    level_str = str(level.value) if hasattr(level, "value") else str(level)
    data = {
        "ru": {
            "norm":         ("Ваше состояние в норме. Продолжайте заботиться о себе!",
                             ["Сохраняйте режим сна", "Занимайтесь физической активностью", "Общайтесь с близкими"]),
            "elevated":     ("Наблюдается повышенный уровень стресса. Уделите время восстановлению.",
                             ["Практикуйте дыхательные упражнения", "Делайте перерывы от экранов", "Прогуляйтесь на свежем воздухе"]),
            "burnout_risk": ("Есть риск эмоционального выгорания. Рекомендуем пройти курс и снизить нагрузку.",
                             ["Пройдите курс по профилактике выгорания", "Поговорите с доверенным человеком", "Ограничьте нагрузку"]),
            "critical":     ("Ваше состояние требует внимания. Пожалуйста, обратитесь к психологу.",
                             ["Свяжитесь с психологом учреждения", "Позвоните на линию помощи", "Не оставайтесь наедине с тяжёлыми мыслями"]),
        },
        "en": {
            "norm":         ("Your state is normal. Keep taking care of yourself!",
                             ["Maintain your sleep schedule", "Exercise regularly", "Connect with loved ones"]),
            "elevated":     ("Elevated stress detected. Take time to recover.",
                             ["Practice breathing exercises", "Take screen breaks", "Go for a walk"]),
            "burnout_risk": ("Burnout risk detected. We recommend taking a course.",
                             ["Take the burnout prevention course", "Talk to someone you trust", "Reduce workload"]),
            "critical":     ("Your state requires attention. Please reach out to a psychologist.",
                             ["Contact your institution's psychologist", "Call a helpline", "Don't face difficult thoughts alone"]),
        },
        "kz": {
            "norm":         ("Жағдайыңыз қалыпты. Өзіңізге қамқор болуды жалғастырыңыз!",
                             ["Ұйқы режимін сақтаңыз", "Дене белсенділігімен айналысыңыз", "Жақындарыңызбен сөйлесіңіз"]),
            "elevated":     ("Жоғары стресс деңгейі. Демалуға уақыт бөліңіз.",
                             ["Тыныс алу жаттығуларын жасаңыз", "Экраннан үзіліс жасаңыз", "Серуендеңіз"]),
            "burnout_risk": ("Күйіп-жану қаупі бар. Курс өтуді ұсынамыз.",
                             ["Күйіп-жануды болдырмау курсын өтіңіз", "Сенімді адаммен сөйлесіңіз", "Жүктемені азайтыңыз"]),
            "critical":     ("Жағдайыңыз назар аударуды қажет етеді. Психологқа жүгініңіз.",
                             ["Мекеменің психологымен байланысыңыз", "Көмек желісіне қоңырау шалыңыз", "Ауыр ойлармен жалғыз қалмаңыз"]),
        },
    }
    lang_data = data.get(language, data["ru"])
    summary, actions = lang_data.get(level_str, lang_data["norm"])
    return {"level": level, "summary": summary, "actions": actions, "recommended_courses": []}
