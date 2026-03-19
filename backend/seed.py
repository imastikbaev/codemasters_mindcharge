"""
Seed script: creates institution, demo users, tests with questions, and courses.
Run: python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
import models
from models import (
    Institution, User, Test, Question, Course, CourseModule,
    UserRole, AgeGroup, AILevel
)
from services.auth import hash_password
import uuid

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def gen_id():
    return str(uuid.uuid4())

print("Seeding database...")

existing = db.query(Institution).first()
if existing:
    # Update demo user names if outdated
    updates = [
        ("user@demo.kz", "Пользователь Пользователев"),
        ("psych@demo.kz", "Психолог Психологович"),
        ("director@demo.kz", "Директор Директорович"),
        ("admin@demo.kz", "Админ Админович"),
        ("teen@demo.kz", "Ученик Ученикович"),
    ]
    from models import User
    for email, name in updates:
        u = db.query(User).filter(User.email == email).first()
        if u and u.name != name:
            u.name = name
    db.commit()
    print("Updated demo user names. Exiting.")
    db.close()
    sys.exit(0)

inst = Institution(
    id=gen_id(),
    name="Назарбаев Университет",
    type="university"
)
db.add(inst)
db.commit()
db.refresh(inst)

users_data = [
    {"email": "user@demo.kz", "name": "Пользователь Пользователев", "role": UserRole.USER, "age_group": AgeGroup.ADULT, "group_name": "CS-301"},
    {"email": "psych@demo.kz", "name": "Психолог Психологович", "role": UserRole.PSYCHOLOGIST, "age_group": AgeGroup.ADULT},
    {"email": "director@demo.kz", "name": "Директор Директорович", "role": UserRole.DIRECTOR, "age_group": AgeGroup.ADULT},
    {"email": "admin@demo.kz", "name": "Админ Админович", "role": UserRole.ADMIN, "age_group": AgeGroup.ADULT},
    {"email": "teen@demo.kz", "name": "Ученик Ученикович", "role": UserRole.USER, "age_group": AgeGroup.TEEN, "group_name": "11-А"},
]

for ud in users_data:
    u = User(
        id=gen_id(),
        email=ud["email"],
        password_hash=hash_password("demo1234"),
        name=ud["name"],
        role=ud["role"],
        age_group=ud["age_group"],
        institution_id=inst.id,
        group_name=ud.get("group_name"),
        preferred_language="ru"
    )
    db.add(u)
db.commit()
print(f"Created {len(users_data)} demo users (password: demo1234)")

#tests

pss10 = Test(
    id=gen_id(),
    type="stress",
    name_ru="Шкала воспринимаемого стресса (PSS-10)",
    name_kz="Қабылданған стресс шкаласы (PSS-10)",
    name_en="Perceived Stress Scale (PSS-10)",
    description_ru="Оценивает уровень стресса за последний месяц. 10 вопросов, 5–7 минут.",
    description_kz="Соңғы айдағы стресс деңгейін бағалайды. 10 сұрақ, 5–7 минут.",
    description_en="Measures stress level over the past month. 10 questions, 5–7 minutes.",
    estimated_minutes=7
)
db.add(pss10)
db.commit()

pss_questions = [
    ("Как часто в прошлом месяце вас расстраивало что-то неожиданное?",
     "Өткен айда сізді күтпеген нәрсе қаншалықты жиі мазалады?",
     "How often have you been upset by something unexpected?", False),
    ("Как часто вы чувствовали, что не можете контролировать важные вещи в жизни?",
     "Өміріңіздегі маңызды нәрселерді бақылай алмайтындай сезіндіңіз бе?",
     "How often have you felt unable to control important things in your life?", False),
    ("Как часто вы чувствовали нервозность и стресс?",
     "Жүйкелік және стресс сезіндіңіз бе?",
     "How often have you felt nervous and stressed?", False),
    ("Как часто вы были уверены в своей способности справляться с личными проблемами?",
     "Жеке мәселелерді шеше алатыныңызға сенімді болдыңыз ба?",
     "How often have you felt confident about your ability to handle personal problems?", True),
    ("Как часто вы чувствовали, что дела идут так, как вы хотите?",
     "Жұмыстар қалағандай жүріп жатыр деп сезіндіңіз бе?",
     "How often have you felt that things were going your way?", True),
    ("Как часто вы не могли справиться с тем, что нужно сделать?",
     "Жасалуы керек нәрселермен күресе алмадыңыз ба?",
     "How often have you been unable to cope with things you had to do?", False),
    ("Как часто вы могли контролировать раздражение?",
     "Ашуланшақтықты бақылай алдыңыз ба?",
     "How often have you been able to control irritations in your life?", True),
    ("Как часто вы чувствовали себя «на вершине»?",
     "Өзіңізді «шыңда» сезіндіңіз бе?",
     "How often have you felt that you were on top of things?", True),
    ("Как часто вас раздражало то, что некоторые события были вне вашего контроля?",
     "Кейбір оқиғалар бақылауыңыздан тыс болғанына ашуланыңыз ба?",
     "How often have you been angered because of things that were outside of your control?", False),
    ("Как часто вы чувствовали, что трудностей так много, что с ними не справиться?",
     "Қиыншылықтар соншалықты көп екенін сезіндіңіз бе?",
     "How often have you felt difficulties were piling up so high that you could not overcome them?", False),
]

for i, (ru, kz, en, reverse) in enumerate(pss_questions):
    q = Question(
        id=gen_id(), test_id=pss10.id, order=i+1,
        text_ru=ru, text_kz=kz, text_en=en,
        scale_min=0, scale_max=4, weight=1.0, reverse_scored=reverse
    )
    db.add(q)

gad7 = Test(
    id=gen_id(),
    type="anxiety",
    name_ru="Шкала тревожности GAD-7",
    name_kz="Мазасыздық шкаласы GAD-7",
    name_en="Generalized Anxiety Disorder Scale (GAD-7)",
    description_ru="Оценивает уровень тревожности. 7 вопросов, 3–5 минут.",
    description_kz="Мазасыздық деңгейін бағалайды. 7 сұрақ, 3–5 минут.",
    description_en="Assesses anxiety level. 7 questions, 3–5 minutes.",
    estimated_minutes=5
)
db.add(gad7)
db.commit()

gad_questions = [
    ("Как часто вас беспокоило ощущение нервозности, беспокойства или ощущения, что вы на взводе?",
     "Жүйкелік, мазасыздық немесе шиеленіс сезімі қаншалықты жиі мазалады?",
     "How often have you been bothered by feeling nervous, anxious, or on edge?"),
    ("Как часто вы не могли остановить беспокойство или держать его под контролем?",
     "Мазасыздықты тоқтата алмадыңыз бе немесе бақылай алмадыңыз ба?",
     "How often have you been unable to stop or control worrying?"),
    ("Как часто вас беспокоило чрезмерное беспокойство о разных вещах?",
     "Түрлі нәрселер туралы шамадан тыс алаңдадыңыз ба?",
     "How often have you been bothered by worrying too much about different things?"),
    ("Как часто у вас были трудности с расслаблением?",
     "Демалуда қиындықтар болды ма?",
     "How often have you had trouble relaxing?"),
    ("Как часто вы были настолько беспокойны, что не могли усидеть на месте?",
     "Орныңызда отыра алмайтындай мазасыздандыңыз ба?",
     "How often have you been so restless that it was hard to sit still?"),
    ("Как часто вас раздражало или вы легко раздражались?",
     "Тітіркендіндіңіз бе немесе оңай ашуланыңыз ба?",
     "How often have you been easily annoyed or irritable?"),
    ("Как часто вы боялись, что может случиться что-то ужасное?",
     "Бірдеңе ужасное болып қалар деп қорықтыңыз ба?",
     "How often have you been afraid something awful might happen?"),
]

for i, (ru, kz, en) in enumerate(gad_questions):
    q = Question(
        id=gen_id(), test_id=gad7.id, order=i+1,
        text_ru=ru, text_kz=kz, text_en=en,
        scale_min=0, scale_max=3, weight=1.0, reverse_scored=False
    )
    db.add(q)

mbi = Test(
    id=gen_id(),
    type="burnout",
    name_ru="Опросник выгорания (MBI)",
    name_kz="Күйіп-жану сауалнамасы (MBI)",
    name_en="Burnout Inventory (MBI)",
    description_ru="Оценивает эмоциональное истощение и выгорание. 16 вопросов, 10 минут.",
    description_kz="Эмоционалдық тозу мен күйіп-жануды бағалайды. 16 сұрақ, 10 минут.",
    description_en="Assesses emotional exhaustion and burnout. 16 questions, 10 minutes.",
    estimated_minutes=10
)
db.add(mbi)
db.commit()

mbi_qs = [
    ("Я чувствую себя эмоционально опустошённым от работы/учёбы.",
     "Жұмыс/оқудан эмоционалдық тұрғыдан бос сезінемін.",
     "I feel emotionally drained from my work/study."),
    ("К концу рабочего/учебного дня я чувствую себя как выжатый лимон.",
     "Жұмыс/оқу күнінің соңында өзімді шаршаған сезінемін.",
     "I feel used up at the end of the workday."),
    ("Я чувствую усталость, когда встаю утром и осознаю, что мне надо идти на работу/учёбу.",
     "Таңертең оянғанда жұмысқа/оқуға бару керек екенін ойлап шаршаймын.",
     "I feel tired when I get up and have to face another day."),
    ("Я легко понимаю, что чувствуют мои коллеги/однокурсники.",
     "Әріптестерімнің/топтастарымның сезімін оңай түсінемін.",
     "I can easily understand how my colleagues feel."),
    ("Я чувствую, что иногда отношусь к некоторым людям так, словно они предметы.",
     "Кейде адамдарға заттарша қарайтынымды сезінемін.",
     "I feel I treat some people as if they are impersonal objects."),
    ("Работа с людьми целый день — это для меня большое напряжение.",
     "Күні бойы адамдармен жұмыс істеу маған үлкен шиеленіс.",
     "Working with people all day is a real strain for me."),
    ("Я эффективно справляюсь с проблемами своих клиентов/студентов.",
     "Клиенттерімнің/студенттерімнің мәселелерін тиімді шешемін.",
     "I deal very effectively with the problems of those in my care."),
    ("Я чувствую себя перегоревшим от работы.",
     "Жұмыстан күйіп кеткенімді сезінемін.",
     "I feel burned out from my work."),
    ("Я чувствую, что позитивно влияю на жизнь других людей.",
     "Басқа адамдардың өміріне оңтайлы ықпал ететінімді сезінемін.",
     "I feel I'm positively influencing other people's lives."),
    ("Я стал более чёрствым к людям с тех пор, как начал эту работу.",
     "Бұл жұмысты бастағаннан бері адамдарға қарата қатты болдым.",
     "I've become more callous toward people since I took this job."),
    ("Я боюсь, что эта работа эмоционально ожесточает меня.",
     "Бұл жұмыс мені эмоционалдық тұрғыдан қатайтып жатыр деп қорқамын.",
     "I worry that this job is hardening me emotionally."),
    ("Я чувствую себя очень энергичным.",
     "Өзімді өте энергиялы сезінемін.",
     "I feel very energetic."),
    ("Я чувствую разочарование в своей работе.",
     "Жұмысымнан көңілім қалып жатыр.",
     "I feel frustrated by my job."),
    ("Я чувствую, что слишком много работаю.",
     "Тым көп жұмыс істеп жатырмын деп сезінемін.",
     "I feel I'm working too hard on my job."),
    ("Мне действительно всё равно, что происходит с некоторыми людьми.",
     "Кейбір адамдармен не болып жатқаны маған шынымен бәрібір.",
     "I don't really care what happens to some people in my care."),
    ("Работа непосредственно с людьми слишком напрягает меня.",
     "Адамдармен тікелей жұмыс істеу маған тым ауыр.",
     "Working directly with people puts too much stress on me."),
]
for i, (ru, kz, en) in enumerate(mbi_qs):
    q = Question(
        id=gen_id(), test_id=mbi.id, order=i+1,
        text_ru=ru, text_kz=kz, text_en=en,
        scale_min=0, scale_max=6, weight=1.0, reverse_scored=False
    )
    db.add(q)

motivation = Test(
    id=gen_id(),
    type="motivation",
    name_ru="Шкала мотивации",
    name_kz="Мотивация шкаласы",
    name_en="Motivation Scale",
    description_ru="Оценивает уровень мотивации к учёбе/работе. 12 вопросов, 8 минут.",
    description_kz="Оқу/жұмысқа мотивация деңгейін бағалайды. 12 сұрақ, 8 минут.",
    description_en="Assesses motivation level for study/work. 12 questions, 8 minutes.",
    estimated_minutes=8
)
db.add(motivation)
db.commit()

mot_qs = [
    ("Мне интересно то, чем я занимаюсь (учёба/работа).",
     "Жасап жатқан ісіме (оқу/жұмыс) қызығушылығым бар.",
     "I find what I do (study/work) interesting."),
    ("Я знаю, зачем я это делаю.",
     "Мұны не үшін жасап жатқанымды білемін.",
     "I know why I am doing this."),
    ("Я горжусь своими достижениями.",
     "Жетістіктеріме мақтанамын.",
     "I am proud of my achievements."),
    ("Меня привлекает перспектива роста.",
     "Өсу перспективасы мені қызықтырады.",
     "I am attracted by the prospect of growth."),
    ("Мне сложно начинать новые задачи.",
     "Жаңа тапсырмаларды бастау маған қиын.",
     "I find it hard to start new tasks."),
    ("Я часто откладываю дела на потом.",
     "Іс-шараларды кейінге жиі қалдырамын.",
     "I often procrastinate."),
    ("Я получаю удовольствие от процесса обучения/работы.",
     "Оқу/жұмыс үдерісінен ләззат аламын.",
     "I enjoy the process of learning/working."),
    ("Я стремлюсь к достижению новых целей.",
     "Жаңа мақсаттарға жетуге ұмтыламын.",
     "I strive to achieve new goals."),
    ("Внешние факторы мешают мне работать эффективно.",
     "Сыртқы факторлар тиімді жұмыс істеуіме кедергі келтіреді.",
     "External factors prevent me from working effectively."),
    ("Я чувствую смысл в том, что делаю.",
     "Жасап жатқан ісімде мән сезінемін.",
     "I feel meaning in what I do."),
    ("Я легко концентрируюсь на задачах.",
     "Тапсырмаларға оңай шоғырланамын.",
     "I can easily concentrate on tasks."),
    ("Мне нравится преодолевать сложные задачи.",
     "Күрделі тапсырмаларды жеңуді ұнатамын.",
     "I enjoy overcoming challenging tasks."),
]
for i, (ru, kz, en) in enumerate(mot_qs):
    reverse = i in [4, 5, 8]
    q = Question(
        id=gen_id(), test_id=motivation.id, order=i+1,
        text_ru=ru, text_kz=kz, text_en=en,
        scale_min=1, scale_max=5, weight=1.0, reverse_scored=reverse
    )
    db.add(q)

db.commit()
print("Created 4 tests with questions")

# ================== COURSES ==================

courses_data = [
    {
        "theme": "stress",
        "variant": "practical",
        "name_ru": "Управление стрессом: практический курс",
        "name_kz": "Стрессті басқару: практикалық курс",
        "name_en": "Stress Management: Practical Course",
        "description_ru": "Научитесь справляться со стрессом с помощью проверенных техник. Дыхание, mindfulness, тайм-менеджмент.",
        "description_kz": "Дәлелденген техникалар арқылы стреспен күресуді үйреніңіз.",
        "description_en": "Learn to manage stress with proven techniques. Breathing, mindfulness, time management.",
        "age_group": None,
        "estimated_hours": 2.0,
        "target_levels": ["elevated", "burnout_risk"],
        "modules": [
            {"type": "text", "title_ru": "Что такое стресс?", "title_en": "What is stress?", "title_kz": "Стресс дегеніміз не?",
             "content": {"text": "Стресс — это нормальная реакция организма на нагрузку. Острый стресс помогает мобилизоваться. Хронический — вреден для здоровья. В этом модуле мы разберёмся с природой стресса и его влиянием на тело и психику.", "duration_min": 10}},
            {"type": "video", "title_ru": "Техника 4-7-8 дыхания", "title_en": "4-7-8 Breathing Technique", "title_kz": "4-7-8 тыныс алу техникасы",
             "content": {"video_url": "https://www.youtube.com/embed/YRPh_GaiL8s", "duration_min": 5, "description": "Дыхательная техника для быстрого снижения тревоги"}},
            {"type": "exercise", "title_ru": "Практика: прогрессивная мышечная релаксация", "title_en": "Exercise: Progressive Muscle Relaxation", "title_kz": "Жаттығу: прогрессивті бұлшықет релаксациясы",
             "content": {"steps": [
                 "Найдите удобное место и сядьте или лягте",
                 "Закройте глаза и сделайте 3 глубоких вдоха",
                 "Напрягите мышцы ног на 5 секунд, затем расслабьте",
                 "Переходите вверх: живот, грудь, плечи, руки, лицо",
                 "Почувствуйте разницу между напряжением и расслаблением"
             ], "duration_min": 15}},
            {"type": "quiz", "title_ru": "Проверка знаний", "title_en": "Knowledge Check", "title_kz": "Білімді тексеру",
             "content": {"questions": [
                 {"text": "Какой тип стресса является полезным?", "options": ["Хронический", "Острый", "Психологический", "Физический"], "correct": 1},
                 {"text": "Техника 4-7-8 относится к:", "options": ["Медитации", "Дыхательным упражнениям", "Физическим упражнениям", "Когнитивным техникам"], "correct": 1},
             ]}},
        ]
    },
    {
        "theme": "burnout",
        "variant": "medium",
        "name_ru": "Профилактика выгорания",
        "name_kz": "Күйіп-жануды алдын алу",
        "name_en": "Burnout Prevention",
        "description_ru": "Курс о признаках выгорания и способах их предотвращения. Для студентов и сотрудников.",
        "description_kz": "Күйіп-жану белгілері және оларды болдырмау тәсілдері туралы курс.",
        "description_en": "A course on burnout signs and how to prevent them. For students and employees.",
        "age_group": None,
        "estimated_hours": 3.0,
        "target_levels": ["burnout_risk", "critical"],
        "modules": [
            {"type": "text", "title_ru": "Признаки выгорания", "title_en": "Signs of Burnout", "title_kz": "Күйіп-жану белгілері",
             "content": {"text": "Эмоциональное выгорание — это состояние хронического стресса, которое приводит к физическому и эмоциональному истощению, цинизму и ощущению неэффективности. Основные признаки: постоянная усталость, потеря мотивации, цинизм, снижение продуктивности, физические симптомы (головные боли, бессонница).", "duration_min": 12}},
            {"type": "video", "title_ru": "Как восстановить энергию", "title_en": "How to Restore Energy", "title_kz": "Энергияны қалай қалпына келтіруге болады",
             "content": {"video_url": "https://www.youtube.com/embed/7FDAJ8L3lig", "duration_min": 8, "description": "Практические советы по восстановлению"}},
            {"type": "exercise", "title_ru": "Аудит своего времени", "title_en": "Time Audit", "title_kz": "Уақытты тексеру",
             "content": {"steps": [
                 "Возьмите листок и запишите все свои дела за день",
                 "Разделите их на: 'дающие энергию' и 'забирающие энергию'",
                 "Отметьте, от чего можно отказаться или делегировать",
                 "Запланируйте хотя бы 30 минут в день для себя"
             ], "duration_min": 20}},
            {"type": "quiz", "title_ru": "Проверка знаний", "title_en": "Knowledge Check", "title_kz": "Білімді тексеру",
             "content": {"questions": [
                 {"text": "Что НЕ является признаком выгорания?", "options": ["Постоянная усталость", "Высокая мотивация", "Цинизм", "Снижение продуктивности"], "correct": 1},
                 {"text": "Первый шаг при выгорании:", "options": ["Работать усерднее", "Признать проблему", "Игнорировать симптомы", "Уволиться"], "correct": 1},
             ]}},
        ]
    },
    {
        "theme": "emotional_intelligence",
        "variant": "basic",
        "name_ru": "Эмоциональный интеллект",
        "name_kz": "Эмоционалдық интеллект",
        "name_en": "Emotional Intelligence",
        "description_ru": "Развитие навыков понимания и управления своими эмоциями.",
        "description_kz": "Эмоцияларды түсіну және басқару дағдыларын дамыту.",
        "description_en": "Developing skills to understand and manage your emotions.",
        "age_group": None,
        "estimated_hours": 2.5,
        "target_levels": ["norm", "elevated"],
        "modules": [
            {"type": "text", "title_ru": "Что такое эмоциональный интеллект?", "title_en": "What is Emotional Intelligence?", "title_kz": "Эмоционалдық интеллект дегеніміз не?",
             "content": {"text": "Эмоциональный интеллект (EQ) — это способность распознавать, понимать и управлять своими эмоциями и эмоциями других людей. Высокий EQ помогает строить отношения, справляться со стрессом и принимать взвешенные решения. Компоненты EQ: самосознание, саморегуляция, мотивация, эмпатия, социальные навыки.", "duration_min": 10}},
            {"type": "exercise", "title_ru": "Дневник эмоций", "title_en": "Emotion Journal", "title_kz": "Эмоция күнделігі",
             "content": {"steps": [
                 "Выберите 3 момента сегодняшнего дня",
                 "Для каждого: запишите, что произошло",
                 "Назовите эмоцию, которую вы испытали",
                 "Опишите, как эмоция проявилась в теле",
                 "Подумайте, как вы отреагировали и как могли бы отреагировать иначе"
             ], "duration_min": 20}},
            {"type": "quiz", "title_ru": "Проверка знаний", "title_en": "Knowledge Check", "title_kz": "Білімді тексеру",
             "content": {"questions": [
                 {"text": "EQ — это аббревиатура от:", "options": ["Emotional Quotient", "Energy Quality", "Empathy Quest", "Effective Quote"], "correct": 0},
                 {"text": "Какой компонент EQ отвечает за понимание чужих эмоций?", "options": ["Саморегуляция", "Мотивация", "Эмпатия", "Самосознание"], "correct": 2},
             ]}},
        ]
    },
    {
        "theme": "motivation",
        "variant": "practical",
        "name_ru": "Мотивация и целеполагание",
        "name_kz": "Мотивация және мақсат қою",
        "name_en": "Motivation and Goal Setting",
        "description_ru": "Техники постановки целей и поддержания мотивации.",
        "description_kz": "Мақсат қою және мотивацияны сақтау техникалары.",
        "description_en": "Techniques for goal setting and maintaining motivation.",
        "age_group": None,
        "estimated_hours": 2.0,
        "target_levels": ["norm", "elevated"],
        "modules": [
            {"type": "text", "title_ru": "Метод SMART-целей", "title_en": "SMART Goals Method", "title_kz": "SMART мақсаттар әдісі",
             "content": {"text": "SMART — акроним: Specific (конкретная), Measurable (измеримая), Achievable (достижимая), Relevant (актуальная), Time-bound (ограниченная по времени). Грамотная постановка целей в разы повышает вероятность их достижения.", "duration_min": 8}},
            {"type": "exercise", "title_ru": "Постановка SMART-цели", "title_en": "Setting a SMART Goal", "title_kz": "SMART мақсат қою",
             "content": {"steps": [
                 "Выберите одну цель, которую хотите достичь",
                 "Сделайте её конкретной: что именно вы хотите?",
                 "Определите метрику: как вы поймёте, что достигли?",
                 "Проверьте реалистичность: это достижимо?",
                 "Установите дедлайн: когда?",
                 "Запишите финальную формулировку"
             ], "duration_min": 25}},
            {"type": "quiz", "title_ru": "Проверка знаний", "title_en": "Knowledge Check", "title_kz": "Білімді тексеру",
             "content": {"questions": [
                 {"text": "'T' в акрониме SMART означает:", "options": ["Total", "Time-bound", "Tangible", "Thoughtful"], "correct": 1},
             ]}},
        ]
    },
    {
        "theme": "mindfulness",
        "variant": "basic",
        "name_ru": "Техники осознанности (Mindfulness)",
        "name_kz": "Зейінділік техникалары (Mindfulness)",
        "name_en": "Mindfulness Techniques",
        "description_ru": "Введение в практику осознанности для снижения тревожности и стресса.",
        "description_kz": "Мазасыздық пен стрессті азайту үшін зейінділік практикасына кіріспе.",
        "description_en": "Introduction to mindfulness practice for reducing anxiety and stress.",
        "age_group": None,
        "estimated_hours": 1.5,
        "target_levels": ["elevated", "burnout_risk"],
        "modules": [
            {"type": "text", "title_ru": "Что такое mindfulness?", "title_en": "What is Mindfulness?", "title_kz": "Mindfulness дегеніміз не?",
             "content": {"text": "Mindfulness (осознанность) — это практика намеренного обращения внимания на настоящий момент без осуждения. Исследования показывают, что регулярная практика снижает уровень кортизола (гормона стресса), улучшает концентрацию и эмоциональную устойчивость.", "duration_min": 8}},
            {"type": "exercise", "title_ru": "Медитация 5 минут", "title_en": "5-Minute Meditation", "title_kz": "5 минуттық медитация",
             "content": {"steps": [
                 "Сядьте удобно, спина прямая",
                 "Закройте глаза или опустите взгляд",
                 "Сосредоточьтесь на дыхании: вдох считайте до 4, выдох до 6",
                 "Когда мысли уходят в сторону — мягко возвращайте внимание к дыханию",
                 "Продолжайте 5 минут",
                 "Медленно откройте глаза"
             ], "duration_min": 5}},
            {"type": "quiz", "title_ru": "Проверка знаний", "title_en": "Knowledge Check", "title_kz": "Білімді тексеру",
             "content": {"questions": [
                 {"text": "Mindfulness — это:", "options": ["Мечтания о будущем", "Осознанное присутствие в настоящем", "Анализ прошлого", "Планирование задач"], "correct": 1},
             ]}},
        ]
    },
]

for cd in courses_data:
    course = Course(
        id=gen_id(),
        theme=cd["theme"],
        variant=cd["variant"],
        name_ru=cd["name_ru"],
        name_kz=cd["name_kz"],
        name_en=cd["name_en"],
        description_ru=cd["description_ru"],
        description_kz=cd["description_kz"],
        description_en=cd["description_en"],
        age_group=cd["age_group"],
        estimated_hours=cd["estimated_hours"],
        target_levels=cd["target_levels"],
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    for i, mod in enumerate(cd["modules"]):
        m = CourseModule(
            id=gen_id(),
            course_id=course.id,
            order=i,
            type=mod["type"],
            title_ru=mod.get("title_ru"),
            title_kz=mod.get("title_kz"),
            title_en=mod.get("title_en"),
            content_json=mod["content"]
        )
        db.add(m)
    db.commit()

print(f"Created {len(courses_data)} courses")
print("\nDemo accounts (password: demo1234):")
for ud in users_data:
    print(f"  {ud['role'].value:15} {ud['email']}")

db.close()
print("\nSeeding complete!")
