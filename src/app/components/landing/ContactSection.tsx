"use client";

import React from "react";
import { Mail, Globe, MessageSquare } from "lucide-react";

interface ContactProfile {
  name: string;
  email?: string;
  github: string;
  githubUrl: string;
  linkedin: string;
  linkedinUrl: string;
}

export function ContactSection() {
  const contacts: ContactProfile[] = [
    {
      name: "Krishna Kant",
      github: "github.com/krshhh6",
      githubUrl: "https://github.com/krshhh6",
      linkedin: "linkedin.com/in/krishna-kant-krshhh6",
      linkedinUrl: "https://www.linkedin.com/in/krishna-kant-krshhh6",
    },
    {
      name: "Tarun Kumar Agnihotri",
      github: "github.com/tarunagnihotri534",
      githubUrl: "https://github.com/tarunagnihotri534",
      linkedin: "linkedin.com/in/tarun-agnihotri69",
      linkedinUrl: "https://www.linkedin.com/in/tarun-agnihotri69",
    },
    {
      name: "Shubh Jaiswal",
      github: "github.com/shubhjaiswal551",
      githubUrl: "https://github.com/shubhjaiswal551",
      linkedin: "linkedin.com/in/shubhjaiswal551",
      linkedinUrl: "https://www.linkedin.com/in/shubhjaiswal551",
    },
    {
      name: "Meghna Sabbarwal",
      github: "github.com/meghnasabbarwal",
      githubUrl: "https://github.com/meghnasabbarwal",
      linkedin: "linkedin.com/in/meghna-sabbarwal-00a7a4380",
      linkedinUrl: "https://www.linkedin.com/in/meghna-sabbarwal-00a7a4380",
    },
  ];

  return (
    <section id="contact" className="py-20 md:py-28 bg-[#FAF8F5] relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── TOP BADGE ICON ── */}
        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-center text-stone-700">
            <Mail size={20} className="stroke-[1.75]" />
          </div>
        </div>

        {/* ── SECTION HEADER ── */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-bold tracking-[0.22em] text-stone-400 uppercase font-sans">
            GET IN TOUCH
          </span>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-950 mt-3 leading-[1.15]">
            We&apos;re here,{" "}
            <span
              className="font-serif italic font-normal text-stone-700"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              quietly listening.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-stone-500 mt-4 leading-relaxed font-normal max-w-xl mx-auto">
            Whether it&apos;s a question, a bug, or an idea you can&apos;t shake, we&apos;d love to hear from you.
          </p>
        </div>

        {/* ── FOUR CONTACT CARDS (2x2 GRID) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12 items-start">
          {contacts.map((contact) => (
            <div
              key={contact.name}
              className="rounded-[32px] bg-white border border-stone-200/80 p-6 sm:p-8 shadow-xs space-y-5 transition-all hover:border-stone-300"
              style={{
                boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
              }}
            >
              {/* Profile Header */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-center text-stone-700 shadow-2xs shrink-0">
                  <Mail size={18} className="stroke-[1.75]" />
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-base text-stone-900 leading-snug truncate">{contact.name}</h3>
                </div>
              </div>

              {/* Action Rows */}
              <div className="space-y-2.5">
                {/* Email Row (Optional) */}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#FAF9F6] border border-stone-200/60 hover:border-stone-300 hover:bg-[#F4F2EC] transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-white border border-stone-200/70 flex items-center justify-center text-stone-500 group-hover:text-stone-900 shrink-0">
                        <Mail size={13} className="stroke-[1.75]" />
                      </div>
                      <div className="truncate">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">EMAIL</p>
                        <p className="text-xs font-semibold text-stone-800 truncate">{contact.email}</p>
                      </div>
                    </div>
                    <span className="text-stone-400 group-hover:text-stone-800 text-sm font-light transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 ml-1.5">
                      ↗
                    </span>
                  </a>
                )}

                {/* GitHub Row */}
                <a
                  href={contact.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#FAF9F6] border border-stone-200/60 hover:border-stone-300 hover:bg-[#F4F2EC] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-white border border-stone-200/70 flex items-center justify-center text-stone-500 group-hover:text-stone-900 shrink-0">
                      <Globe size={13} className="stroke-[1.75]" />
                    </div>
                    <div className="truncate">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">GITHUB</p>
                      <p className="text-xs font-semibold text-stone-800 truncate">{contact.github}</p>
                    </div>
                  </div>
                  <span className="text-stone-400 group-hover:text-stone-800 text-sm font-light transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 ml-1.5">
                    ↗
                  </span>
                </a>

                {/* LinkedIn Row */}
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#FAF9F6] border border-stone-200/60 hover:border-stone-300 hover:bg-[#F4F2EC] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-white border border-stone-200/70 flex items-center justify-center text-stone-500 group-hover:text-stone-900 shrink-0">
                      <MessageSquare size={13} className="stroke-[1.75]" />
                    </div>
                    <div className="truncate">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">LINKEDIN</p>
                      <p className="text-xs font-semibold text-stone-800 truncate">{contact.linkedin}</p>
                    </div>
                  </div>
                  <span className="text-stone-400 group-hover:text-stone-800 text-sm font-light transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 ml-1.5">
                    ↗
                  </span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
