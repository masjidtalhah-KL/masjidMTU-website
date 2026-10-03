"use client";

// SPDX-License-Identifier: GPL-3.0-only
// Rendering adapted from JadualKuliahBulanan (378b1bb), 2026-10-01.
// See docs/third-party/JADUAL-KULIAH-NOTICE.md for upstream sources and changes.
import { useEffect, useId, useState, type Ref } from "react";
import { lectureMonths, sessionLabel, type MonthSchedule, type PosterSettings, type PosterImage, type Session, type Speaker } from "./model";
import { approximateText, fitPosterCopy, fitSingleLine, POSTER, POSTER_FONTS, portraitBounds, posterCellRects, infaqPlacement, infaqGeometry, type MeasureText, type TextStyle } from "./poster-layout";

function Lines({ lines, x, y, style, lineHeight = 1.07, outline = false }: { lines: string[]; x: number; y: number; style: TextStyle; lineHeight?: number; outline?: boolean }) {
  return <text x={x} y={y + style.size * .85} fill="white" fontFamily={style.family} fontSize={style.size} fontWeight={style.weight} fontStyle={style.italic ? "italic" : "normal"} stroke={outline ? "#101a19" : undefined} strokeWidth={outline ? style.size * .07 : undefined} paintOrder="stroke fill" strokeLinejoin="round">
    {lines.map((line, index) => <tspan key={index} x={x} dy={index ? style.size * lineHeight : 0}>{line}</tspan>)}
  </text>;
}

function InfaqPanel({ image, width, height, edge, measure }: { image: PosterImage; width: number; height: number; edge: "leading" | "trailing"; measure: MeasureText }) {
  const box = infaqGeometry(width, height);
  const heading = "INFAQ UNTUK MASJID", message = "Imbas untuk menyumbang";
  const headingSize = fitSingleLine(heading, box.textWidth, { size: 24, family: POSTER_FONTS.title, weight: 900 }, measure, 14);
  const messageSize = fitSingleLine(message, box.textWidth, { size: 19, family: POSTER_FONTS.name }, measure, 12);
  const recipient = box.textWidth < 280 ? ["MASJID TALHAH BIN", "UBAIDILLAH"] : ["MASJID TALHAH BIN UBAIDILLAH"];
  const nameSize = Math.min(...recipient.map(line => fitSingleLine(line, box.textWidth, { size: 15, family: POSTER_FONTS.name, weight: 700 }, measure, 11)));
  const copyHeight = headingSize + 7 + messageSize + 10 + recipient.length * nameSize * 1.1;
  const top = (height - copyHeight) / 2;
  return <g data-infaq-panel={edge} role="group" aria-label="Ruang infaq Masjid Talhah Bin Ubaidillah">
    <image data-infaq-qr="true" href={image.src} x={box.left} y={box.qrY} width={box.qrSize} height={box.qrSize} preserveAspectRatio="xMidYMid meet"><title>{image.alt}</title></image>
    <text x={box.textX} y={top + headingSize * .85} fill="#102b47" fontFamily={POSTER_FONTS.title} fontWeight="900" fontSize={headingSize}>{heading}</text>
    <text x={box.textX} y={top + headingSize + 7 + messageSize * .85} fill="#334f68" fontSize={messageSize}>{message}</text>
    <text x={box.textX} y={top + headingSize + 7 + messageSize + 10 + nameSize * .85} fill="#102b47" fontSize={nameSize} fontWeight="700">{recipient.map((line,index)=><tspan key={line} x={box.textX} dy={index ? nameSize * 1.1 : 0}>{line}</tspan>)}</text>
  </g>;
}

function sessionGeometry(session: Session, speakers: Speaker[], dual: boolean, slot: number, sixRows: boolean, width: number, height: number, measure: MeasureText) {
  const speaker = speakers.find(({ id }) => id === session.speakerId);
  // Loaded month snapshots remain stable even if a reusable speaker is changed/deactivated.
  // Unpersisted demo sessions still resolve their current library selection.
  const hasSnapshot = session.speakerName !== undefined;
  const name = hasSnapshot ? session.speakerName! : speaker?.name || "";
  const yasin = session.sessionType === "yasin", reverse = dual && slot === 1 && !yasin;
  const pending = session.sessionType === "jumaat" && !name;
  const photo = yasin ? undefined : hasSnapshot ? session.photo : speaker?.photo;
  const bandHeight = dual ? (sixRows ? 26 : 32) : (sixRows ? 35 : yasin ? 41 : 44);
  const bandBottom = dual ? (sixRows ? 1 : 2) : (sixRows ? 10 : yasin ? 16 : 18);
  const bandY = height - bandBottom - bandHeight;
  const photoWidth = yasin ? (dual ? 34 : sixRows ? 51 : 56) : dual ? (sixRows ? 32 : 43) : sixRows ? 51 : 59;
  const photoHeight = yasin ? (dual ? 37 : sixRows ? 54 : 62) : dual ? (sixRows ? 32 : 44) : sixRows ? 54 : 64;
  const photoBottom = yasin ? (dual ? 2 : sixRows ? 4 : 11) : dual ? 0 : sixRows ? 4 : 8;
  const photoX = reverse ? width - 5 - photoWidth : yasin ? 7 : dual ? 5 : 6;
  const textLeft = !photo && !yasin ? 7 : reverse ? (sixRows ? 5 : 7) : dual ? (yasin ? 43 : sixRows ? 41 : 53) : sixRows ? 60 : yasin ? 70 : 67;
  const textRight = reverse && photo ? (sixRows ? 41 : 52) : dual ? 4 : 5;
  const topic = pending ? "Penceramah belum\nditetapkan" : session.topic || (yasin ? "BACAAN YASIN\n& TAHLIL" : "");
  const copy = fitPosterCopy(topic, name, width - textLeft - textRight - 1.6, bandHeight - 1, dual ? 10.5 : yasin ? 12 : 10.8, dual ? 9 : 10.8, measure, pending);
  return { yasin, pending, topic, name, photo, bandHeight, bandY, photoBox: { x: photoX, y: height - photoBottom - photoHeight, width: photoWidth, height: photoHeight }, textLeft, textWidth: width - textLeft - textRight, copy };
}

export function LecturePoster({ schedule, speakers, settings, svgRef, gridHeight = POSTER.gridHeight }: { schedule: MonthSchedule; speakers: Speaker[]; settings: PosterSettings; svgRef?: Ref<SVGSVGElement>; gridHeight?: number }) {
  const uid = useId().replaceAll(":", "");
  const [measure, setMeasure] = useState<MeasureText>(() => approximateText);
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let active = true;
    void document.fonts.ready.then(() => {
      const context = document.createElement("canvas").getContext("2d");
      if (!active || !context) return;
      setMeasure(() => (text: string, style: TextStyle) => {
        context.font = `${style.italic ? "italic " : ""}${style.weight || 400} ${style.size}px ${style.family}`;
        return context.measureText(text).width;
      });
      setFontsReady(true);
    });
    return () => { active = false; };
  }, []);

  const layout = posterCellRects(schedule.year, schedule.month, settings.compactCalendar ?? true, gridHeight);
  const infaq = settings.showInfaq !== false && settings.generalDonationQr ? infaqPlacement(layout).panel : undefined;
  const column = (POSTER.gridWidth - POSTER.columnGap * 6) / 7;
  const row = (gridHeight - POSTER.rowGap * (layout.rows - 1)) / layout.rows;
  const sixRows = layout.rows === 6;
  const identity = settings.identity;
  const title = settings.title.toUpperCase();
  const mosqueName = (identity?.name || "Masjid Talhah Bin Ubaidillah, Bukit Jalil").toUpperCase();
  const titleSize = fitSingleLine(title, 685, { size: 42, family: POSTER_FONTS.title, weight: 900 }, measure, 20);
  const nameSize = fitSingleLine(mosqueName, 650, { size: 26, family: POSTER_FONTS.name, weight: 700 }, measure, 13);
  const cells = layout.cells.map((cell) => {
    const { x, y, width } = cell;
    const entry = schedule.entries.find(({ day }) => day === cell.day);
    const specialPoster = entry?.specialPoster;
    const sessions = specialPoster ? [] : entry?.sessions || [];
    const sessionHeight = row / (sessions.length || 1);
    const geometry = sessions.map((session, slot) => sessionGeometry(session, speakers, sessions.length === 2, slot, sixRows, width, sessionHeight, measure));
    return { ...cell, x, y, width, sessions, specialPoster, sessionHeight, geometry };
  });
  // Fit once per density group, so short copy never looks larger than its neighbours.
  // Yasin and the pending-speaker notice retain their separate existing treatments.
  for (const count of [1, 2]) {
    const group = cells.filter(({ sessions }) => sessions.length === count).flatMap(({ geometry }) => geometry).filter(({ yasin, pending }) => !yasin && !pending);
    if (!group.length) continue;
    const topicSize = Math.min(...group.map(({ copy }) => copy.topicStyle.size));
    const nameSize = Math.min(...group.map(({ copy }) => copy.nameStyle.size));
    for (const g of group) g.copy = fitPosterCopy(g.topic, g.name, g.textWidth - 1.6, g.bandHeight - 1, topicSize, nameSize, measure);
  }
  const warnings = cells.filter(({ geometry }) => geometry.some(({ copy }) => !copy.fits)).map(({ day }) => day);

  return <>
    <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 1240 ${layout.height}`} role="img" aria-label={`Poster contoh ${lectureMonths[schedule.month - 1]} ${schedule.year}. Foto rujukan untuk demo, bukan jadual rasmi.`} data-lecture-poster="true" data-fonts-ready={fontsReady} data-overflow={warnings.length ? warnings.join(", ") : undefined} style={{ display: "block", width: "100%", height: "auto", fontFamily: "Arial, sans-serif" }}>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1"><stop offset=".2" stopColor="#0e2642"/><stop offset="1" stopColor="#537793"/></linearGradient>
        <linearGradient id={`${uid}-address`}><stop stopColor="#00a99d" stopOpacity="0"/><stop offset=".42" stopColor="#00a99d"/></linearGradient>
        <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="1.7" floodColor="#000" floodOpacity=".42"/></filter>
        <filter id={`${uid}-title-shadow`} x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="2" floodOpacity=".6"/></filter>
      </defs>
      <rect width="1240" height={layout.height} fill={`url(#${uid}-bg)`}/>
      <g data-poster-header="true">
        <image href={identity?.mosquePhoto || "/lecture-demo/mosque-cutout.webp"} x="163" y="17" width="434" height="212" preserveAspectRatio="xMidYMid meet"/>
        <image href={identity?.logos || "/lecture-demo/header-logos.webp"} x="26" y="17" width="169" height="93" preserveAspectRatio="xMidYMid meet"/>
        <text x="1203" y="64" textAnchor="end" fill="#ffe222" fontFamily={POSTER_FONTS.title} fontSize={titleSize} fontWeight="900" filter={`url(#${uid}-title-shadow)`}>{title}</text>
        <text x="1203" y="102" textAnchor="end" fill="white" fontSize={nameSize} fontWeight="700">{mosqueName}</text>
        <text x="891" y="143" textAnchor="end" fill="white" fontFamily={POSTER_FONTS.title} fontSize="31" fontWeight="900" filter={`url(#${uid}-title-shadow)`}>BULAN</text>
        <rect x="905" y="115.5" width="296.5" height="34" rx="18.5" fill="white" stroke="#050606" strokeWidth="3"/>
        <text x="1054" y="141.5" textAnchor="middle" fill="#000" fontFamily={POSTER_FONTS.topic} fontSize={fitSingleLine(`${lectureMonths[schedule.month - 1].toUpperCase()} ${schedule.year}`, 280, { size: 31, family: POSTER_FONTS.topic, weight: 700 }, measure)} fontWeight="700" letterSpacing="-.4">{lectureMonths[schedule.month - 1].toUpperCase()} {schedule.year}</text>
        <rect x="656" y="157" width="584" height="30" fill={`url(#${uid}-address)`}/>
        <Lines lines={identity?.addressLines || ["BUKIT JALIL, KUALA LUMPUR"]} x={795} y={161} style={{ size: 10.5, family: POSTER_FONTS.name, weight: 700 }} lineHeight={1.06}/>
        {identity?.phone && <><path d="M1079 161v22" stroke="#ffe222" strokeWidth="2"/><Lines lines={["NO. TELEFON:", identity.phone]} x={1091} y={161} style={{ size: 10.5, family: POSTER_FONTS.name, weight: 700 }} lineHeight={1.06}/></>}
      </g>
      {["ISNIN", "SELASA", "RABU", "KHAMIS", "JUMAAT", "SABTU", "AHAD"].map((label, index) => {
        const x = POSTER.left + index * (column + POSTER.columnGap);
        return <g key={label}><rect x={x} y="201" width={column} height="28" rx="18" fill="#ed0b58"/><text x={x + column / 2} y="223" textAnchor="middle" fill="white" fontFamily={POSTER_FONTS.title} fontSize="27" fontWeight="900" letterSpacing="-1.1">{label}</text></g>;
      })}
      {cells.map(({ day, x, y, width, sessions, specialPoster, sessionHeight, geometry }, index) => {
        const clip = `${uid}-cell-${index}`, yasinOnly = sessions.length === 1 && sessions[0].sessionType === "yasin";
        return <g key={index} data-poster-day={day || undefined}>
          <defs><clipPath id={clip}><rect x="0" y="0" width={width} height={row} rx="10"/></clipPath></defs>
          <rect x={x} y={y} width={width} height={row} rx="10" fill={yasinOnly ? settings.colours.yasin : "white"} filter={day ? `url(#${uid}-shadow)` : undefined}/>
          <g transform={`translate(${x} ${y})`} clipPath={`url(#${clip})`}>
            {infaq?.index === index && settings.generalDonationQr && <InfaqPanel image={settings.generalDonationQr} width={width} height={row} edge={infaq.edge} measure={measure}/>}
            {specialPoster && <image data-special-poster="full" href={specialPoster.image.src} x="0" y="0" width={width} height={row} preserveAspectRatio={`xMid${specialPoster.fit === "cover" && specialPoster.position === "top" ? "YMin" : specialPoster.fit === "cover" && specialPoster.position === "bottom" ? "YMax" : "YMid"} ${specialPoster.fit === "cover" ? "slice" : "meet"}`}><title>{specialPoster.image.alt}</title></image>}
            {sessions.map((session, slot) => {
              const g = geometry[slot], sy = slot * sessionHeight, photoClip = `${clip}-photo-${slot}`, copyClip = `${clip}-copy-${slot}`;
              const copyClipAllowance = .6;
              const colour = settings.colours[session.sessionType];
              const label = sessionLabel(session.sessionType).toUpperCase();
              const titleLines = sessions.length === 2 ? [label] : label.replace("KULIAH ", "KULIAH\n").replace("TAZKIRAH JUMAAT", "TAZKIRAH\nJUMAAT").split("\n");
              const labelSize = Math.min(sessions.length === 2 ? (sixRows ? 10 : 11.5) : sixRows ? 14 : 16, ...titleLines.map((line) => fitSingleLine(line, width - (slot === 0 ? 38 : 10), { size: sessions.length === 2 ? 11.5 : 16, family: POSTER_FONTS.title, weight: 900 }, measure)));
              const labelTop = sessions.length === 2 ? (sixRows ? 2 : 3) : sixRows ? 6 : 10;
              const copyY = g.bandY + Math.max(0, (g.bandHeight - g.copy.contentHeight) / 2);
              return <g key={session.id} transform={`translate(0 ${sy})`} data-poster-session={session.sessionType}>
                {!g.yasin && <text x={sessions.length === 2 ? 4 : 6} y={labelTop + labelSize * .86} fill="#073b2e" fontFamily={POSTER_FONTS.title} fontSize={labelSize} fontWeight="900" letterSpacing={sessions.length === 2 ? -.35 : -.5}>{titleLines.map((line, lineIndex) => <tspan key={lineIndex} x={sessions.length === 2 ? 4 : 6} dy={lineIndex ? labelSize * 1.01 : 0}>{line}</tspan>)}</text>}
                <rect x="0" y={g.bandY} width={width} height={g.bandHeight} fill={g.yasin && sessions.length === 1 ? settings.colours.maghrib : colour}/>
                {g.yasin && sessions.length === 2 && <rect x="0" y={g.bandY} width={width} height={g.bandHeight} fill="black" opacity=".18"/>}
                <defs><clipPath id={copyClip}><rect x={g.textLeft - copyClipAllowance} y={g.bandY} width={g.textWidth + copyClipAllowance * 2} height={g.bandHeight}/></clipPath></defs>
                <g clipPath={`url(#${copyClip})`}>
                  <Lines lines={g.copy.topicLines} x={g.textLeft + .8} y={copyY} style={g.copy.topicStyle}/>
                  <Lines lines={g.copy.nameLines} x={g.textLeft + .8} y={copyY + g.copy.topicLines.length * g.copy.topicStyle.size * 1.07 + g.copy.gap} style={g.copy.nameStyle} lineHeight={1.02} outline/>
                </g>
                {g.yasin ? <image href={identity?.yasinBook || "/lecture-demo/yasin-book.webp"} {...g.photoBox} preserveAspectRatio="xMidYMid meet"/> : g.photo && <>
                  <defs><clipPath id={photoClip}><rect {...g.photoBox}/></clipPath></defs>
                  <rect {...g.photoBox} fill="white"/>
                  <g clipPath={`url(#${photoClip})`}>
                    <svg {...portraitBounds({ ...g.photo, width: g.photo.width - 2 * (g.photo.borderInset ?? 0), height: g.photo.height - 2 * (g.photo.borderInset ?? 0) }, g.photoBox)} viewBox={`${g.photo.borderInset ?? 0} ${g.photo.borderInset ?? 0} ${g.photo.width - 2 * (g.photo.borderInset ?? 0)} ${g.photo.height - 2 * (g.photo.borderInset ?? 0)}`} overflow="hidden">
                      <image href={g.photo.src} width={g.photo.width} height={g.photo.height}/>
                    </svg>
                  </g>
                  <rect {...g.photoBox} fill="none" stroke={colour} strokeWidth="1.5"/>
                </>}
              </g>;
            })}
            {!!day && <><path d={`M${width - 31} 0H${width}V32H${width - 5}Q${width - 31} 32 ${width - 31} 6Z`} fill="#ffe222"/><text x={width - 15.5} y="22" textAnchor="middle" fill="#050505" fontSize="16" fontWeight="700">{day}</text></>}
          </g>
        </g>;
      })}
      <text x="620" y={layout.height - 4} textAnchor="middle" fontSize="8" fill="white" letterSpacing=".35">DATA CONTOH · FOTO RUJUKAN UNTUK DEMO · BUKAN JADUAL RASMI</text>
    </svg>
    {!!warnings.length && <p role="status" style={{ margin: 0, padding: "10px 14px", background: "#fff4d8", color: "#755919", fontSize: 13 }}>Teks terlalu panjang pada {warnings.join(", ")} hb. Pendekkan teks sebelum export; teks penuh kekal dalam editor.</p>}
  </>;
}
