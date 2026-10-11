import Image from "next/image";
import Link from "next/link";

const steps = [
  "Upload an image that feels like you",
  "Describe the pattern you want around it",
  "Choose the questions for each page",
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-12 px-6 py-16 md:flex-row md:gap-20">
      <Image
        src="/images/notebook.svg"
        alt="A notebook with a placeholder cover"
        width={320}
        height={420}
        priority
        className="h-auto w-64 md:w-80"
      />
      <div className="flex max-w-md flex-col items-center gap-6 text-center md:items-start md:text-left">
        <span className="rounded-full bg-forest-pale px-3 py-1.5 text-xs font-medium text-forest">
          A notebook made for you
        </span>
        <h1 className="text-5xl font-bold md:text-6xl">
          Notice what you feel{" "}
          <span className="text-forest">before</span> you{" "}
          <span className="text-peach">eat</span>.
        </h1>
        <p className="text-lg leading-relaxed text-ink-mid">
          Design the cover, pick your own prompts for every page, and renew it
          every 30 days.
        </p>
        <ol className="flex flex-col gap-2 text-left text-ink-mid">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="font-medium text-peach">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <Link
          href="/design"
          className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-forest-light"
        >
          Design your cover
        </Link>
      </div>
    </main>
  );
}
