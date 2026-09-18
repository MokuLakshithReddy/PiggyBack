"use client";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-16 md:py-20 px-5 sm:px-8 md:px-10 lg:px-14">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
          <div>
            <h3 className="font-mono text-sm tracking-[0.25em] font-bold mb-3">PIGGYBACK</h3>
            <p className="text-background/60 text-lg italic max-w-sm">
              &quot;Give every shipment a way home.&quot;
            </p>
          </div>

          <nav className="flex flex-col sm:flex-row gap-8 sm:gap-16 text-sm">
            <div className="flex flex-col gap-3">
              <p className="font-mono text-xs tracking-[0.15em] text-background/40 mb-1">PRODUCT</p>
              <a href="/track" className="text-background/70 hover:text-background transition-colors">Track shipment</a>
              <a href="#story-sequence" className="text-background/70 hover:text-background transition-colors">How it works</a>
              <a href="#recovery-demo" className="text-background/70 hover:text-background transition-colors">Recovery Demo</a>
            </div>
            <div className="flex flex-col gap-3">
              <p className="font-mono text-xs tracking-[0.15em] text-background/40 mb-1">OPERATIONS</p>
              <a href="/staff/login" className="text-background/70 hover:text-background transition-colors">Staff Login</a>
              <a href="#network" className="text-background/70 hover:text-background transition-colors">Network</a>
            </div>
          </nav>
        </div>

        <div className="pt-8 border-t border-background/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-background/40 font-mono">
          <p>Piggyback · Intelligent Shipment Recovery</p>
          <p>Demo Data Only</p>
        </div>
      </div>
    </footer>
  );
}
