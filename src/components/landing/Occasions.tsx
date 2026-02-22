import Link from "next/link";
import Container from "@/components/ui/Container";

const occasions = [
  {
    title: "Happy Birthdays",
    description: "Celebrate special birthdays with heartfelt video messages from friends and family.",
    icon: "🎂",
    bgColor: "bg-[#FFF9F2]",
  },
  {
    title: "Weddings",
    description: "Create unforgettable wedding Tributes with messages from loved ones near and far.",
    icon: "👰",
    bgColor: "bg-[#FFF5F8]",
  },
  {
    title: "Anniversaries",
    description: "Honor milestone anniversaries with personalized video collections from colleagues and friends.",
    icon: "🍾",
    bgColor: "bg-[#F0FFF4]",
  },
  {
    title: "Retirements",
    description: "Send off retiring colleagues with meaningful video Tributes celebrating their career.",
    icon: "🎉",
    bgColor: "bg-[#F0F7FF]",
  },
  {
    title: "In Memory or Funeral",
    description: "Create touching memorial Tributes to honor and remember loved ones who have passed.",
    icon: "🕯️",
    bgColor: "bg-[#F7F2FF]",
  },
  {
    title: "Graduations",
    description: "Congratulate graduates with inspiring video messages from family, friends, and mentors.",
    icon: "🎓",
    bgColor: "bg-[#F5F2FF]",
  },
  {
    title: "Teacher Appreciation",
    description: "Show gratitude to educators with heartfelt video Tributes from students and parents.",
    icon: "🫶",
    bgColor: "bg-[#FFF9F0]",
  },
  {
    title: "Promotions",
    description: "Celebrate career advancements with congratulatory video messages from teammates.",
    icon: "⭐",
    bgColor: "bg-[#FFFFF0]",
  },
  {
    title: "Get Well Soon",
    description: "Send healing wishes and support through uplifting video messages during recovery.",
    icon: "❤️",
    bgColor: "bg-[#FFF0F0]",
  },
  {
    title: "New Baby",
    description: "Welcome new arrivals with warm video congratulations from family and friends.",
    icon: "🧸",
    bgColor: "bg-[#F0FBFF]",
  },
];

export default function Occasions() {
  return (
    <section className="bg-[#1b110e] py-24 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[-5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <Container className="relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Use Surpriseal for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-primary/80 to-orange-200">all occasions</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            From milestones to just-becauses, create a digital journey that captures the heart of every moment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {occasions.map((occasion, index) => (
            <div
              key={index}
              className={`${occasion.bgColor} rounded-2xl p-6 flex flex-col items-center text-center transition-all hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/20 duration-500 group border border-white/10`}
            >
              <div className="text-4xl mb-6 transform transition-transform group-hover:scale-125 duration-500 drop-shadow-sm grayscale-[0.2] group-hover:grayscale-0">
                {occasion.icon}
              </div>
              <h3 className="text-lg font-bold text-[#1b110e] mb-3 leading-tight tracking-tight">{occasion.title}</h3>
              <p className="text-[#97604e] text-xs leading-relaxed mb-6 flex-grow font-medium">
                {occasion.description}
              </p>
              <Link
                href="/dashboard/create"
                className="w-full bg-[#1b110e] text-white text-[13px] font-bold py-3 rounded-xl hover:bg-primary transition-all shadow-md active:scale-95"
              >
                Start a Surprise
              </Link>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
