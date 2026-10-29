export interface CategoryGuide { name: string; summary: string; heading: string; points: Array<{ title: string; text: string }> }
type Translation = Record<'ro' | 'ru', CategoryGuide>;
const guides: Record<string, Translation> = {
  'aparate-cardio/banda-alergat': {
    ru: { name: 'Беговые дорожки', summary: 'Беговые дорожки для дома и фитнес-зала в Молдове. Сравните размеры полотна, допустимую нагрузку, скорость и наклон, чтобы подобрать модель под свои тренировки.', heading: 'Как выбрать беговую дорожку', points: [
      { title: 'Для ходьбы или бега', text: 'Для ходьбы важны удобная низкая скорость и поручни. Для бега сравните длину и ширину полотна: они должны подходить вашему росту и длине шага.' },
      { title: 'Нагрузка и частота занятий', text: 'Проверьте максимальный вес пользователя и назначение модели. Для нескольких тренировок в день выбирайте оборудование, рассчитанное на такой режим, а не только на подходящую максимальную скорость.' },
      { title: 'Место и обслуживание', text: 'Сверьте размеры в рабочем и сложенном положении, оставьте свободное место вокруг дорожки. Перед покупкой уточните требования к питанию, смазке и обслуживанию выбранной модели.' },
    ] },
    ro: { name: 'Benzi de alergat', summary: 'Benzi de alergat pentru acasă și săli de fitness în Moldova. Comparați suprafața de alergare, greutatea admisă, viteza și înclinarea pentru a alege modelul potrivit antrenamentelor dvs.', heading: 'Cum alegeți o bandă de alergat', points: [
      { title: 'Pentru mers sau alergare', text: 'Pentru mers contează viteza minimă confortabilă și mânerele de sprijin. Pentru alergare, comparați lungimea și lățimea suprafeței: acestea trebuie să corespundă înălțimii și pasului utilizatorului.' },
      { title: 'Greutate și frecvența utilizării', text: 'Verificați greutatea maximă a utilizatorului și destinația modelului. Pentru mai multe antrenamente pe zi, alegeți un aparat conceput pentru acel regim, nu doar după viteza maximă.' },
      { title: 'Spațiu și întreținere', text: 'Comparați dimensiunile în poziția de lucru și pliată și păstrați spațiu liber în jurul aparatului. Clarificați cerințele de alimentare, lubrifiere și întreținere pentru modelul ales.' },
    ] },
  },
  'aparate-cardio': {
    ru: { name: 'Кардиотренажёры', summary: 'Кардиотренажёры для домашних тренировок и фитнес-залов: беговые дорожки, велотренажёры, эллиптические и гребные тренажёры. Сравните назначение, нагрузку и габариты моделей.', heading: 'Как подобрать кардиотренажёр', points: [
      { title: 'Выберите формат тренировки', text: 'Дорожка подходит для ходьбы и бега, велотренажёр — для занятий сидя, эллиптический тренажёр — для движения с участием рук и ног. Сначала определите, какой формат вам удобен.' },
      { title: 'Учитывайте пользователей', text: 'Сравните допустимый вес, регулировки и посадку. Для общего зала важно, чтобы тренажёр подходил людям разного роста и был рассчитан на нужную частоту использования.' },
      { title: 'Проверьте размещение', text: 'Помимо размеров самого тренажёра, учитывайте место для посадки, подхода и движения. Сверьте требования к электропитанию и обслуживанию до заказа.' },
    ] },
    ro: { name: 'Aparate cardio', summary: 'Aparate cardio pentru antrenamente acasă și în săli de fitness: benzi de alergat, biciclete fitness, eliptice și aparate de vâslit. Comparați destinația, greutatea admisă și dimensiunile modelelor.', heading: 'Cum alegeți un aparat cardio', points: [
      { title: 'Alegeți tipul antrenamentului', text: 'Banda permite mersul și alergarea, bicicleta oferă antrenament în poziție șezândă, iar eliptica implică mișcarea brațelor și picioarelor. Porniți de la tipul de mișcare pe care îl preferați.' },
      { title: 'Luați în calcul utilizatorii', text: 'Comparați greutatea admisă, reglajele și poziția de antrenament. Pentru o sală comună, aparatul trebuie să se adapteze persoanelor de înălțimi diferite și frecvenței de utilizare planificate.' },
      { title: 'Verificați amplasarea', text: 'Pe lângă dimensiunile aparatului, lăsați spațiu pentru acces și mișcare. Verificați alimentarea electrică și cerințele de întreținere înainte de comandă.' },
    ] },
  },
  'aparate-forta': {
    ru: { name: 'Силовые тренажёры и оборудование', summary: 'Силовое оборудование для дома и спортивных залов. Подбирайте тренажёры по упражнениям, системе нагрузки, регулировкам и доступному пространству.', heading: 'Что учитывать при выборе силового оборудования', points: [
      { title: 'Упражнения и система нагрузки', text: 'Определите, какие движения нужны в программе. У тренажёров со встроенными весами проверьте диапазон и шаг нагрузки, у моделей под диски — совместимость с имеющимися дисками.' },
      { title: 'Регулировки и допустимая нагрузка', text: 'Посмотрите, как регулируются сиденье, спинка и упоры. Максимальный вес пользователя и максимальная рабочая нагрузка — разные характеристики; проверьте обе в описании модели.' },
      { title: 'Размеры в работе', text: 'Для установки нужен не только размер рамы: оставьте место для движущихся частей, подхода и смены дисков. Заранее уточните состав комплекта и необходимость крепления к полу.' },
    ] },
    ro: { name: 'Aparate și echipamente de forță', summary: 'Echipamente de forță pentru acasă și săli de sport. Alegeți aparatele după exerciții, sistemul de încărcare, reglaje și spațiul disponibil.', heading: 'Ce contează la alegerea echipamentelor de forță', points: [
      { title: 'Exerciții și sistem de încărcare', text: 'Stabiliți mișcările necesare programului dvs. La aparatele cu greutăți integrate, verificați intervalul și pasul încărcării; la modelele cu discuri, verificați compatibilitatea cu discurile disponibile.' },
      { title: 'Reglaje și sarcină admisă', text: 'Comparați reglajele scaunului, spătarului și suporturilor. Greutatea maximă a utilizatorului și sarcina maximă de lucru sunt caracteristici diferite: verificați-le pe ambele.' },
      { title: 'Dimensiuni în utilizare', text: 'Rezervați spațiu pentru părțile mobile, acces și schimbarea discurilor, nu doar pentru cadru. Clarificați ce include setul și dacă este necesară fixarea în podea.' },
    ] },
  },
  greutati: {
    ru: { name: 'Гантели, гири, штанги и диски', summary: 'Свободные веса для силовых тренировок: гантели, гири, грифы и диски. Сравните вес, размеры, покрытие и совместимость оборудования перед заказом.', heading: 'Как выбрать свободные веса', points: [
      { title: 'Вес и шаг увеличения нагрузки', text: 'Для постепенного изменения нагрузки сравните доступные веса и шаг регулировки. Разборная гантель экономит место, а фиксированные гантели удобны, когда вес нужно быстро менять между упражнениями.' },
      { title: 'Совместимость грифа и дисков', text: 'Проверьте диаметр посадочного отверстия дисков и втулок грифа. Уточните допустимую нагрузку грифа, тип замков и входят ли они в комплект.' },
      { title: 'Покрытие и хранение', text: 'Сравните материал покрытия и размеры оборудования. Продумайте стойку для хранения и защиту пола: одинаковый вес не означает одинаковые габариты или одинаковое покрытие.' },
    ] },
    ro: { name: 'Gantere, kettlebell, bare și discuri', summary: 'Greutăți libere pentru antrenamente de forță: gantere, kettlebell, bare și discuri. Comparați greutatea, dimensiunile, învelișul și compatibilitatea înainte de comandă.', heading: 'Cum alegeți greutățile libere', points: [
      { title: 'Greutate și pas de ajustare', text: 'Comparați greutățile disponibile și pasul de ajustare pentru progresia încărcării. O ganteră reglabilă economisește spațiu; ganterele fixe permit schimbarea rapidă a greutății între exerciții.' },
      { title: 'Compatibilitatea barei cu discurile', text: 'Verificați diametrul orificiului discurilor și al manșoanelor barei. Clarificați sarcina admisă a barei, tipul închizătorilor și dacă acestea sunt incluse.' },
      { title: 'Înveliș și depozitare', text: 'Comparați materialul învelișului și dimensiunile. Planificați suportul de depozitare și protecția podelei: aceeași greutate nu înseamnă aceleași dimensiuni sau același înveliș.' },
    ] },
  },
  'fitness-yoga': {
    ru: { name: 'Оборудование для фитнеса, йоги и пилатеса', summary: 'Коврики, эспандеры, фитболы и аксессуары для фитнеса, йоги и пилатеса. Выбирайте оборудование по виду занятий, размерам и необходимому сопротивлению.', heading: 'Что выбрать для ваших занятий', points: [
      { title: 'Коврик под тип упражнений', text: 'Для упражнений лёжа важны комфорт и толщина, для упражнений стоя — устойчивость и сцепление. Сравните длину, ширину и материал коврика, а также рекомендации по уходу.' },
      { title: 'Сопротивление эспандера', text: 'Подбирайте сопротивление под упражнение и свою подготовку. Цвета у разных производителей не означают одну и ту же нагрузку: ориентируйтесь на характеристики конкретной модели.' },
      { title: 'Размер и хранение', text: 'Проверьте размер и допустимую нагрузку фитбола, длину ремней и размеры других аксессуаров. Для групповых занятий заранее продумайте очистку и хранение инвентаря.' },
    ] },
    ro: { name: 'Echipamente pentru fitness, yoga și pilates', summary: 'Saltele, benzi elastice, mingi de gimnastică și accesorii pentru fitness, yoga și pilates. Alegeți echipamentul după tipul exercițiilor, dimensiuni și rezistența necesară.', heading: 'Ce alegeți pentru antrenamentele dvs.', points: [
      { title: 'Saltea potrivită exercițiilor', text: 'La exercițiile la sol contează confortul și grosimea; la cele în picioare, stabilitatea și aderența. Comparați lungimea, lățimea, materialul și recomandările de îngrijire.' },
      { title: 'Rezistența benzii elastice', text: 'Alegeți rezistența în funcție de exercițiu și nivelul de pregătire. Culorile producătorilor nu indică aceeași încărcare: consultați caracteristicile modelului concret.' },
      { title: 'Dimensiuni și depozitare', text: 'Verificați dimensiunea și sarcina admisă a mingii de gimnastică, lungimea curelelor și dimensiunile accesoriilor. Pentru antrenamente de grup, planificați curățarea și depozitarea echipamentelor.' },
    ] },
  },
};
export function getCategoryGuide(category: string | undefined, subcategory: string | undefined, language: 'ro' | 'ru') {
  if (!category) return null;
  return guides[subcategory ? `${category}/${subcategory}` : category]?.[language] || null;
}
