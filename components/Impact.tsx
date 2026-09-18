"use client";

import { TrendingDown, Zap, Maximize, Truck, Leaf } from "lucide-react";

const IMPACTS = [
  { icon: TrendingDown, title: "LOWER RECOVERY COST", desc: "Avoiding dedicated recovery vehicles reduces overhead." },
  { icon: Zap, title: "FASTER RECOVERY", desc: "Joining an active route can often be faster than dispatching anew." },
  { icon: Maximize, title: "BETTER UTILIZATION", desc: "Fills empty space in vehicles already on the road." },
  { icon: Truck, title: "FEWER EXTRA TRIPS", desc: "Reduces the number of ad-hoc transportation requests." },
  { icon: Leaf, title: "RESOURCE EFFICIENCY", desc: "Lowers the carbon footprint of reverse logistics." },
];

export function Impact() {
  return (
    <section className="py-24 md:py-32 bg-foreground text-background px-5 sm:px-8 md:px-10 lg:px-14">
      <div className="max-w-6xl mx-auto">
        <header className="mb-16 md:mb-24 flex flex-col items-center text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-accent mb-4">SIMULATION IMPACT</p>
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05] font-medium tracking-tight max-w-4xl">
            Designed for optimization.
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {IMPACTS.map((impact, i) => (
            <div key={i} className="flex flex-col">
              <div className="w-12 h-12 bg-background/10 rounded-2xl flex items-center justify-center mb-6">
                <impact.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-medium mb-3">{impact.title}</h3>
              <p className="text-muted-foreground opacity-80 leading-relaxed text-sm md:text-base">
                {impact.desc}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-20 text-center">
          <p className="inline-block px-4 py-2 border border-background/20 rounded-full font-mono text-xs text-background/60">
            * Note: These metrics are theoretical targets of the Piggyback intelligent system.
          </p>
        </div>
      </div>
    </section>
  );
}
