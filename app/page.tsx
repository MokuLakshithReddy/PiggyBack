import { Hero } from "@/components/Hero";
import { TheProblem } from "@/components/TheProblem";
import { StorySequence } from "@/components/StorySequence";
import { TheIdea } from "@/components/TheIdea";
import { RecoveryDemo } from "@/components/RecoveryDemo";
import { HowItThinks } from "@/components/HowItThinks";
import { LiveNetwork } from "@/components/LiveNetwork";
import { Impact } from "@/components/Impact";
import { SystemView } from "@/components/SystemView";
import { StaffEntry } from "@/components/StaffEntry";
import { TeamStory } from "@/components/TeamStory";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <TheProblem />
      <StorySequence />
      <TheIdea />
      <RecoveryDemo />
      <HowItThinks />
      <LiveNetwork />
      <Impact />
      <SystemView />
      <StaffEntry />
      <TeamStory />
      <Footer />
    </main>
  );
}
