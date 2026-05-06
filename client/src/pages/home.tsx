import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { ScoreRing } from "@/components/score-ring";
import { RadarChart } from "@/components/radar-chart";
import { DimensionCard } from "@/components/dimension-card";
import { ShareCard } from "@/components/share-card";
import { sampleNotes } from "@/lib/samples";
import type { CheckupReport } from "@shared/schema";
import { Stethoscope, Sparkles, Download, RotateCcw, ArrowRight, Loader2 } from "lucide-react";

export default function Home() {
  const [note, setNote] = useState("");
  const [report, setReport] = useState<CheckupReport | null>(null);
  const [showShare, setShowShare] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const checkupMutation = useMutation({
    mutationFn: async (input: string) => {
      const res = await apiRequest("POST", "/api/checkup", { note: input });
      return (await res.json()) as CheckupReport;
    },
    onSuccess: (data) => {
      setReport(data);
      setTimeout(() => {
        const el = resultRef.current;
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 100);
    },
    onError: (err: Error) => {
      toast({
        title: "体检失败",
        description: err.message || "请稍后重试",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (note.trim().length < 10) {
      toast({
        title: "笔记太短啦",
        description: "至少要 10 个字才能体检哦",
        variant: "destructive",
      });
      return;
    }
    checkupMutation.mutate(note);
  };

  const handleSample = (text: string) => {
    setNote(text);
    setReport(null);
  };

  const handleReset = () => {
    setNote("");
    setReport(null);
    setShowShare(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownloadShare = async () => {
    if (!shareRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    try {
      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `笔记体检报告_${report?.totalScore || ""}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "已生成分享卡片", description: "保存到本地啦" });
    } catch (e) {
      toast({ title: "生成失败", description: "请重试", variant: "destructive" });
    }
  };

  const dimensionList = report
    ? [
        report.dimensions.title,
        report.dimensions.hook,
        report.dimensions.structure,
        report.dimensions.keywords,
        report.dimensions.interaction,
      ]
    : [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo />
            <div>
              <div className="font-display font-extrabold text-lg leading-none" data-testid="text-app-title">
                笔记体检
              </div>
              <div className="text-[10px] text-muted-foreground tracking-widest mt-1">
                XIAOHONGSHU NOTE CHECKUP
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">由 AI 驱动 · 仅供参考</span>
            <span className="stamp text-[10px] px-2 py-1 hidden md:inline-flex" style={{ color: "hsl(var(--health-cross))" }}>
              Beta
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10 pb-24">
        {/* Hero */}
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI 5 维度全面体检 · 自动改写优化</span>
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight mb-3 leading-[1.05]">
            为你的小红书笔记
            <br />
            <span className="text-primary">做个体检</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            粘贴笔记，AI 从标题、钩子、结构、关键词、互动 5 个维度客观评估，给出具体优化建议与改写版。
          </p>
        </section>

        {/* 输入区 */}
        <section className="paper-card rounded-3xl p-6 sm:p-8 mb-8" data-testid="section-input">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-sm tracking-wide">粘贴你的笔记</span>
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="把小红书笔记的标题和正文一起粘贴进来，AI 会给出体检报告..."
            className="min-h-[200px] text-sm leading-relaxed bg-background/60 border-border resize-none"
            data-testid="textarea-note"
          />
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>{note.length} 字</span>
            <span>建议 100-800 字效果最好</span>
          </div>

          {/* 示例 */}
          <div className="mt-5 pt-5 border-t border-dashed border-border">
            <div className="text-xs text-muted-foreground mb-2.5">没有笔记？试试示例：</div>
            <div className="flex flex-wrap gap-2">
              {sampleNotes.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSample(s.note)}
                  className="px-3 py-1.5 rounded-full text-xs border border-border bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary transition-colors hover-elevate"
                  data-testid={`button-sample-${s.label}`}
                >
                  {s.label} →
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={checkupMutation.isPending || note.trim().length < 10}
              className="flex-1 h-12 font-display font-bold text-base"
              data-testid="button-checkup"
            >
              {checkupMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI 体检中...
                </>
              ) : (
                <>
                  开始体检
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            {report && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleReset}
                className="h-12"
                data-testid="button-reset"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重新体检
              </Button>
            )}
          </div>
        </section>

        {/* 加载占位 */}
        {checkupMutation.isPending && (
          <section className="paper-card rounded-3xl p-12 flex flex-col items-center gap-4">
            <div className="pulse-animate">
              <div className="red-cross">+</div>
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-lg mb-1">AI 顾问正在分析笔记...</div>
              <div className="text-xs text-muted-foreground tracking-wide">通常需要 10-20 秒</div>
            </div>
          </section>
        )}

        {/* 体检报告 */}
        {report && !checkupMutation.isPending && (
          <div ref={resultRef} className="space-y-8" data-testid="section-report">
            {/* 总分卡 */}
            <section className="paper-card rounded-3xl overflow-hidden">
              <div
                className="px-6 sm:px-8 py-5 flex items-center justify-between text-white"
                style={{ background: "hsl(var(--health-cross))" }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center font-extrabold text-xl">
                    +
                  </div>
                  <div>
                    <div className="font-display font-extrabold text-lg leading-none">
                      体检报告
                    </div>
                    <div className="text-[10px] opacity-80 tracking-widest mt-1">
                      DIAGNOSIS REPORT
                    </div>
                  </div>
                </div>
                <div className="text-[10px] tracking-widest opacity-80">
                  NO. {String(Math.floor(Math.random() * 9000) + 1000)}
                </div>
              </div>

              <div className="p-6 sm:p-10 grid md:grid-cols-2 gap-8 items-center">
                <div className="flex flex-col items-center gap-4">
                  <ScoreRing score={report.totalScore} grade={report.grade} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground tracking-widest mb-2">
                    AI 一句话诊断
                  </div>
                  <div
                    className="font-display font-extrabold text-2xl leading-tight mb-4"
                    data-testid="text-diagnosis"
                  >
                    {report.diagnosis}
                  </div>
                  <div className="dotted-divider mb-4" />
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    本次体检从 5 个维度对笔记进行诊断，下方是详细报告与 AI 改写版。
                  </div>
                </div>
              </div>

              {/* 雷达图 */}
              <div className="border-t border-dashed border-border p-6 sm:p-8 flex justify-center bg-muted/20">
                <RadarChart dimensions={report.dimensions} />
              </div>
            </section>

            {/* 五维详细评分 */}
            <section>
              <h2 className="font-display font-extrabold text-2xl mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full" />
                各项详细诊断
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {dimensionList.map((d, i) => (
                  <DimensionCard key={i} dimension={d} index={i} />
                ))}
              </div>
            </section>

            {/* 改写对比 */}
            <section>
              <h2 className="font-display font-extrabold text-2xl mb-2 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full" />
                AI 改写版
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                左边是原版，右边是 AI 优化后的版本。
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="paper-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold tracking-widest text-muted-foreground">
                      原版
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                      BEFORE
                    </span>
                  </div>
                  <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/70">
                    {note}
                  </pre>
                </div>
                <div
                  className="paper-card rounded-2xl p-5"
                  style={{
                    borderColor: "hsl(var(--primary) / 0.3)",
                    background: "hsl(var(--primary) / 0.02)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold tracking-widest text-primary">改写版</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                      AFTER
                    </span>
                  </div>
                  <div
                    className="font-display font-extrabold text-base leading-snug mb-3 pb-3 border-b border-dashed border-border"
                    data-testid="text-rewrite-title"
                  >
                    {report.rewrite.title}
                  </div>
                  <pre
                    className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground"
                    data-testid="text-rewrite-content"
                  >
                    {report.rewrite.content}
                  </pre>
                </div>
              </div>

              {/* 改写思路 */}
              <div className="mt-4 paper-card rounded-2xl p-5 bg-accent/40">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-display font-bold text-sm">改写思路</span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {report.rewrite.explanation}
                </p>
              </div>
            </section>

            {/* 分享 */}
            <section className="paper-card rounded-3xl p-6 sm:p-8 text-center">
              <div className="font-display font-extrabold text-xl mb-2">
                生成体检卡片，发朋友圈/小红书
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                一键生成精美卡片，截图分享给朋友
              </p>
              <Button
                size="lg"
                onClick={() => setShowShare(true)}
                className="h-12 font-display font-bold"
                data-testid="button-share"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                生成分享卡片
              </Button>
            </section>
          </div>
        )}
      </main>

      {/* 分享卡 Modal */}
      {showShare && report && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowShare(false)}
        >
          <div
            className="flex flex-col items-center gap-5 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ShareCard ref={shareRef} report={report} />
            <div className="flex gap-2">
              <Button onClick={handleDownloadShare} className="font-display font-bold" data-testid="button-download">
                <Download className="w-4 h-4 mr-2" />
                下载图片
              </Button>
              <Button variant="outline" onClick={() => setShowShare(false)} data-testid="button-close-share">
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-border py-6 px-5 text-center text-xs text-muted-foreground">
        笔记体检 Agent · AI 智能诊断 · 仅供参考
      </footer>
    </div>
  );
}
