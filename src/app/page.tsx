import {
  Search,
  UserRound,
  Grid2x2,
  Film,
  Star,
  Music2,
  Image as ImageIcon,
  PlayCircle,
  FileText,
  CircleChevronLeft,
  CircleChevronRight,
  Play,
  Info,
} from "lucide-react";

const menuItems = [
  { label: "FEEDS", icon: Grid2x2, active: true },
  { label: "MOVIES", icon: Film },
  { label: "CAST & CREW", icon: Star },
  { label: "MUSIC", icon: Music2 },
  { label: "GALLERY", icon: ImageIcon },
  { label: "VIDEOS", icon: PlayCircle },
  { label: "ABOUT", icon: FileText },
];

export default function HomePage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.35) 38%, rgba(0,0,0,0.55) 100%), url('https://images.ottplay.com/images/sankranthiki-vasthunam-1736240137.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <aside className="absolute left-0 top-0 h-full w-[104px] bg-black/85 border-r border-white/10 flex flex-col items-center z-20">
        <div className="w-full h-[140px] border-b border-white/10 flex flex-col items-center justify-center gap-2">
          <div className="w-11 h-11 rounded-full border-2 border-white flex items-center justify-center text-white font-semibold text-lg">V</div>
          <span className="text-white text-[30px] leading-none tracking-tight">CINEMA</span>
        </div>

        <nav className="w-full">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`w-full h-[112px] flex flex-col items-center justify-center gap-2 text-sm ${
                item.active ? "bg-cyan-400 text-black font-semibold" : "text-white/80"
              }`}
            >
              <item.icon className="w-8 h-8" strokeWidth={1.5} />
              <span className="text-[29px] tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="mt-auto mb-8 text-white/90">
          <Info className="w-8 h-8" />
        </button>
      </aside>

      <div className="absolute top-8 right-8 z-20 flex items-center gap-8 text-white">
        <div className="flex items-center gap-5 text-[34px]">
          <span>Start Typing</span>
          <Search className="w-10 h-10" strokeWidth={1.8} />
        </div>
        <button className="w-16 h-16 border border-white/70 rounded-lg flex items-center justify-center">
          <UserRound className="w-9 h-9" strokeWidth={1.8} />
        </button>
      </div>

      <section className="relative z-10 pl-[260px] pr-12 pt-[560px] pb-24 max-w-[1820px]">
        <div className="flex items-center gap-3 text-white mb-5">
          <Play className="w-8 h-8" />
          <span className="text-[43px] tracking-wide">TRAILER</span>
        </div>

        <h1 className="text-[72px] leading-[1.1] font-medium text-white">Sankranthiki Vasthunam</h1>
        <p className="text-[38px] text-white/95 mt-3">02m 26sec | 21,742,644 Views</p>

        <div className="flex items-center gap-8 mt-8">
          <button className="bg-white text-black rounded-full h-20 px-12 text-[40px] flex items-center gap-6">
            Watch Now
            <Play className="w-8 h-8 fill-black" />
          </button>
          <span className="text-[52px] font-semibold text-red-500">YouTube</span>
        </div>

        <div className="border-t border-white/40 mt-10 pt-8 text-[40px] leading-[1.8]">
          <p>
            Director: <span className="text-cyan-300">Anil Ravipudi</span>
          </p>
          <p>
            Actors: <span className="text-cyan-300">Venkatesh Daggubati, Aishwarya Rajesh, Meenakshi Chaudhary</span>{" "}
            <span className="text-white/80">| Cast &amp; Crew</span>
          </p>
          <p>
            Release: <span className="text-cyan-300">14 Jan 2025</span>
          </p>
        </div>
      </section>

      <div className="absolute right-20 top-1/2 -translate-y-1/2 z-20 flex items-center gap-4 text-white/90">
        <CircleChevronLeft className="w-16 h-16" strokeWidth={1.5} />
        <span className="text-[52px]">2</span>
        <span className="text-[40px] text-white/50">/</span>
        <span className="text-[52px] text-white/50">3</span>
        <CircleChevronRight className="w-16 h-16" strokeWidth={1.5} />
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-8 h-14 rounded-full border-2 border-white/70 z-20" />
    </div>
  );
}
