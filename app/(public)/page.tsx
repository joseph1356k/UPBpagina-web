import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  FileCheck2,
  KeyRound,
  QrCode,
  ShieldCheck,
  Users,
} from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { UpbShield } from "@/components/shared/upb-shield";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <ForAdmins />
      <Security />
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
        <div className="mb-12 max-w-2xl md:mb-16">
          <p className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-primary">
            Cómo funciona
          </p>
          <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight md:text-[2.4rem]">
            Cuatro pasos. Desde el celular. Listo en minutos.
          </h2>
          <p className="mt-4 max-w-xl text-pretty text-muted-foreground">
            Diseñado para que el graduando no necesite una explicación. Si
            puedes usar el correo, puedes usar la plataforma.
          </p>
        </div>

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
/*  For admins                                                        */
/* ------------------------------------------------------------------ */

function ForAdmins() {
  const features = [
    "Importación desde Excel con preview y validación",
    "Control de cupos por graduando y por ceremonia",
    "Notificación masiva a graduandos con un clic",
    "Reportes exportables a CSV con filtros granulares",
    "Auditoría inmutable de cada cambio y cada escaneo",
    "Roles separados: administrador y personal de escaneo",
  ];
  return (
    <section
      id="admin"
      className="border-y border-border/70 bg-brand-surface/40 py-20 md:py-28"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:px-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-primary">
            Para el equipo de coordinación
          </p>
          <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight md:text-[2.4rem]">
            Control completo, trazabilidad de cada acción.
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-muted-foreground">
            Importas la base oficial desde Excel, supervisas en tiempo real
            cuántos graduandos han completado el registro, exportas reportes
            y validas QRs el día del evento. Todo desde un solo panel.
          </p>
          <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="text-foreground/85">{f}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-9" size="lg" variant="outline">
            <Link href={ROUTES.admin}>
              Acceder al panel
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <AdminPreview />
      </div>
    </section>
  );
}

function AdminPreview() {
  return (
    <Card className="relative overflow-hidden bg-card px-5 py-5 ring-foreground/10 md:px-6 md:py-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span
            aria-hidden
            className="inline-block size-2 rounded-full bg-success"
          />
          <span className="font-medium">Vista previa del panel</span>
        </div>
        <span className="text-xs text-muted-foreground">datos de ejemplo</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <StatCard
          label="Graduandos"
          value="50"
          hint="Próximas 2 ceremonias"
          icon={Users}
          accent="info"
        />
        <StatCard
          label="Invitados con QR"
          value="108"
          hint="93% del cupo total"
          icon={QrCode}
          accent="primary"
          trend={{ label: "+12 hoy", direction: "up" }}
        />
        <StatCard
          label="Ingresos validados"
          value="76"
          hint="Última ceremonia"
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          label="Próxima ceremonia"
          value="19 jun"
          hint="Auditorio principal · 9:00 a.m."
          icon={CalendarCheck}
          accent="neutral"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -right-12 size-44 rounded-full bg-primary/8 blur-3xl"
      />
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Security                                                          */
/* ------------------------------------------------------------------ */

function Security() {
  const points = [
    {
      icon: ShieldCheck,
      title: "QR único e impredecible",
      description:
        "Cada pase se genera en el servidor con 256 bits de aleatoriedad criptográfica. Imposible de adivinar o falsificar fuera de la plataforma.",
    },
    {
      icon: FileCheck2,
      title: "Validación transaccional",
      description:
        "Cuando un QR se escanea queda marcado como utilizado en una sola operación. Ningún código vale dos veces.",
    },
    {
      icon: KeyRound,
      title: "Verificación en dos pasos",
      description:
        "El graduando confirma su identidad con un código de un solo uso enviado a su correo institucional. Sin contraseñas que recordar.",
    },
  ];
  return (
    <section id="seguridad" className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4 text-center md:px-8">
        <p className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-primary">
          Seguridad institucional
        </p>
        <h2 className="mx-auto max-w-2xl text-balance font-serif text-3xl font-semibold tracking-tight md:text-[2.4rem]">
          Cada pase es único, cada acción queda registrada.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-muted-foreground">
          La plataforma fue diseñada bajo los lineamientos de protección de
          datos personales de la UPB y la legislación colombiana. Cada
          decisión técnica se documenta y se audita.
        </p>
        <div className="mt-12 grid gap-4 text-left md:grid-cols-3">
          {points.map((p) => (
            <Card key={p.title} className="card-lift ring-foreground/8">
              <div className="flex flex-col gap-2.5 px-5 py-6">
                <h3 className="flex items-center gap-2 font-serif text-base font-semibold">
                  <p.icon aria-hidden className="size-4.5 shrink-0 text-primary" />
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
              </div>
            </Card>
          ))}
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
