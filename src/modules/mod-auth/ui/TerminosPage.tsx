"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/shared/ui/icons/ArrowLeftIcon";

/**
 * `/terminos`: Términos y condiciones del canal conversacional Inka Athletics (SPEC-01 Req. 2).
 */
export function TerminosPage() {
  const router = useRouter();

  const handleVolver = () => {
    // Si la página se abrió en una nueva pestaña (target="_blank" desde RegistroForm)
    // o por carga directa, no hay historial previo en la pestaña (history.length <= 1).
    // En ese caso, router.back() no tiene efecto; se usa fallback a la raíz "/" para
    // que el usuario pueda volver a la aplicación.
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
        <p className="font-heading uppercase tracking-[0.08em] text-[16px]">TÉRMINOS Y CONDICIONES</p>
        <div className="w-10" />
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 flex flex-col gap-4 text-text-primary text-[13px] leading-relaxed">
        <div className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-1.5">
          <p className="font-heading text-[15px] uppercase tracking-wide text-text-primary">
            Inka Athletics · Canal Chatbot
          </p>
          <p className="text-text-secondary text-[12px]">
            Términos y condiciones de uso y compra en la plataforma conversacional.
          </p>
        </div>

        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            1. Ámbito y Uso del Canal
          </h2>
          <p className="text-text-secondary">
            Este canal permite interactuar con el catálogo oficial de Inka Athletics, consultar disponibilidad de productos deportivos, gestionar pedidos y solicitar atención postventa.
          </p>
        </section>

        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            2. Asistente Virtual y Seguridad de Datos
          </h2>
          <p className="text-text-secondary">
            La atención y recomendaciones son procesadas con asistencia de inteligencia artificial. Por tu estricta seguridad, nunca debes compartir contraseñas, códigos de verificación OTP ni datos sensibles de tarjetas de crédito o débito a través del chat. Para detalles sobre el tratamiento de tus datos, consulta la{" "}
            <a href="/privacidad" className="underline text-text-primary font-medium hover:text-action-primary">
              política de privacidad
            </a>.
          </p>
        </section>

        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            3. Registro y Custodia de Cuenta
          </h2>
          <p className="text-text-secondary">
            El registro de cuenta es obligatorio para concretar compras y realizar el seguimiento de pedidos. El cliente es el único responsable de la veracidad de los datos consignados y de la custodia de sus credenciales de acceso.
          </p>
        </section>

        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            4. Precios, Disponibilidad y Pedidos
          </h2>
          <p className="text-text-secondary">
            Todos los precios están expresados en Soles (PEN) e incluyen impuestos de ley (IGV). Las órdenes están sujetas a la confirmación de inventario y validación del medio de pago en el checkout.
          </p>
        </section>

        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            5. Envíos y Entregas
          </h2>
          <p className="text-text-secondary">
            Los plazos de entrega y las tarifas de despacho se cotizan de acuerdo con el distrito de destino seleccionado al momento de completar la compra.
          </p>
        </section>

        <section className="rounded-md bg-white border border-border-default p-4 shadow-xs flex flex-col gap-2">
          <h2 className="font-heading text-[14px] uppercase tracking-wide text-text-primary">
            6. Postventa, Cambios y Reclamos
          </h2>
          <p className="text-text-secondary">
            Las solicitudes de cambio, devolución o registro de reclamos se atienden conforme a las políticas del canal y a la normativa de protección al consumidor vigente en el Perú.
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
