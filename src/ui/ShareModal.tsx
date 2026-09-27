import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Globe,
  Send,
  MessageCircle,
  Twitter,
  Linkedin,
  Mail,
  Code2,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Bot,
  Terminal,
  Cpu,
  Zap,
} from 'lucide-react';
import { Project } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
}

export const PUBLIC_APP_URL = 'https://ais-pre-5ilkxtfwf6yibz3jj2ynl3-17774190120.europe-west3.run.app/';
export const OPENAI_BASE_URL = 'https://ais-pre-5ilkxtfwf6yibz3jj2ynl3-17774190120.europe-west3.run.app/api/v1';
export const OPENAI_CHAT_ENDPOINT = 'https://ais-pre-5ilkxtfwf6yibz3jj2ynl3-17774190120.europe-west3.run.app/api/v1/chat/completions';
export const LLMS_TXT_URL = 'https://ais-pre-5ilkxtfwf6yibz3jj2ynl3-17774190120.europe-west3.run.app/llms.txt';
export const OPENAPI_JSON_URL = 'https://ais-pre-5ilkxtfwf6yibz3jj2ynl3-17774190120.europe-west3.run.app/openapi.json';
export const AGENT_WEBHOOK_URL = 'https://ais-pre-5ilkxtfwf6yibz3jj2ynl3-17774190120.europe-west3.run.app/api/agent/prompt';

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'link' | 'bot' | 'qr' | 'embed'>('bot');

  if (!isOpen) return null;

  const currentUrl = PUBLIC_APP_URL;
  const projectTitle = project ? project.name : 'NONONICK Universal AI Editor';
  const shareText = `بررسی و مشاهده پلتفرم آنلاین ${projectTitle} / Check out ${projectTitle}:`;

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const embedSnippet = `<iframe src="${currentUrl}" width="100%" height="750px" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden;" title="${projectTitle}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

  const pythonSnippet = `import openai

client = openai.OpenAI(
    base_url="${OPENAI_BASE_URL}",
    api_key="none"  # بدون نیاز به کلید یا احراز هویت
)

response = client.chat.completions.create(
    model="gemini-3.8-flash",
    messages=[
        {"role": "user", "content": "پروژه من را بررسی کن و یک هدر مدرن پیشنهاد بده"}
    ]
)
print(response.choices[0].message.content)`;

  const curlSnippet = `curl -X POST "${OPENAI_CHAT_ENDPOINT}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gemini-3.8-flash",
    "messages": [
      {"role": "user", "content": "Hello NONONICK Studio"}
    ]
  }'`;

  // Social sharing links
  const telegramShare = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
  const whatsappShare = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${currentUrl}`)}`;
  const twitterShare = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
  const emailShare = `mailto:?subject=${encodeURIComponent(projectTitle)}&body=${encodeURIComponent(`${shareText}\n\n${currentUrl}`)}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(currentUrl)}&color=00f2fe&bgcolor=080b12&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl glass-dropdown border border-cyan-500/30 shadow-2xl overflow-hidden flex flex-col text-xs text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#090c14]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>اتصال چت‌بات، مدل‌ها و اشتراک عمومی</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-normal">
                  Universal Bot & AI Gateway
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                آدرس‌ها و وب‌هوک‌های آماده برای اتصال هر نوع چت‌بات، مدل AI و اشتراک عمومی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-5 pt-3 border-b border-white/5 bg-[#07090f]/70 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('bot')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'bot'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>ورود چت‌بات و مدل‌ها (Bot Gateway)</span>
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'link'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>لینک مستقیم وب (Web URL)</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'qr'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-purple-400" />
            <span>کد QR موبایل</span>
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'embed'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span>آی‌فریم (Embed)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 bg-[#06080d]/90 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
          {/* TAB 1: BOT & AI GATEWAY */}
          {activeTab === 'bot' && (
            <div className="space-y-4">
              {/* Highlight Box */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/30 flex items-start gap-3">
                <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <p className="font-bold text-cyan-300">
                    آدرس استاندارد برای ورود چت‌بات‌ها و انواع مدل‌های هوش مصنوعی
                  </p>
                  <p className="text-slate-300 mt-1">
                    شما می‌توانید هریک از آدرس‌های زیر را به چت‌بات (تلگرام، دیسکورد، کاستوم GPT، وب‌سایت) یا اسکریپت‌های پایتون و ابزارهای هوش مصنوعی بدهید تا مستقیماً به برنامه وصل شوند. CORS نیز به صورت کامل و عمومی باز است.
                  </p>
                </div>
              </div>

              {/* Endpoint 1: OpenAI Compatible Chat Completions */}
              <div className="space-y-1.5 bg-[#090c14] p-3.5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    ۱. آدرس چت‌بات‌های مبتنی بر پروتکل استاندارد OpenAI:
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono font-semibold">POST JSON</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={OPENAI_CHAT_ENDPOINT}
                    className="flex-1 bg-[#06080d] border border-cyan-500/30 rounded-lg px-3 py-2 font-mono text-[11px] text-cyan-300 select-all outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(OPENAI_CHAT_ENDPOINT, 'chat_endpoint')}
                    className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition shrink-0 cursor-pointer shadow-sm"
                  >
                    {copiedKey === 'chat_endpoint' ? 'کپی شد!' : 'کپی آدرس'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Base URL برای کلاینت‌ها (مانند LibreChat, OpenWebUI, LangChain): <code className="text-cyan-300 font-mono">{OPENAI_BASE_URL}</code>
                </p>
              </div>

              {/* Endpoint 2: llms.txt */}
              <div className="space-y-1.5 bg-[#090c14] p-3.5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    ۲. مستندات متنی استاندارد برای درک و شناخت کامل مدل‌ها (LLMs.txt):
                  </span>
                  <a
                    href={LLMS_TXT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-purple-400 hover:underline flex items-center gap-1"
                  >
                    <span>مشاهده فایل</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={LLMS_TXT_URL}
                    className="flex-1 bg-[#06080d] border border-purple-500/30 rounded-lg px-3 py-2 font-mono text-[11px] text-purple-300 select-all outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(LLMS_TXT_URL, 'llms_txt')}
                    className="px-3 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-bold text-[11px] transition shrink-0 cursor-pointer shadow-sm"
                  >
                    {copiedKey === 'llms_txt' ? 'کپی شد!' : 'کپی آدرس'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  این آدرس را می‌توانید به ChatGPT، Claude، Perplexity یا کراولرها بدهید تا در ۱ ثانیه از تمامی قابلیت‌های برنامه مطلع شوند.
                </p>
              </div>

              {/* Endpoint 3: OpenAPI Spec */}
              <div className="space-y-1.5 bg-[#090c14] p-3.5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                    ۳. فایل OpenAPI (برای Custom GPTs و پلاگین‌های چت‌جی‌پی‌تی):
                  </span>
                  <a
                    href={OPENAPI_JSON_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>مشاهده JSON</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={OPENAPI_JSON_URL}
                    className="flex-1 bg-[#06080d] border border-emerald-500/30 rounded-lg px-3 py-2 font-mono text-[11px] text-emerald-300 select-all outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(OPENAPI_JSON_URL, 'openapi_json')}
                    className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition shrink-0 cursor-pointer shadow-sm"
                  >
                    {copiedKey === 'openapi_json' ? 'کپی شد!' : 'کپی آدرس'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  کافیست در ساخت Custom GPT در بخش Actions گزینه Import URL را بزنید و این آدرس را جایگذاری کنید.
                </p>
              </div>

              {/* Endpoint 4: Direct Webhook */}
              <div className="space-y-1.5 bg-[#090c14] p-3.5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    ۴. وب‌هوک ارسال پرامپت مستقیم (برای ربات‌های تلگرام و اتوماسیون):
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono font-semibold">POST /api/agent/prompt</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={AGENT_WEBHOOK_URL}
                    className="flex-1 bg-[#06080d] border border-amber-500/30 rounded-lg px-3 py-2 font-mono text-[11px] text-amber-300 select-all outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(AGENT_WEBHOOK_URL, 'webhook_url')}
                    className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition shrink-0 cursor-pointer shadow-sm"
                  >
                    {copiedKey === 'webhook_url' ? 'کپی شد!' : 'کپی آدرس'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  ورودی: <code className="text-amber-300 font-mono">{"{\"prompt\": \"متن پرامپت شما\"}"}</code>
                </p>
              </div>

              {/* Code Snippets */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-300">
                    نمونه کد اتصال در پایتون (Python):
                  </span>
                  <button
                    onClick={() => copyToClipboard(pythonSnippet, 'python_snippet')}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    {copiedKey === 'python_snippet' ? 'کپی شد!' : 'کپی کد پایتون'}
                  </button>
                </div>
                <pre className="bg-[#0b0e17] border border-white/10 rounded-xl p-3 text-[10px] font-mono text-cyan-200 overflow-x-auto custom-scrollbar leading-relaxed">
                  {pythonSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT WEB URL */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <p className="font-semibold text-emerald-300">
                    لینک وب عمومی فعال و آنلاین است
                  </p>
                  <p className="text-slate-300 mt-0.5">
                    هر فرد با این آدرس اینترنتی می‌تواند بدون نیاز به ورود یا احراز هویت، برنامه را در مرورگر خود باز کرده و استفاده کند.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  آدرس اصلی پلتفرم برای اشتراک با کاربران:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#0b0e17] border border-cyan-500/40 rounded-xl px-3.5 py-2.5 font-mono text-cyan-300 text-xs truncate select-all">
                    {currentUrl}
                  </div>
                  <button
                    onClick={() => copyToClipboard(currentUrl, 'web_url')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition text-xs shadow-md shrink-0 cursor-pointer ${
                      copiedKey === 'web_url'
                        ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
                    }`}
                  >
                    {copiedKey === 'web_url' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>کپی شد!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>کپی لینک</span>
                      </>
                    )}
                  </button>

                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
                    title="باز کردن در تب جدید"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                  اشتراک‌گذاری سریع در شبکه‌های اجتماعی:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a
                    href={telegramShare}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 text-[#229ED9] border border-[#229ED9]/30 font-medium transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>تلگرام</span>
                  </a>

                  <a
                    href={whatsappShare}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 font-medium transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساپ</span>
                  </a>

                  <a
                    href={twitterShare}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 font-medium transition"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                    <span>توییتر / X</span>
                  </a>

                  <a
                    href={emailShare}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/25 font-medium transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>ایمیل</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QR CODE */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
              <div className="p-3 bg-[#080b12] rounded-2xl border border-cyan-500/30 shadow-xl shadow-cyan-500/10 inline-block">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-44 h-44 rounded-xl"
                  loading="lazy"
                />
              </div>

              <div className="max-w-xs space-y-1">
                <p className="font-semibold text-white text-xs flex items-center justify-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>اسکن با دوربین تلفن همراه</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  دوربین گوشی خود را جلوی بارکد بگیرید تا مستقیماً به نسخه عمومی و بهینه‌سازی‌شده PWA منتقل شوید.
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(currentUrl, 'qr_url')}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 text-xs font-semibold border border-white/10 transition cursor-pointer"
              >
                {copiedKey === 'qr_url' ? 'لینک کپی شد!' : 'کپی آدرس بارکد'}
              </button>
            </div>
          )}

          {/* TAB 4: EMBED IFRAME */}
          {activeTab === 'embed' && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-300 leading-relaxed">
                می‌توانید وب‌سایت یا ادیتور را به صورت آی‌فریم ریسپانسیو داخل وبلاگ، سایت شخصی یا پرتال‌های شرکتی قرار دهید:
              </p>

              <div className="relative">
                <textarea
                  readOnly
                  rows={4}
                  value={embedSnippet}
                  className="w-full bg-[#0b0e17] border border-white/15 rounded-xl p-3 font-mono text-[11px] text-slate-300 resize-none outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => copyToClipboard(embedSnippet, 'embed_snippet')}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] transition cursor-pointer shadow-md"
                >
                  {copiedKey === 'embed_snippet' ? 'کپی شد!' : 'کپی کد Embed'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[10px] text-slate-400 space-y-1">
                <p className="text-slate-300 font-semibold">نکات مهم برای آی‌فریم:</p>
                <p>• از ویژگی allowfullscreen برای تجربه‌ی تمام‌صفحه پشتیبانی می‌کند.</p>
                <p>• کاملاً واکنش‌گرا (Responsive) و سازگار با انواع صفحات نمایش و تبلت‌ها است.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#090c14]/90 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OpenAI Compatible & LLM Ready</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition cursor-pointer"
          >
            بستن (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
