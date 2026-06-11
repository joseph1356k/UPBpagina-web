import Link from "next/link";
import {
  ArrowRight,
  Ban,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileQuestion,
  KeyRound,
  Mail,
  MapPin,
  PencilLine,
  QrCode as QrCodeIcon,
  ScanLine,
  Send,
  ShieldCheck,
  TimerOff,
  UserX,
  XCircle,
} from "lucide-react";

import { QrCode } from "@/components/shared/qr-code";
import { UpbShield } from "@/components/shared/upb-shield";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <ForGraduates />
      <KeyDates />
      <DigitalPass />
      <EventDay />
      <RealCases />
      <ForAdmins />
      <Security />
      <Faq />
      <Support />
      <FinalCta />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                              */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative overflow-hidden upb-warm-bg">
      <div
        className="grid-bg pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
      />
      {/* Decorative gold ribbon at top */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent opacity-70"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-20 pb-20 md:px-8 md:pt-28 md:pb-24 lg:grid-cols-[1.5fr_1fr]">
        {/* Copy */}
        <div>
          <div className="animate-in-up mb-7 flex items-center gap-3">
            <UpbShield className="size-9 shrink-0" />
            <p className="border-l border-border pl-3 leading-snug">
              <span className="block font-serif text-sm font-semibold text-foreground">
                Universidad Pontificia Bolivariana
              </span>
              <span className="block text-xs text-muted-foreground">
                Plataforma de ceremonias de grado
              </span>
            </p>
          </div>
          <h1 className="animate-in-up stagger-1 max-w-3xl text-balance font-serif text-4xl font-semibold leading-[1.05] tracking-tight md:text-[3.4rem] lg:text-[3.6rem]">
            Registro de invitados a ceremonias de grado,{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 text-primary">sin filas</span>
              <span
                aria-hidden
                className="gold-shimmer absolute inset-x-0 bottom-1 h-2 -z-0 rounded-sm opacity-50"
              />
            </span>{" "}
            y con trazabilidad.
          </h1>
          <p className="animate-in-up stagger-2 mt-7 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Una plataforma institucional para que los graduandos registren a sus
            invitados desde cualquier lugar, reciban invitaciones digitales con
            QR único, y el día del evento UPB valide cada ingreso en segundos.
          </p>
          <div className="animate-in-up stagger-3 mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="group">
              <Link href={ROUTES.registro}>
                Registrar mis invitados
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#como-funciona">Ver cómo funciona</Link>
            </Button>
          </div>
          <p className="animate-in-up stagger-4 mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Tus datos se tratan según la Ley 1581 de 2012 de protección de datos.
          </p>
        </div>

        {/* UPB shield emblem */}
        <div className="animate-in-up stagger-2 relative hidden lg:flex lg:justify-center">
          <div
            aria-hidden
            className="absolute inset-0 m-auto size-72 rounded-full bg-brand-gold/15 blur-3xl"
          />
          <div className="card-lift relative flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card/80 px-10 py-10 shadow-sm backdrop-blur">
            <UpbShield className="size-44 drop-shadow-sm" />
            <div className="text-center">
              <p className="font-serif text-base font-semibold leading-tight text-foreground">
                Universidad Pontificia
                <br />
                Bolivariana
              </p>
              <p className="mt-1.5 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Desde 1936
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Trust strip                                                       */
/* ------------------------------------------------------------------ */

function TrustStrip() {
  const stats = [
    { label: "Ceremonias por año", value: "12+" },
    { label: "Graduandos por ceremonia", value: "180" },
    { label: "Cupos típicos por graduando", value: "3–4" },
    { label: "Validación de QR", value: "< 2s" },
  ];
  return (
    <section className="border-y border-border/60 bg-brand-surface/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden bg-border/60 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-1 bg-brand-surface px-5 py-6 md:px-8 md:py-8"
          >
            <p className="font-serif text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">
              {s.value}
            </p>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section heading helper                                            */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  lede,
  center = false,
  className,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-12 max-w-2xl md:mb-14",
        center && "mx-auto text-center",
        className,
      )}
    >
      <p className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </p>
      <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight md:text-[2.4rem]">
        {title}
      </h2>
      {lede ? (
        <p
          className={cn(
            "mt-4 max-w-xl text-pretty text-muted-foreground",
            center && "mx-auto",
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  How it works                                                      */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  const steps = [
    {
      title: "Verifica tu identidad",
      description:
        "Ingresa tu documento. Recibirás un código de un solo uso en tu correo institucional para confirmar que eres tú.",
    },
    {
      title: "Registra a tus invitados",
      description:
        "Agrega el nombre y correo de cada invitado, hasta el cupo asignado para tu ceremonia y programa.",
    },
    {
      title: "Cada invitado recibe su pase",
      description:
        "Enviamos una invitación digital por correo con un QR único e intransferible.",
    },
    {
      title: "Pasan en segundos",
      description:
        "El día de la ceremonia el personal de UPB escanea el QR. Sin colas, sin papeles, sin confusión.",
    },
  ];
  return (
    <section id="como-funciona" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Cómo funciona"
          title="Cuatro pasos. Desde el celular. Listo en minutos."
          lede="Diseñado para que el graduando no necesite una explicación. Si puedes usar el correo, puedes usar la plataforma."
        />

        {/* Stepper — connected timeline, editorial style */}
        <ol className="relative flex flex-col gap-10 md:grid md:grid-cols-4 md:gap-8">
          {/* Vertical connector (mobile) */}
          <span
            aria-hidden
            className="absolute left-[17px] top-2 bottom-2 w-px bg-border md:hidden"
          />
          {/* Horizontal connector (desktop) */}
          <span
            aria-hidden
            className="absolute left-[12.5%] right-[12.5%] top-[17px] hidden h-px bg-border md:block"
          />
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="relative flex gap-5 md:flex-col md:gap-4 md:text-center"
            >
              <span
                aria-hidden
                className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-base font-semibold text-primary-foreground shadow-sm ring-4 ring-background md:mx-auto"
              >
                {i + 1}
              </span>
              <div className="pt-1 md:pt-0">
                <h3 className="font-serif text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Para graduandos                                                   */
/* ------------------------------------------------------------------ */

function ForGraduates() {
  const abilities = [
    "Ver tu ceremonia asignada: fecha, hora y lugar",
    "Consultar cuántos cupos tienes disponibles",
    "Registrar a tus invitados con nombre y correo",
    "Editar o reemplazar invitados antes de la fecha límite",
    "Reenviar la invitación si alguien no la recibió",
    "Seguir el estado de cada pase en tiempo real",
  ];
  const states = [
    {
      label: "Invitación enviada",
      tone: "border-info/40 bg-info/10 text-info",
      description: "El correo salió con el pase adjunto.",
    },
    {
      label: "QR generado",
      tone: "border-warning/40 bg-warning/10 text-warning",
      description: "El pase está activo y listo para usarse.",
    },
    {
      label: "Ingreso validado",
      tone: "border-success/40 bg-success/10 text-success",
      description: "Tu invitado ya entró a la ceremonia.",
    },
  ];
  return (
    <section
      id="graduandos"
      className="border-y border-border/70 bg-brand-surface/40 py-20 md:py-28"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 md:px-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <SectionHeading
            eyebrow="Para graduandos"
            title="Tu ceremonia, bajo tu control."
            lede="Desde tu portal personal gestionas todo el proceso de invitados — sin trámites presenciales ni correos de ida y vuelta."
            className="mb-8 md:mb-8"
          />
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {abilities.map((a) => (
              <li key={a} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="text-foreground/85">{a}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-8" size="lg">
            <Link href={ROUTES.registro}>
              Entrar a mi portal
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {/* Estado flow */}
        <Card className="px-6 py-6 ring-foreground/8">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Así sigues cada pase
          </p>
          <ol className="relative mt-5 flex flex-col gap-6">
            <span
              aria-hidden
              className="absolute left-[7px] top-3 bottom-3 w-px bg-border"
            />
            {states.map((s) => (
              <li key={s.label} className="relative flex items-start gap-4">
                <span
                  aria-hidden
                  className="relative z-10 mt-1 size-3.5 shrink-0 rounded-full border-2 border-background bg-primary"
                />
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      s.tone,
                    )}
                  >
                    {s.label}
                  </span>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Fechas importantes                                                */
/* ------------------------------------------------------------------ */

function KeyDates() {
  const dates = [
    {
      icon: CalendarClock,
      label: "Cierre de registro",
      value: "12 de junio",
      detail: "Hasta las 11:59 p.m. puedes agregar invitados.",
    },
    {
      icon: PencilLine,
      label: "Límite de edición",
      value: "12 de junio",
      detail: "Cambios y reemplazos hasta el cierre del registro.",
    },
    {
      icon: CalendarDays,
      label: "Día de la ceremonia",
      value: "19 de junio · 9:00 a.m.",
      detail: "Auditorio Mons. Felipe Estrada Vélez · Medellín.",
    },
  ];
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Fechas importantes"
          title="Cada ceremonia tiene su calendario."
          lede="Las fechas se definen por ceremonia y se muestran en tu portal apenas ingresas. Este es un ejemplo del calendario típico."
        />

        <div className="relative">
          <p className="mb-4 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 text-primary" />
            Ejemplo · Grados Facultad de Ingenierías — Junio 2026
          </p>
          <ol className="relative grid gap-8 md:grid-cols-3 md:gap-6">
            <span
              aria-hidden
              className="absolute left-[12px] top-4 bottom-4 w-px bg-border md:hidden"
            />
            {dates.map((d, i) => (
              <li
                key={d.label}
                className="card-lift relative rounded-xl border border-border bg-card px-5 py-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <d.icon aria-hidden className="size-5 text-primary" />
                  <span
                    aria-hidden
                    className="font-serif text-sm font-semibold text-muted-foreground/50"
                  >
                    {i + 1} / {dates.length}
                  </span>
                </div>
                <p className="mt-4 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {d.label}
                </p>
                <p className="mt-1 font-serif text-xl font-semibold tracking-tight text-foreground">
                  {d.value}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{d.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Pase digital (invitación de ejemplo)                              */
/* ------------------------------------------------------------------ */

function DigitalPass() {
  return (
    <section className="border-y border-border/70 bg-brand-surface/40 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:px-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow="La invitación digital"
            title="Un pase personal, directo al correo."
            lede="Cada invitado recibe un enlace con su pase: los datos de la ceremonia y un código QR único. Sirve desde el celular, en captura de pantalla o impreso."
            className="mb-8 md:mb-8"
          />
          <ul className="grid gap-2.5">
            {[
              "Llega por correo apenas el graduando envía las invitaciones",
              "El QR es único por invitado: solo permite un ingreso",
              "Funciona sin conexión: basta mostrar la pantalla",
              "Si se pierde, el graduando puede reenviarlo desde su portal",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="text-foreground/85">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Example pass card */}
        <div className="relative mx-auto w-full max-w-sm">
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-gold/10 blur-2xl"
          />
          <article
            aria-label="Ejemplo de pase de ingreso"
            className="card-lift overflow-hidden rounded-2xl border border-border bg-card shadow-md"
          >
            {/* Gold ribbon */}
            <div
              aria-hidden
              className="h-1 bg-gradient-to-r from-primary via-brand-gold to-primary"
            />
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <UpbShield className="size-7" />
                <div className="leading-tight">
                  <p className="font-serif text-sm font-semibold">
                    Pase de ingreso
                  </p>
                  <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Ceremonia de grado
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[0.68rem] font-medium text-warning">
                <QrCodeIcon className="size-3" />
                QR generado
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-5">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Invitada
                  </dt>
                  <dd className="font-medium text-foreground">
                    María Eugenia Reyes
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Te invita
                  </dt>
                  <dd className="font-medium text-foreground">
                    Carlos Morales Reyes
                  </dd>
                  <dd className="text-xs text-muted-foreground">
                    Trabajo Social
                  </dd>
                </div>
              </dl>
              <QrCode
                value="https://ceremonias.upb.edu.co/invitacion/ejemplo"
                size={120}
              />
            </div>

            <div className="space-y-1.5 border-t border-border bg-muted/30 px-5 py-4 text-sm">
              <p className="flex items-center gap-2 text-foreground/85">
                <CalendarDays className="size-3.5 shrink-0 text-primary" />
                Viernes, 19 de junio de 2026 · 9:00 a.m.
              </p>
              <p className="flex items-center gap-2 text-foreground/85">
                <MapPin className="size-3.5 shrink-0 text-primary" />
                Auditorio Mons. Felipe Estrada Vélez, Medellín
              </p>
            </div>
          </article>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Pase de ejemplo con datos ilustrativos.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Día del evento                                                    */
/* ------------------------------------------------------------------ */

function EventDay() {
  const flow = [
    {
      icon: ScanLine,
      title: "Personal autorizado escanea",
      description:
        "Solo el equipo acreditado por UPB opera el escáner, desde su propio celular.",
    },
    {
      icon: ShieldCheck,
      title: "El sistema decide al instante",
      description:
        "Válido, ya usado, inválido o de otra ceremonia — la respuesta llega en menos de dos segundos.",
    },
    {
      icon: Clock,
      title: "La hora de ingreso queda registrada",
      description:
        "Cada entrada se guarda automáticamente con su hora exacta y el operador que la validó.",
    },
    {
      icon: QrCodeIcon,
      title: "Reporte de asistencia en vivo",
      description:
        "La coordinación ve en tiempo real cuántos invitados han ingresado, sin contar a mano.",
    },
  ];
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <SectionHeading
          eyebrow="El día del evento"
          title="La entrada fluye, el control queda."
        />

        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <ol className="grid gap-6 sm:grid-cols-2">
            {flow.map((f) => (
              <li key={f.title} className="flex items-start gap-3.5">
                <f.icon
                  aria-hidden
                  className="mt-0.5 size-5 shrink-0 text-primary"
                />
                <div>
                  <h3 className="font-serif text-base font-semibold tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Live report mock */}
          <Card className="px-6 py-6 ring-foreground/8">
            <div className="flex items-center justify-between">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Asistencia en vivo
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                <span
                  aria-hidden
                  className="size-1.5 animate-pulse rounded-full bg-success"
                />
                En curso
              </span>
            </div>
            <p className="mt-4 font-serif text-4xl font-semibold tracking-tight tabular-nums">
              76
              <span className="text-xl text-muted-foreground"> / 108</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              invitados han ingresado
            </p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                aria-hidden
                className="h-full w-[70%] rounded-full bg-success"
              />
            </div>
            <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <p className="flex items-center justify-between">
                <span>10:42 · María E. Reyes</span>
                <span className="text-success">Ingreso válido</span>
              </p>
              <p className="flex items-center justify-between">
                <span>10:43 · José A. Morales</span>
                <span className="text-success">Ingreso válido</span>
              </p>
              <p className="flex items-center justify-between">
                <span>10:43 · Pase repetido</span>
                <span className="text-destructive">Rechazado</span>
              </p>
            </div>
            <p className="mt-4 text-[0.68rem] text-muted-foreground/70">
              Vista ilustrativa del panel de coordinación.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Preparado para casos reales                                       */
/* ------------------------------------------------------------------ */

function RealCases() {
  const cases = [
    {
      icon: XCircle,
      label: "QR ya usado",
      description:
        "El sistema muestra a qué hora ingresó y no permite un segundo uso.",
    },
    {
      icon: Ban,
      label: "QR inválido",
      description:
        "Códigos falsos o alterados se rechazan al instante y quedan en el registro.",
    },
    {
      icon: UserX,
      label: "Cupo completo",
      description:
        "No se pueden registrar más invitados del cupo asignado — ni por error.",
    },
    {
      icon: CalendarClock,
      label: "Registro cerrado",
      description:
        "Pasada la fecha límite, el portal lo indica con claridad y bloquea cambios.",
    },
    {
      icon: TimerOff,
      label: "Código vencido",
      description:
        "Los códigos de acceso caducan a los 10 minutos; basta solicitar uno nuevo.",
    },
    {
      icon: FileQuestion,
      label: "Documento no encontrado",
      description:
        "Si tu registro aún no está cargado, te indicamos a quién contactar.",
    },
  ];
  return (
    <section className="border-y border-border/70 bg-brand-surface/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Preparado para casos reales"
          title="Los imprevistos también están contemplados."
          lede="Una ceremonia tiene cientos de personas y poco margen de error. Cada situación tiene una respuesta clara — para el invitado, el graduando y el personal."
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <li key={c.label}>
              <Card className="card-lift h-full px-5 py-5 ring-foreground/8">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <c.icon aria-hidden className="size-4 shrink-0 text-destructive/80" />
                  {c.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {c.description}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Para administradores                                              */
/* ------------------------------------------------------------------ */

function ForAdmins() {
  const modules = [
    { name: "Ceremonias", description: "Crea y programa cada evento." },
    { name: "Graduandos", description: "Importa la base desde Excel." },
    { name: "Invitados", description: "Consulta y revoca pases." },
    { name: "Cupos", description: "Ajusta límites por graduando." },
    { name: "Correos enviados", description: "Notificaciones e invitaciones." },
    { name: "Escaneo en vivo", description: "Ingresos en tiempo real." },
    { name: "Reportes", description: "Exporta a CSV con filtros." },
    { name: "Auditoría", description: "Historial inmutable de acciones." },
    { name: "Usuarios y roles", description: "Administradores y escáneres." },
  ];
  return (
    <section id="admin" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Para el equipo de coordinación"
          title="Un panel, todos los módulos de la operación."
          lede="Desde importar la base oficial hasta exportar el reporte final de asistencia: cada etapa de la ceremonia tiene su módulo."
        />
        <ul className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <li
              key={m.name}
              className="group bg-card px-5 py-4 transition-colors hover:bg-muted/50"
            >
              <h3 className="flex items-center justify-between font-serif text-base font-semibold tracking-tight">
                {m.name}
                <ArrowRight
                  aria-hidden
                  className="size-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                />
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {m.description}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Button asChild size="lg" variant="outline">
            <Link href={ROUTES.admin}>
              Acceder al panel
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Seguridad                                                         */
/* ------------------------------------------------------------------ */

function Security() {
  const points = [
    "Cada QR sirve una sola vez: al validarse queda marcado y no se puede reutilizar.",
    "Solo los graduandos autorizados por su facultad pueden registrar invitados.",
    "El personal de escaneo y los administradores tienen roles y permisos separados.",
    "Las acciones importantes quedan en un registro de auditoría que no se puede borrar.",
    "El acceso del graduando se confirma con un código enviado a su correo institucional.",
    "Los datos personales se tratan según la Ley 1581 de 2012 de protección de datos.",
  ];
  return (
    <section
      id="seguridad"
      className="border-y border-border/70 bg-brand-surface/40 py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Seguridad institucional"
          title="Cada pase es único, cada acción queda registrada."
          lede="Sin tecnicismos: estas son las garantías que protegen tu ceremonia."
          center
        />
        <ul className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
          {points.map((p) => (
            <li
              key={p}
              className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3.5 text-sm leading-relaxed text-foreground/85"
            >
              <ShieldCheck
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-primary"
              />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                               */
/* ------------------------------------------------------------------ */

function Faq() {
  const faqs = [
    {
      q: "¿Qué hago si no me llega el código de acceso?",
      a: "Revisa la carpeta de spam o correo no deseado. El código puede tardar hasta un minuto. Si no llega, usa la opción «Reenviar código» — y si el problema persiste, es posible que tu correo institucional esté mal registrado: contacta a Secretaría Académica con tu documento.",
    },
    {
      q: "¿Puedo cambiar un invitado después de registrarlo?",
      a: "Sí, mientras esté en borrador puedes editarlo libremente. Si ya enviaste su invitación, puedes revocar el pase y registrar a otra persona en su lugar, siempre antes de la fecha límite. El pase revocado deja de funcionar de inmediato.",
    },
    {
      q: "¿Qué pasa si escribí mal el correo de mi invitado?",
      a: "Si la invitación aún no se envió, corrige el correo desde tu portal. Si ya se envió, revoca ese pase y crea el invitado de nuevo con el correo correcto — el QR anterior queda invalidado automáticamente.",
    },
    {
      q: "¿El QR sirve en una captura de pantalla?",
      a: "Sí. Funciona desde el correo, en captura de pantalla o impreso en papel. Lo importante: el código es personal y solo permite un ingreso, así que no lo compartas públicamente.",
    },
    {
      q: "¿Qué pasa si mi invitado pierde el QR?",
      a: "Entra a tu portal y reenvía la invitación: le llegará de nuevo el mismo pase al correo. No se genera un código distinto, así que el pase original sigue siendo válido.",
    },
    {
      q: "¿Qué hago si mi documento no aparece en el sistema?",
      a: "Significa que tu facultad aún no ha cargado tu registro a la plataforma. Escribe a Secretaría Académica indicando tu nombre completo, documento y programa para que verifiquen tu inclusión en la ceremonia.",
    },
  ];
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Preguntas frecuentes"
          title="Resolvemos las dudas antes de que aparezcan."
          center
        />
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {faqs.map((f) => (
            <details key={f.q} className="group px-5 py-4 open:bg-muted/30">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Soporte                                                           */
/* ------------------------------------------------------------------ */

function Support() {
  return (
    <section
      id="soporte"
      className="border-t border-border/70 bg-brand-surface/40 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Soporte"
          title="Personas reales detrás de la plataforma."
          lede="Si algo no funciona como esperabas, estos son los canales oficiales de atención."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="px-6 py-6 ring-foreground/8">
            <h3 className="flex items-center gap-2 font-serif text-base font-semibold">
              <KeyRound aria-hidden className="size-4 text-primary" />
              Secretaría Académica
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Registro de graduandos, cupos, habilitaciones y novedades
              académicas.
            </p>
            <a
              href="mailto:secretaria.academica@upb.edu.co"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <Mail className="size-3.5" />
              secretaria.academica@upb.edu.co
            </a>
          </Card>

          <Card className="px-6 py-6 ring-foreground/8">
            <h3 className="flex items-center gap-2 font-serif text-base font-semibold">
              <Send aria-hidden className="size-4 text-primary" />
              Soporte de la plataforma
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Problemas técnicos: códigos que no llegan, errores del portal o
              pases que no se generan.
            </p>
            <a
              href="mailto:soporte.ceremonias@upb.edu.co"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <Mail className="size-3.5" />
              soporte.ceremonias@upb.edu.co
            </a>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              Lunes a viernes · 8:00 a.m. – 12:00 m. y 2:00 – 5:00 p.m.
            </p>
          </Card>

          <Card className="bg-muted/30 px-6 py-6 ring-foreground/8">
            <h3 className="font-serif text-base font-semibold">
              Para ayudarte más rápido
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Incluye en tu mensaje:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-foreground/85">
              {[
                "Nombre completo y documento",
                "Programa académico y ceremonia",
                "Descripción breve del problema",
                "Pantallazo del error, si aplica",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Final CTA                                                         */
/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="border-t border-border/70 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center md:px-8 md:py-24">
        <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight md:text-[2.5rem]">
          Tu ceremonia se merece una entrada sin contratiempos.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-primary-foreground/85">
          Si ya tienes acceso a la plataforma, registra a tus invitados ahora.
          Si eres administrador, accede al panel para gestionar la ceremonia.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="secondary">
            <Link href={ROUTES.registro}>
              Registrar mis invitados
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Link href={ROUTES.admin}>Acceder al panel administrador</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
