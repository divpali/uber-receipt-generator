import React, { useCallback, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  Download,
  Loader2,
  Calendar,
  Sparkles,
  Upload,
  X,
  Image as ImageIcon,
  Wand2,
} from "lucide-react";

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
  monthNameShort,
  dayNameLong,
  isoDate,
} from "@/lib/receiptDates";
import {
  parseTimeToMinutes,
  formatMinutesToTime,
  variedTimeFor,
} from "@/lib/timeUtils";
import { GENERATOR } from "@/constants/testIds";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// File → base64 (no data URI prefix)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || "";
      const idx = String(result).indexOf("base64,");
      resolve(idx >= 0 ? String(result).slice(idx + 7) : String(result));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64ToBlob(b64, mime = "image/png") {
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export default function Generator() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth()));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [baseTimeStr, setBaseTimeStr] = useState("3:48 pm");
  const [varianceStr, setVarianceStr] = useState("10");

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedBase64, setUploadedBase64] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [uploadedMime, setUploadedMime] = useState("image/png");

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, currentLabel: "" });

  const fileInputRef = useRef(null);

  const monthIdx = parseInt(month, 10);
  const yearInt = parseInt(year, 10);
  const baseMinutes = parseTimeToMinutes(baseTimeStr);
  const varianceMinutes = Math.max(0, Math.min(120, parseInt(varianceStr, 10) || 0));

  const dates = useMemo(() => {
    if (Number.isNaN(monthIdx) || Number.isNaN(yearInt)) return [];
    return getMonThuDates(yearInt, monthIdx);
  }, [monthIdx, yearInt]);

  const handleFiles = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG / JPG).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image too large (max 8 MB).");
      return;
    }
    const b64 = await fileToBase64(file);
    setUploadedFile(file);
    setUploadedBase64(b64);
    setUploadedMime(file.type || "image/png");
    setUploadedPreview(URL.createObjectURL(file));
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) handleFiles(f);
    },
    [handleFiles]
  );

  const clearUpload = () => {
    if (uploadedPreview) URL.revokeObjectURL(uploadedPreview);
    setUploadedFile(null);
    setUploadedBase64(null);
    setUploadedPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!uploadedBase64) {
      toast.error("Upload a receipt image first.");
      return;
    }
    if (dates.length === 0) {
      toast.error("No Monday–Thursday dates in this month.");
      return;
    }
    if (baseMinutes === null) {
      toast.error("Invalid base time. Use format like '3:48 pm'.");
      return;
    }

    setGenerating(true);
    setProgress({ done: 0, total: dates.length, currentLabel: "" });

    try {
      const zip = new JSZip();
      const folderName = `Receipts_${monthNameLong(monthIdx)}_${yearInt}`;
      const folder = zip.folder(folderName);

      for (let i = 0; i < dates.length; i++) {
        const d = dates[i];
        const dateStr = `${monthNameShort(d.getMonth())} ${d.getDate()}, ${d.getFullYear()}`;
        const timeStr = variedTimeFor(d, baseMinutes, varianceMinutes);
        const label = `${dateStr} · ${timeStr}`;
        setProgress({ done: i, total: dates.length, currentLabel: label });

        const res = await fetch(`${API}/regenerate-receipt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_base64: uploadedBase64,
            target_date: dateStr,
            target_time: timeStr,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Receipt ${i + 1} failed: ${res.status} ${errText.slice(0, 200)}`);
        }

        const data = await res.json();
        const blob = base64ToBlob(data.image_base64, data.mime_type || "image/png");
        const ext = (data.mime_type || "image/png").includes("jpeg") ? "jpg" : "png";
        const filename = `Receipt_${isoDate(d)}_${dayNameLong(d)}.${ext}`;
        folder.file(filename, blob);

        setProgress({ done: i + 1, total: dates.length, currentLabel: label });
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}.zip`);
      toast.success(`Generated ${dates.length} receipts.`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const previewTime = baseMinutes !== null ? formatMinutesToTime(baseMinutes) : "—";

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        {/* Heading */}
        <div className="mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/60">
            <Sparkles className="h-3 w-3" />
            AI Receipt Pack Generator
          </div>
          <h1
            className="mt-5 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          >
            Upload one receipt. <br className="hidden sm:block" />
            Get a month&rsquo;s worth.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-white/60 lg:text-lg">
            Drop in any receipt screenshot. We&rsquo;ll regenerate it for every
            Monday – Thursday of the month with the date updated and the time
            varied by a few minutes — same layout, same fonts, same everything
            else — then pack them all into a ZIP.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16">
          {/* Controls */}
          <div className="space-y-8">
            {/* Upload */}
            <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 lg:p-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm uppercase tracking-[0.18em] text-white/50">
                  1. Reference receipt
                </h2>
                {uploadedFile && (
                  <button
                    data-testid={GENERATOR.removeUpload}
                    onClick={clearUpload}
                    className="text-xs text-white/40 hover:text-white"
                  >
                    Remove
                  </button>
                )}
              </div>

              {!uploadedFile ? (
                <label
                  data-testid={GENERATOR.uploadDropzone}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  htmlFor="receipt-upload"
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-black/40 px-6 py-12 text-center transition-colors hover:border-white/35 hover:bg-black/60"
                >
                  <div className="rounded-full bg-white/[0.06] p-3">
                    <Upload className="h-6 w-6 text-white/70" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      Drop a receipt image here, or click to browse
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                      PNG or JPG · up to 8 MB
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="receipt-upload"
                    data-testid={GENERATOR.uploadInput}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleFiles(e.target.files?.[0])}
                  />
                </label>
              ) : (
                <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black">
                    {uploadedPreview && (
                      <img
                        src={uploadedPreview}
                        alt="uploaded receipt"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <ImageIcon className="h-4 w-4 text-white/60" />
                      <span className="truncate">{uploadedFile.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                      {(uploadedFile.size / 1024).toFixed(1)} KB ·{" "}
                      {uploadedFile.type || "image"}
                    </div>
                    <div className="mt-2 text-xs text-white/40">
                      We&rsquo;ll keep this image identical and only change the
                      date + time on each generated copy.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Month / year / time */}
            <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 lg:p-8">
              <h2 className="mb-4 text-sm uppercase tracking-[0.18em] text-white/50">
                2. Month, year &amp; time
              </h2>

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
                    className="h-12 border-white/15 bg-black text-base text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-white/50">
                    Base time
                  </label>
                  <Input
                    data-testid={GENERATOR.baseTimeInput}
                    type="text"
                    value={baseTimeStr}
                    onChange={(e) => setBaseTimeStr(e.target.value)}
                    placeholder="3:48 pm"
                    className="h-12 border-white/15 bg-black text-base text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-white/50">
                    Vary by ± (minutes)
                  </label>
                  <Input
                    data-testid={GENERATOR.variancesInput}
                    type="number"
                    min={0}
                    max={120}
                    value={varianceStr}
                    onChange={(e) => setVarianceStr(e.target.value)}
                    className="h-12 border-white/15 bg-black text-base text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/70">
                <Calendar className="h-4 w-4 text-white/50" />
                <span data-testid={GENERATOR.receiptCount}>
                  <b className="text-white">{dates.length}</b> receipt
                  {dates.length === 1 ? "" : "s"} for{" "}
                  <b className="text-white">
                    {monthNameLong(monthIdx)} {yearInt}
                  </b>{" "}
                  · time around <b className="text-white">{previewTime}</b>
                  {varianceMinutes > 0 ? ` ± ${varianceMinutes} min` : ""}
                </span>
              </div>

              <Button
                data-testid={GENERATOR.generateButton}
                disabled={
                  generating ||
                  dates.length === 0 ||
                  !uploadedBase64 ||
                  baseMinutes === null
                }
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
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate &amp; Download ZIP
                  </>
                )}
              </Button>

              {generating && (
                <div className="mt-4 space-y-2">
                  <div
                    data-testid={GENERATOR.downloadStatus}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
                  >
                    <div
                      className="h-full bg-white transition-all duration-200"
                      style={{
                        width: `${
                          progress.total ? (progress.done / progress.total) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-white/50">
                    {progress.currentLabel
                      ? `Editing ${progress.currentLabel}…`
                      : "Working…"}
                  </p>
                </div>
              )}

              <p className="mt-4 text-xs text-white/40">
                Powered by Gemini Nano Banana image editing. Each receipt uses
                your Universal Key credits.
              </p>
            </div>

            {/* Date list */}
            <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 lg:p-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm uppercase tracking-[0.18em] text-white/50">
                  Receipt dates
                </h2>
                <span className="text-xs text-white/40">Mon → Thu only</span>
              </div>
              {dates.length === 0 ? (
                <p className="text-sm text-white/40">
                  No qualifying dates in this month.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {dates.map((d, i) => (
                    <div
                      key={d.toISOString()}
                      data-testid={`${GENERATOR.previewDateSelect}-${i}`}
                      className="flex flex-col rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-left"
                    >
                      <span className="text-[10px] uppercase tracking-[0.14em] text-white/50">
                        {dayNameLong(d).slice(0, 3)} · {monthNameShort(d.getMonth())}
                      </span>
                      <span className="mt-1 text-lg font-bold text-white">
                        {d.getDate()}
                      </span>
                      <span className="mt-1 text-[11px] text-white/40">
                        {baseMinutes !== null
                          ? variedTimeFor(d, baseMinutes, varianceMinutes)
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reference preview */}
          <div className="relative">
            <div className="sticky top-10">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-white/50">
                  Reference
                </span>
                <span className="text-xs text-white/40">
                  what every receipt will look like
                </span>
              </div>
              <div
                data-testid={GENERATOR.previewReceipt}
                className="flex aspect-[9/16] w-full max-w-[380px] items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-[#0f0f0f] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]"
              >
                {uploadedPreview ? (
                  <img
                    src={uploadedPreview}
                    alt="reference receipt"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="px-6 text-center text-sm text-white/40">
                    Upload a receipt to see it here
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-white/40">
                Each generated PNG will match the dimensions of the upload.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
