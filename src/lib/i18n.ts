import type { Locale } from "./locale.js";

const STRINGS = {
  leave_approved: {
    en: "Your leave request was submitted and is pending manager approval.",
    ar: "تم إرسال طلب الإجازة وهو بانتظار موافقة المدير.",
  },
  leave_rejected: {
    en: "Leave request refused: requested days exceed your available balance.",
    ar: "رُفض طلب الإجازة: الأيام المطلوبة أكبر من رصيدك المتاح.",
  },
  missing_iqama: {
    en: "Iqama copy is still missing. Upload it to continue onboarding.",
    ar: "صورة الإقامة ما زالت ناقصة. ارفعها لإكمال التوظيف.",
  },
  sop_found: {
    en: "I found a matching HR procedure.",
    ar: "وجدت إجراء موارد بشرية مطابقًا.",
  },
  sop_missing: {
    en: "I logged this for HR. There is no SOP on file for that request.",
    ar: "سجلت الطلب لإدارة الموارد البشرية. لا يوجد إجراء معتمد لهذا الموضوع.",
  },
  checkin_saved: {
    en: "Daily check-in saved to the performance sheet.",
    ar: "تم حفظ المتابعة اليومية في ورقة الأداء.",
  },
  gratuity_result: {
    en: "End-of-service gratuity has been calculated from the coded rules.",
    ar: "تم احتساب مكافأة نهاية الخدمة حسب القواعد المعتمدة.",
  },
  onboarding_next_step: {
    en: "Onboarding updated. Complete the next required item.",
    ar: "تم تحديث التوظيف. أكمل البند المطلوب التالي.",
  },
  ask_employee_number: {
    en: "I could not match this WhatsApp number. Please send your employee number.",
    ar: "لم أتعرف على رقم الواتساب. أرسل رقم الموظف الخاص بك.",
  },
  web_footer: {
    en: "You can also finish this in the HR web portal.",
    ar: "يمكنك إكمال الطلب أيضًا عبر بوابة الموارد البشرية.",
  },
  whatsapp_footer: {
    en: "Reply with leave or اجازة to start a time-off request.",
    ar: "رد بكلمة leave أو اجازة لبدء طلب إجازة.",
  },
  iqama_expiring: {
    en: "Iqama expiry is approaching. Renew before the date on file.",
    ar: "قرب انتهاء الإقامة. جددها قبل التاريخ المسجل.",
  },
  iqama_expired: {
    en: "Iqama on file has already expired.",
    ar: "الإقامة المسجلة منتهية.",
  },
} as const;

export type I18nKey = keyof typeof STRINGS;

export function t(key: I18nKey, locale: Locale): string {
  return STRINGS[key][locale];
}
