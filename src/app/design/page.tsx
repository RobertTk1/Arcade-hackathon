import Link from "next/link";
import { CoverDesigner } from "@/components/CoverDesigner";

export const metadata = { title: "Describe your cover | COMO Journal Studio" };

export default function DesignPage() {
  return (
    <main className="journal-studio">
      <header className="studio-header">
        <Link href="/" className="studio-brand" aria-label="COMO home"><span className="studio-brand-mark">co</span><span>Journal Studio</span></Link>
        <span className="studio-header-note">Made for your everyday reflections</span>
        <Link href="/" className="studio-exit">Back to COMO ↗</Link>
      </header>
      <div className="studio-stepbar"><span className="studio-current-step">Cover · describe</span><span>Make it yours, one small detail at a time.</span></div>
      <div className="studio-content">
        <div className="studio-intro">
          <p className="studio-eyebrow">Your journal / Cover</p>
          <h1>A cover that feels like you.</h1>
          <p>Describe the colours, shapes and feeling you’d like to see. A few thoughtful words are enough.</p>
        </div>
        <CoverDesigner />
      </div>
    </main>
  );
}
