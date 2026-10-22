export type Lang = "he" | "en";

export const LANG_KEY = "wzk-lang";

type Step = { n: string; title: string; text: string };
type Channel = { title: string; text: string; icon: number };
type Rule = { title: string; text: string; icon: number };
type Faq = { q: string; a: string };
type Plan = {
  badge: string;
  name: string;
  price: string;
  note: string;
  items: string[];
  cta: string;
};

export type Dict = {
  nav: { steps: string; channels: string; pricing: string; faq: string; cta: string; toggle: string };
  hero: { line1: string; line2: string; line3: string; sub: string; cta: string; secondary: string; alt: string };
  steps: { title: string; sub: string; items: Step[] };
  channels: { title: string; sub: string; items: Channel[] };
  desk: { title: string; sub: string; bullets: string[]; alt: string; rows: { name: string; src: string }[]; new: string; title2: string };
  rules: { title: string; sub: string; items: Rule[] };
  pricing: { title: string; sub: string; plans: Plan[] };
  faq: { title: string; items: Faq[] };
  footer: { line: string; made: string };
};

export const dict: Record<Lang, Dict> = {
  he: {
    nav: {
      steps: "איך זה עובד",
      channels: "ערוצים",
      pricing: "מחיר",
      faq: "שאלות",
      cta: "להתחיל בחינם",
      toggle: "EN",
    },
    hero: {
      line1: "קישור אחד.",
      line2: "כל קליק.",
      line3: "האדם הנכון.",
      sub: "שמים קישור אחד במודעה, בביו או בקוד QR. כל מבקר נפתח לוואטסאפ אצל חבר הצוות הבא, על המספר שכבר בשימוש.",
      cta: "להתחיל בחינם",
      secondary: "שבוע ניסיון. אחר כך 49 ש״ח פעם אחת, לשלוש שנים.",
      alt: "טלפון עם בועת וואטסאפ ירוקה ושלושה אנשי צוות בתור",
    },
    steps: {
      title: "מקמפיין לשיחה. בלי רשימת מספרים.",
      sub: "ארבעה צעדים. אפס הודעות אוטומטיות.",
      items: [
        { n: "1", title: "שקט בחנות", text: "הקמפיין רץ, אבל כל ליד נוחת אצל אותו אדם." },
        { n: "2", title: "שמים קישור", text: "כתובת אחת מחליפה רשימת טלפונים על כל המודעות." },
        { n: "3", title: "התור בוחר", text: "סבב או משקל. מספר מושהה, שעות שקטות ומכסה פשוט מדלגים." },
        { n: "4", title: "השיחה נפתחת", text: "אצל הבא בתור, בטלפון שלו. ההעברה נרשמת בדסק." },
      ],
    },
    channels: {
      title: "הקמפיינים שלכם. מחוברים.",
      sub: "הכתובת לא משתנה כשהתור מאחוריה כן משתנה.",
      items: [
        { title: "מודעות", text: "מטא, גוגל וטיקטוק נשארים על כתובת אחת. מחליפים אנשים בתור, לא במודעה.", icon: 2 },
        { title: "QR וביו", text: "אותו קישור על כרטיס, שלט או אינסטגרם.", icon: 3 },
        { title: "מקור", text: "מקור, מדיום וקמפיין נוסעים עם הקליק לדוח.", icon: 4 },
      ],
    },
    desk: {
      title: "פחות ניחושים. דסק אמיתי.",
      sub: "אחרי שהוואטסאפ נפתח, הדסק שומר מי קיבל את התור. אתם כותבים מה קרה. השרשור נשאר בטלפון.",
      bullets: ["מי נפתח לו וואטסאפ, ומאיזה מקור", "הערה וסטטוס: פתוח, טופל, או סגור", "מעקב עם ערך משוער, לא כסף שנגבה"],
      alt: "לוח דסק עם שלושה כרטיסי אנשי צוות וחץ שמסתובב ביניהם",
      rows: [
        { name: "עומר", src: "meta" },
        { name: "דנה", src: "qr" },
        { name: "נועה", src: "google" },
      ],
      new: "קליק חדש",
      title2: "דסק",
    },
    rules: {
      title: "העבודה שלכם. הכללים שלכם.",
      sub: "כללים על התור. אף כלל לא שולח הודעת וואטסאפ בשבילכם.",
      items: [
        { title: "שעות עבודה", text: "מחוץ לשעות, המספר לא מקבל קליקים.", icon: 5 },
        { title: "מכסה יומית", text: "כשהמכסה נגמרת, התור עובר הלאה.", icon: 6 },
        { title: "חזרה לאותו אדם", text: "אפשר להחזיר את אותו דפדפן לאותו מספר לכמה ימים.", icon: 7 },
        { title: "הזמנת צוות", text: "קישור הזמנה ל־7 ימים. בעל החשבון קובע תפקיד.", icon: 8 },
      ],
    },
    pricing: {
      title: "מחיר אחד. בלי מנוי.",
      sub: "שבוע ניסיון מלא, ואז תשלום אחד לשלוש שנים, עד גמר המלאי.",
      plans: [
        {
          badge: "ניסיון",
          name: "שבוע ראשון",
          price: "0",
          note: "ש״ח, בלי כרטיס",
          items: ["3 קישורים", "5 מושבי וואטסאפ", "כפתור לאתר וקוד QR", "דוח ל־30 יום", "תמיכה בסיסית"],
          cta: "לפתוח חשבון",
        },
        {
          badge: "הכי פופולרי",
          name: "Agency",
          price: "49",
          note: "ש״ח פעם אחת. שלוש שנים.",
          items: [
            "20 קישורים פעילים",
            "10 מספרי וואטסאפ",
            "קישור מותג, מודעה ורוטטור",
            "כפתור לאתר ו־QR בלי הגבלה",
            "קליקים בלי תקרה",
            "דוח מלא: קמפיין, תאריכים, מכשיר ומדינה",
            "תמיכה בעדיפות",
          ],
          cta: "לפתוח חשבון",
        },
      ],
    },
    faq: {
      title: "שאלות טובות. תשובות ישרות.",
      items: [
        { q: "אתם קוראים את הוואטסאפ?", a: "לא. קליק הוא העברה. השיחה נשארת בטלפון של מי שקיבל אותה." },
        { q: "קליק הוא מכירה?", a: "לא. קליק אומר שנפתח וואטסאפ. מכירה נרשמת אצלכם, עם ראיה משלכם." },
        { q: "צריך API רשמי?", a: "לא בשביל הקישור. אין כאן התחברות בקוד QR ואין שליחת הודעות." },
        { q: "כמה זה עולה?", a: "שבוע ניסיון: 3 קישורים ו־5 מושבים. אחר כך 49 ש״ח או 18 דולר פעם אחת, ושלוש שנים של תוכנית Agency, עד גמר המלאי." },
      ],
    },
    footer: {
      line: "קישור אחד. תור הוגן. השיחה נשארת שלכם.",
      made: "Who Ze Klik, wzk.io",
    },
  },
  en: {
    nav: {
      steps: "How it works",
      channels: "Channels",
      pricing: "Pricing",
      faq: "FAQ",
      cta: "Start free",
      toggle: "עב",
    },
    hero: {
      line1: "One link.",
      line2: "Every click.",
      line3: "The right person.",
      sub: "Put one link in your ad, bio or QR code. Every visitor opens WhatsApp with the next teammate in line, on the number they already use.",
      cta: "Start free",
      secondary: "One week trial. Then 49 ILS once, for three years.",
      alt: "Phone with a green WhatsApp bubble and three teammates waiting in a queue",
    },
    steps: {
      title: "From campaign to conversation. No phone list.",
      sub: "Four steps. Zero automated messages.",
      items: [
        { n: "1", title: "Too quiet", text: "The campaign runs, but every lead lands on the same person." },
        { n: "2", title: "Drop the link", text: "One address replaces a list of phone numbers on all your ads." },
        { n: "3", title: "The queue picks", text: "Round robin or weighted. Paused numbers, quiet hours and daily caps simply skip." },
        { n: "4", title: "Chat opens", text: "With the next in line, on their phone. The handoff is logged on the desk." },
      ],
    },
    channels: {
      title: "Your campaigns. Connected.",
      sub: "The address never changes when the queue behind it does.",
      items: [
        { title: "Ads", text: "Meta, Google and TikTok stay on one address. Swap people in the queue, not in the ad.", icon: 2 },
        { title: "QR and bio", text: "The same link on a card, a sign or Instagram.", icon: 3 },
        { title: "Source", text: "Source, medium and campaign travel with the click into the report.", icon: 4 },
      ],
    },
    desk: {
      title: "Less guessing. A real desk.",
      sub: "After WhatsApp opens, the desk keeps who got the turn. You write what happened. The thread stays on the phone.",
      bullets: ["Who got the WhatsApp, and from which source", "Note and status: open, handled, or closed", "Tracking with an estimated value, not money collected"],
      alt: "Desk board with three teammate cards and an arrow rotating between them",
      rows: [
        { name: "Omer", src: "meta" },
        { name: "Dana", src: "qr" },
        { name: "Noa", src: "google" },
      ],
      new: "New click",
      title2: "Desk",
    },
    rules: {
      title: "Your work. Your rules.",
      sub: "Rules on the queue. No rule ever sends a WhatsApp message for you.",
      items: [
        { title: "Working hours", text: "Outside the hours, the number gets no clicks.", icon: 5 },
        { title: "Daily cap", text: "When the cap is reached, the queue moves on.", icon: 6 },
        { title: "Same person", text: "Send the same browser back to the same number for a few days.", icon: 7 },
        { title: "Invite the team", text: "A 7 day invite link. The account owner sets the role.", icon: 8 },
      ],
    },
    pricing: {
      title: "One price. No subscription.",
      sub: "A full trial week, then one payment for three years, while stock lasts.",
      plans: [
        {
          badge: "Trial",
          name: "First week",
          price: "0",
          note: "ILS, no card",
          items: ["3 links", "5 WhatsApp seats", "Website button and QR code", "30 day report", "Basic support"],
          cta: "Open account",
        },
        {
          badge: "Most popular",
          name: "Agency",
          price: "49",
          note: "ILS once. Three years.",
          items: [
            "20 active links",
            "10 WhatsApp numbers",
            "Brand, ad and rotator links",
            "Unlimited website button and QR",
            "Unlimited clicks",
            "Full report: campaign, dates, device and country",
            "Priority support",
          ],
          cta: "Open account",
        },
      ],
    },
    faq: {
      title: "Good questions. Straight answers.",
      items: [
        { q: "Do you read the WhatsApp?", a: "No. A click is a handoff. The conversation stays on the phone of whoever received it." },
        { q: "Is a click a sale?", a: "No. A click means WhatsApp opened. A sale is recorded by you, with your own evidence." },
        { q: "Do I need an official API?", a: "Not for the link. There is no QR code login and no message sending here." },
        { q: "How much does it cost?", a: "Trial week: 3 links and 5 seats. Then 49 ILS or 18 USD once, for three years of the Agency plan, while stock lasts." },
      ],
    },
    footer: {
      line: "One link. A fair queue. The conversation stays yours.",
      made: "Who Ze Klik, wzk.io",
    },
  },
};
