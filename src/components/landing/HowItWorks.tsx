import Container from "@/components/ui/Container";

const steps = [
  {
    number: "1",
    title: "Customize the Journey",
    description:
      "Design a unique path for your loved one. Choose themes, colors, and the flow of the reveal.",
    image: "/images/landing/step-design.png",
    color: "from-orange-50 to-orange-100",
  },
  {
    number: "2",
    title: "Add Precious Memories",
    description:
      "Upload meaningful photos, video messages, and heartfelt notes to build anticipation.",
    image: "/images/landing/step-memories.png",
    color: "from-purple-50 to-purple-100",
  },
  {
    number: "3",
    title: "Share the Surprise",
    description:
      "Share the surprise with them and watch their reaction. They unlock the experience on any device, anywhere.",
    image: "/images/landing/step-send.png",
    color: "from-green-50 to-green-100",
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
        <div className="grid gap-12 md:grid-cols-3 relative">
          {/* Connecting Journey Line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 border-t-2 border-dashed border-primary/20 pointer-events-none z-0"></div>

          {steps.map((step, idx) => (
            <div
              key={step.number}
              className="group relative flex flex-col items-center text-center p-8 rounded-3xl bg-[#fcf9f8] border border-[#f3eae7] transition-all hover:shadow-[0_20px_50px_-15px_rgba(27,17,14,0.1)] hover:border-primary/30 hover:-translate-y-2 z-10"
            >
              <div
                className={`mb-8 flex h-48 w-full items-center justify-center rounded-2xl overflow-hidden bg-gradient-to-br ${step.color} shadow-inner group-hover:shadow-lg transition-all duration-500`}
              >
                <img 
                  src={step.image} 
                  alt={step.title} 
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white border-4 border-[#fcf9f8] shadow-md flex items-center justify-center text-primary font-black text-sm z-20">
                {step.number}
              </div>
              <h4 className="text-xl font-bold text-[#1b110e] mb-3 tracking-tight">{step.title}</h4>
              <p className="text-[#97604e] leading-relaxed font-medium text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
