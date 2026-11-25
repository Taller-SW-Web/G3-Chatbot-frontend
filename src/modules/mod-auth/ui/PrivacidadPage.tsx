"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/shared/ui/icons/ArrowLeftIcon";

/**
 * `/privacidad`: Política de privacidad y protección de datos personales (Ley N.° 29733 / SPEC-05 / SPEC-23).
 */
export function PrivacidadPage() {
  const router = useRouter();

  const handleVolver = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="wf-phone flex flex-col h-screen max-h-[880px] bg-surface-cloud">
      <header className="flex items-center justify-between px-4 py-2 border-b border-border-inverse bg-surface-ink text-text-inverse sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Volver"
            onClick={handleVolver}
            className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse text-lg leading-none hover:bg-surface-ink cursor-pointer"
          >
            <ArrowLeftIcon size={20} />
          </button>
        </div>
        <p className="font-heading uppercase tracking-[0.08em] text-[16px]">POLÍTICA DE PRIVACIDAD</p>
        <div className="w-10" />
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 flex flex-col gap-4 text-text-primary text-[13px] leading-relaxed">
        <div className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-1.5">
          <p className="font-heading text-[15px] uppercase tracking-wide text-text-primary">
            Inka Athletics · Canal Chatbot
          </p>
          <p className="text-text-secondary text-[12px]">
            Tratamiento y protección de datos personales conforme a la Ley N.° 29733 del Perú.
          </p>
        </div>

        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            1. Marco Normativo y Finalidad
          </h2>
          <p className="text-text-secondary">
            En Inka Athletics tratamos los datos personales de nuestros clientes para gestionar la atención en el canal conversacional, tramitar compras, pedidos, despachos y requerimientos de postventa, en estricto cumplimiento de la Ley N.° 29733 de Protección de Datos Personales y su normativa aplicable.
          </p>
        </section>

        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            2. Asistente con Inteligencia Artificial
          </h2>
          <p className="text-text-secondary">
            Las interacciones y consultas son asistidas por un modelo de inteligencia artificial. Por seguridad de nuestros usuarios, se aplican filtros de datos sensibles. Nunca debes ingresar contraseñas, códigos de verificación OTP ni números de tarjeta en el chat; dichos datos solo se gestionan mediante formularios protegidos y en la pantalla de pago.
          </p>
        </section>

        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            3. Imágenes y Archivos Adjuntos
          </h2>
          <p className="text-text-secondary">
            Las imágenes adjuntas para consultas de productos se procesan de forma privada eliminando metadatos EXIF y de ubicación. Se recomienda evitar enviar fotos que contengan rostros, documentos de identidad o tarjetas de crédito/débito.
          </p>
        </section>

        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            4. Conservación y Seguridad
          </h2>
          <p className="text-text-secondary">
            Los datos son almacenados en entornos seguros y conservados únicamente durante el tiempo necesario para la atención del servicio, cumplimiento de órdenes de compra y obligaciones legales.
          </p>
        </section>

        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            5. Derechos ARCO
          </h2>
          <p className="text-text-secondary">
            Como titular de tus datos personales, puedes ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO) comunicándote con los canales oficiales de atención y privacidad de Inka Athletics.
          </p>
        </section>

        <div className="pt-2 pb-4">
          <button
            type="button"
            onClick={handleVolver}
            className="wf-btn w-full py-3 text-[12px] font-bold bg-action-primary text-surface-ink hover:bg-action-primary-hover active:scale-[0.98] transition-all shadow-sm cursor-pointer"
          >
            VOLVER
          </button>
        </div>
      </main>
    </div>
  );
}
