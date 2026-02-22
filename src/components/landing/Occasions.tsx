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
    <section className="bg-[#050505] py-24 overflow-hidden relative">
      {/* Decorative dashed line like in the image */}
      <div className="absolute top-10 left-[-50px] w-48 h-48 border-2 border-dashed border-white/10 rounded-full pointer-events-none opacity-40"></div>
      
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Use Surpriseal for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-orange-200">all occasions</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {occasions.map((occasion, index) => (
            <div
              key={index}
              className={`${occasion.bgColor} rounded-xl p-6 flex flex-col items-center text-center transition-transform hover:scale-[1.02] hover:shadow-xl duration-300`}
            >
              <div className="text-4xl mb-6 transform transition-transform hover:scale-110 duration-300 drop-shadow-sm">
                {occasion.icon}
              </div>
              <h3 className="text-lg font-bold text-[#1b110e] mb-3 leading-tight">{occasion.title}</h3>
              <p className="text-[#97604e] text-xs leading-relaxed mb-6 flex-grow">
                {occasion.description}
              </p>
              <Link
                href="/dashboard/create"
                className="w-full bg-[#050505] text-white text-[13px] font-bold py-2.5 rounded-lg hover:bg-[#1b110e] transition-colors"
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
