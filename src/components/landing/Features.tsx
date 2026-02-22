import Link from "next/link";
import Container from "@/components/ui/Container";

const features = [
  {
    title: "Structured Reveal",
    description:
      "Control the pacing. Release content in stages to build maximum excitement.",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path d="M5.566 4.657A4.505 4.505 0 0 1 6.75 4.5h10.5c.41 0 .806.055 1.183.157A3 3 0 0 0 15.75 3h-7.5a3 3 0 0 0-2.684 1.657ZM2.25 12a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3v-6ZM5.25 7.5c-.41 0-.806.055-1.184.157A3 3 0 0 1 6.75 6h10.5a3 3 0 0 1 2.683 1.657A4.505 4.505 0 0 0 18.75 7.5H5.25Z" />
      </svg>
    ),
  },
  {
    title: "Video Messages",
    description:
      "Embed personal video greetings from friends and family directly into the flow.",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
      </svg>
    ),
  },
  {
    title: "Gift Unlocking",
    description:
      "Reveal a digital gift card, concert tickets, or a location map at the very end.",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 0 1-1.5 0V6.75a3.75 3.75 0 1 0-7.5 0v3a3 3 0 0 1 3 3v6.75a3 3 0 0 1-3 3H3.75a3 3 0 0 1-3-3v-6.75a3 3 0 0 1 3-3h9v-3c0-2.9 2.35-5.25 5.25-5.25Z" />
      </svg>
    ),
  },
  {
    title: "Timeless Archive",
    description:
      "The surprise page stays live forever. A digital keepsake they can revisit anytime.",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
      </svg>
    ),
  },
  {
    title: "Premium Themes",
    description:
      "Choose from our curated library of elegant, celebratory themes.",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path
          fillRule="evenodd"
          d="M2.25 4.5A.75.75 0 0 1 3 3.75h14.25a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75Zm0 4.5A.75.75 0 0 1 3 8.25h9.75a.75.75 0 0 1 0 1.5H3A.75.75 0 0 1 2.25 9Zm15-.75A.75.75 0 0 1 18 9v10.19l-2.22-2.22a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 1 0-1.06-1.06l-2.22 2.22V9a.75.75 0 0 1-.75-.75Zm-15 5.25a.75.75 0 0 1 .75-.75h9.75a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-[#fcf9f8]">
      <Container>
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-[#1b110e] sm:text-4xl mb-4">
              Everything needed for the{" "}
              <br className="hidden md:block" />
              perfect surprise
            </h2>
            <p className="text-lg text-[#97604e]">
              We&apos;ve thought of every detail so you can focus on the emotion.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl p-8 bg-white border border-[#f3eae7] shadow-sm hover:shadow-[0_10px_40px_-10px_rgba(27,17,14,0.08)] transition-shadow"
            >
              <div
                className={`w-12 h-12 rounded-lg ${feature.iconBg} ${feature.iconColor} flex items-center justify-center mb-6`}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-[#1b110e] mb-2">{feature.title}</h3>
              <p className="text-[#97604e] text-sm">{feature.description}</p>
            </div>
          ))}

          {/* CTA Card */}
          <div className="rounded-2xl p-8 bg-gradient-to-br from-primary to-orange-400 text-white shadow-[0_4px_20px_-2px_rgba(230,76,25,0.2)] flex flex-col justify-center items-center text-center">
            <h3 className="text-2xl font-bold mb-2">Ready to start?</h3>
            <p className="text-white/90 text-sm mb-6">
              Create your first moment in minutes.
            </p>
            <Link
              href="/dashboard/create"
              className="w-full bg-white text-primary font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              Start a Surprise
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
