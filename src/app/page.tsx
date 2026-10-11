import Image from "next/image";

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
      <div className="flex max-w-md flex-col gap-6 text-center md:text-left">
        <h1 className="text-4xl font-semibold tracking-tight">COMO</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          A notebook made for you, to help you notice what you feel before you
          eat. Design the cover, pick your own prompts, and renew it every 30
          days.
        </p>
        <ol className="flex flex-col gap-2 text-left text-zinc-700 dark:text-zinc-300">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="font-mono text-zinc-400">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="self-center rounded-full bg-[#5f8470] px-6 py-3 font-medium text-white md:self-start"
        >
          Design your cover
        </button>
      </div>
    </main>
  );
}
