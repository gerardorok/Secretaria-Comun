/**
 * Catálogo central de módulos documentales del sistema.
 *
 * Cada módulo describe un tipo de documento institucional que se genera a
 * partir de una plantilla .docx. Agregar un nuevo módulo (ej: Citaciones,
 * Oficios, Traslados, Autos) sólo requiere:
 *   1. Añadir una entrada en este catálogo
 *   2. Crear su página correspondiente bajo /pages
 *   3. Registrar la ruta en App.js
 *
 * El selector inicial (HomeSelector) se construye automáticamente desde
 * este catálogo, garantizando coherencia visual y mínima duplicación.
 */
import { FileText, Mail, Send, FileSignature, Files, Archive } from "lucide-react";

export const MODULES = [
  {
    id: "aviso",
    title: "Notificación por Aviso",
    description:
      "Genera el aviso institucional dirigido al destinatario cuando no se logra la notificación personal. Incluye anexo de providencia y datos de envío.",
    route: "/aviso",
    icon: FileText,
    accent: "#2D3480",
    accentSoft: "rgba(45,52,128,0.10)",
    badge: "Activo",
    enabled: true,
    testId: "module-card-aviso",
  },
  {
    id: "electronica",
    title: "Notificación Electrónica",
    description:
      "Notifica electrónicamente al destinatario mediante correo electrónico la providencia proferida por la Contraloría.",
    route: "/electronica",
    icon: Mail,
    accent: "#D63421",
    accentSoft: "rgba(214,52,33,0.10)",
    badge: "Nuevo",
    enabled: true,
    testId: "module-card-electronica",
  },
  // Slots preparados para futuros módulos
  {
    id: "citacion",
    title: "Citación a Notificación Personal",
    description:
      "Cita al destinatario para realizar la notificación personal de una providencia. Soporta vinculación con una segunda providencia y manejo de correo opcional.",
    route: "/citacion",
    icon: Send,
    accent: "#F0BA41",
    accentSoft: "rgba(240,186,65,0.18)",
    badge: "Nuevo",
    enabled: true,
    testId: "module-card-citacion",
  },
  {
    id: "oficio",
    title: "Oficio",
    description:
      "Comunicación oficial dirigida a entidades, dependencias o personas naturales en el marco de un proceso.",
    route: "/oficio",
    icon: FileSignature,
    accent: "#2D3480",
    accentSoft: "rgba(45,52,128,0.10)",
    badge: "Próximamente",
    enabled: false,
    testId: "module-card-oficio",
  },
  {
    id: "traslado",
    title: "Traslado",
    description:
      "Traslada actuaciones, expedientes o cargos a una autoridad competente para continuar con el proceso.",
    route: "/traslado",
    icon: Files,
    accent: "#D63421",
    accentSoft: "rgba(214,52,33,0.10)",
    badge: "Próximamente",
    enabled: false,
    testId: "module-card-traslado",
  },
  {
    id: "auto",
    title: "Auto",
    description:
      "Documento decisorio del proceso de responsabilidad fiscal (apertura, archivo, fallo, entre otros).",
    route: "/auto",
    icon: Archive,
    accent: "#F0BA41",
    accentSoft: "rgba(240,186,65,0.18)",
    badge: "Próximamente",
    enabled: false,
    testId: "module-card-auto",
  },
];

export const getEnabledModules = () => MODULES.filter((m) => m.enabled);
export const getModule = (id) => MODULES.find((m) => m.id === id);
