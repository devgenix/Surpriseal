import Container from "@/components/ui/Container";

const steps = [
  {
    number: "1",
    title: "Customize the Journey",
    description:
      "Design a unique path for your loved one. Choose themes, colors, and the flow of the reveal.",
    iconBg: "bg-[#fff0eb]",
    iconColor: "text-primary",
    hoverBg: "group-hover:bg-primary",
    hoverText: "group-hover:text-white",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-7 w-7"
      >
        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
        <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
      </svg>
    ),
  },
  {
    number: "2",
    title: "Add Precious Memories",
    description:
      "Upload meaningful photos, video messages, and heartfelt notes to build anticipation.",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    hoverBg: "group-hover:bg-purple-600",
    hoverText: "group-hover:text-white",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-7 w-7"
      >
        <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
      </svg>
    ),
  },
  {
    number: "3",
    title: "Send the Link",
    description:
      "Share the surprise with a simple link. They unlock the experience on any device, anywhere.",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    hoverBg: "group-hover:bg-green-600",
    hoverText: "group-hover:text-white",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-7 w-7"
      >
        <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-white py-20 border-y border-[#f3eae7]"
    >
      <Container>
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-base font-semibold text-primary uppercase tracking-wide mb-2">
            Simple Process
          </h2>
          <h3 className="text-3xl font-bold text-[#1b110e] sm:text-4xl">
            How Supriseal Works
          </h3>
          <p className="mt-4 text-lg text-[#97604e]">
            Create a magical experience in just three simple steps. No design skills
            required.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-[#fcf9f8] border border-[#f3eae7] transition-all hover:shadow-[0_10px_40px_-10px_rgba(27,17,14,0.08)] hover:border-primary/20 hover:-translate-y-1"
            >
              <div
                className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full ${step.iconBg} ${step.iconColor} ${step.hoverBg} ${step.hoverText} transition-colors`}
              >
                {step.icon}
              </div>
              <h4 className="text-xl font-bold text-[#1b110e] mb-3">{step.title}</h4>
              <p className="text-[#97604e]">{step.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
