import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGetJson } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Printer } from "lucide-react";
import { REPORT_TEMPLATES } from "@/lib/institutional-data";
import { type GlobalIntelligence, downloadTextFile } from "@/lib/intelligence";

export default function ReportsPage() {
  const [template, setTemplate] = useState(REPORT_TEMPLATES[0]);
  const { data: intelligence } = useQuery<GlobalIntelligence>({
    queryKey: ["reports-intelligence"],
    queryFn: async () => apiGetJson<GlobalIntelligence>("/api/commodities/intelligence"),
  });

  const reportText = [
    template,
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "Executive summary",
    ...(intelligence?.terminalCards.slice(0, 5).map((card, index) => `${index + 1}. ${card.label}: ${card.value}. ${card.detail}`) ?? []),
    "",
    "Top dependency risks",
    ...(intelligence?.dependencies.map((risk) => `- ${risk.title}: ${risk.region}, ${risk.concentration}% concentration. ${risk.note}`) ?? []),
    "",
    "Methodology",
    "Market share = producer production / global production baseline * 100.",
    "Risk score = 0.30*geopolitical + 0.25*supply concentration + 0.20*weather + 0.15*sanctions + 0.10*inventory tightness.",
    "Dataset status: reference / estimated where live official APIs are unavailable.",
  ].join("\n");

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 p-4 md:p-6">
      <header className="border-b border-border pb-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
          <FileText className="h-4 w-4" /> Reports
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-wider md:text-3xl">Research Report Builder</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Printable and downloadable first-pass reports for supply concentration, sanctions exposure, weather risk, and trade-flow analysis.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-4">
            <label className="block text-xs text-muted-foreground">
              <span className="mb-1 block uppercase tracking-wider">Report template</span>
              <select value={template} onChange={(event) => setTemplate(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none">
                {REPORT_TEMPLATES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <button onClick={() => downloadTextFile(`${template.toLowerCase().replace(/\s+/g, "-")}.txt`, reportText)} className="inline-flex w-full items-center justify-center gap-2 rounded border border-primary/50 bg-primary/10 px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/15">
              <FileText className="h-4 w-4" /> Download Report
            </button>
            <button onClick={() => window.print()} className="inline-flex w-full items-center justify-center gap-2 rounded border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/45 hover:text-foreground">
              <Printer className="h-4 w-4" /> Print Page
            </button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">{reportText}</pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
