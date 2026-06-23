import React, { useMemo, useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Download, Loader2, Calendar, Sparkles } from "lucide-react";

import Receipt from "@/components/Receipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import {
  MONTHS,
  getMonThuDates,
  monthNameLong,
  dayNameLong,
  isoDate,
} from "@/lib/receiptDates";
import { GENERATOR } from "@/constants/testIds";

export default function Generator() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth()));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [previewIndex, setPreviewIndex] = useState(0);

  const captureRef = useRef(null);

  const monthIdx = parseInt(month, 10);
  const yearInt = parseInt(year, 10);

  const dates = useMemo(() => {
    if (Number.isNaN(monthIdx) || Number.isNaN(yearInt)) return [];
    return getMonThuDates(yearInt, monthIdx);
  }, [monthIdx, yearInt]);

  // Reset preview index if dates change
  useEffect(() => {
    if (previewIndex >= dates.length) setPreviewIndex(0);
  }, [dates, previewIndex]);

  const previewDate = dates[previewIndex] || new Date(yearInt, monthIdx, 1);

  const handleGenerate = async () => {
    if (dates.length === 0) {
      toast.error("No Monday–Thursday dates in this month.");
      return;
    }
    const yearNum = parseInt(year, 10);
    if (Number.isNaN(yearNum) || yearNum < 1970 || yearNum > 9999) {
      toast.error("Please enter a valid year.");
      return;
    }

    setGenerating(true);
    setProgress({ done: 0, total: dates.length });

    try {
      const zip = new JSZip();
      const folderName = `Uber_Receipts_${monthNameLong(monthIdx)}_${yearInt}`;
      const folder = zip.folder(folderName);

      const node = captureRef.current;
      if (!node) throw new Error("Capture node not ready");

      for (let i = 0; i < dates.length; i++) {
        const d = dates[i];
        // Update the off-screen receipt for this date
        setPreviewIndex(i);
        // Wait for React commit + paint
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        await new Promise((r) => setTimeout(r, 40));

        const canvas = await html2canvas(node, {
          backgroundColor: "#000000",
          scale: 1,
          useCORS: true,
          logging: false,
          width: 1080,
          height: 1920,
          windowWidth: 1080,
          windowHeight: 1920,
        });
        const blob = await new Promise((res) =>
          canvas.toBlob(res, "image/png", 1.0)
        );
        const filename = `Uber_Receipt_${isoDate(d)}_${dayNameLong(d)}.png`;
        folder.file(filename, blob);
        setProgress({ done: i + 1, total: dates.length });
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}.zip`);
      toast.success(`Generated ${dates.length} receipts.`);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while generating receipts.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        {/* Heading */}
        <div className="mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/60">
            <Sparkles className="h-3 w-3" />
            Receipt Pack Generator
          </div>
          <h1
            className="mt-5 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          >
            Recreate an entire month of <br className="hidden sm:block" />
            Uber metro receipts.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-white/60 lg:text-lg">
            Pick a month and year. We&rsquo;ll generate one receipt for every
            Monday through Thursday — same layout, same fonts, only the date
            changes — and pack them into a zip.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16">
          {/* Controls */}
          <div className="space-y-8">
            <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 lg:p-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-white/50">
                    Month
                  </label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger
                      data-testid={GENERATOR.monthSelect}
                      className="h-12 border-white/15 bg-black text-base text-white hover:bg-white/[0.04]"
                    >
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#161616] text-white">
                      {MONTHS.map((m) => (
                        <SelectItem
                          key={m.value}
                          value={m.value}
                          className="focus:bg-white/10 focus:text-white"
                        >
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-white/50">
                    Year
                  </label>
                  <Input
                    data-testid={GENERATOR.yearInput}
                    type="number"
                    inputMode="numeric"
                    min={1970}
                    max={9999}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="h-12 border-white/15 bg-black text-base text-white placeholder:text-white/40"
                    placeholder="2026"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/70">
                <Calendar className="h-4 w-4 text-white/50" />
                <span data-testid={GENERATOR.receiptCount}>
                  <b className="text-white">{dates.length}</b> receipt
                  {dates.length === 1 ? "" : "s"} will be generated for{" "}
                  <b className="text-white">
                    {monthNameLong(monthIdx)} {yearInt}
                  </b>
                </span>
              </div>

              <Button
                data-testid={GENERATOR.generateButton}
                disabled={generating || dates.length === 0}
                onClick={handleGenerate}
                className="mt-6 h-14 w-full rounded-xl bg-white text-base font-semibold text-black hover:bg-white/90 disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating {progress.done}/{progress.total}…
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Generate &amp; Download ZIP
                  </>
                )}
              </Button>
              {generating && (
                <div
                  data-testid={GENERATOR.downloadStatus}
                  className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
                >
                  <div
                    className="h-full bg-white transition-all duration-200"
                    style={{
                      width: `${
                        progress.total
                          ? (progress.done / progress.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Date list */}
            <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 lg:p-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm uppercase tracking-[0.18em] text-white/50">
                  Receipt dates
                </h2>
                <span className="text-xs text-white/40">
                  Mon → Thu only
                </span>
              </div>
              {dates.length === 0 ? (
                <p className="text-sm text-white/40">
                  No qualifying dates in this month.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {dates.map((d, i) => {
                    const active = i === previewIndex;
                    return (
                      <button
                        key={d.toISOString()}
                        data-testid={`${GENERATOR.previewDateSelect}-${i}`}
                        onClick={() => setPreviewIndex(i)}
                        className={`group flex flex-col items-start rounded-xl border px-3 py-3 text-left transition-colors ${
                          active
                            ? "border-white bg-white text-black"
                            : "border-white/10 bg-black/40 text-white hover:border-white/30"
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-[0.14em] opacity-70">
                          {dayNameLong(d).slice(0, 3)}
                        </span>
                        <span className="mt-1 text-lg font-bold">
                          {d.getDate()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div className="relative">
            <div className="sticky top-10">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-white/50">
                  Live preview
                </span>
                <span className="text-xs text-white/40">
                  {dayNameLong(previewDate)}, {isoDate(previewDate)}
                </span>
              </div>
              <div
                data-testid={GENERATOR.previewReceipt}
                className="overflow-hidden rounded-[28px] border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]"
                style={{ width: 380, height: 676 }}
              >
                <Receipt date={previewDate} scale={380 / 1080} />
              </div>
              <p className="mt-3 text-xs text-white/40">
                Generated PNGs are exported at 1080×1920 resolution.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Off-screen capture target — full-resolution receipt for html2canvas */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 1080,
          height: 1920,
          pointerEvents: "none",
          opacity: 0,
          zIndex: -1,
        }}
      >
        <Receipt ref={captureRef} date={previewDate} scale={1} />
      </div>
    </div>
  );
}
