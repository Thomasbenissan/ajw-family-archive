"use client";

import { useEffect, useRef, useCallback } from "react";
import "family-chart/styles/family-chart.css";
import type { FamilyChartDatum } from "@/lib/types";

interface FamilyTreeViewProps {
  data: FamilyChartDatum[];
  onPersonClick: (personId: string) => void;
  zoomRef: React.MutableRefObject<{
    zoomIn: () => void;
    zoomOut: () => void;
    fitToScreen: () => void;
  } | null>;
}

function getInitials(firstName: string, lastName: string): string {
  const f = firstName.trim().charAt(0).toUpperCase();
  const l = lastName.trim().charAt(0).toUpperCase();
  return f + l || f || "?";
}

function formatDates(born: string, died: string): string {
  if (born && died) return `${born}\u2013${died}`;
  if (born) return `b.\u00A0${born}`;
  return "dates unknown";
}

// Card dimensions — must match setCardDim exactly
const CARD_W = 120;
const CARD_H = 140;

export default function FamilyTreeView({
  data,
  onPersonClick,
  zoomRef,
}: FamilyTreeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof import("family-chart").createChart> | null>(null);
  const bgObserverRef = useRef<MutationObserver | null>(null);

  const handlePersonClick = useCallback(
    (personId: string) => {
      onPersonClick(personId);
    },
    [onPersonClick]
  );

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    let f3: typeof import("family-chart");

    (async () => {
      f3 = await import("family-chart");
      if (!containerRef.current) return;

      const chart = f3.createChart(containerRef.current, data)
        .setCardXSpacing(CARD_W + 80)
        .setCardYSpacing(CARD_H + 60)
        .setTransitionTime(800);

      chartRef.current = chart;

      const cardHtml = chart
        .setCardHtml()
        .setStyle("rect")
        .setCardDim({
          w: CARD_W,
          h: CARD_H,
        })
        .setCardDisplay([["first name", "last name"], ["birthday"]])
        .setOnCardClick((e: MouseEvent, d: any) => {
          handlePersonClick(d.data.id);
        })
        .setOnCardUpdate(function (this: HTMLElement, d: any) {
          const personData = d.data.data;
          const gender = personData.gender || "M";
          const firstName = personData["first name"] || "";
          const lastName = personData["last name"] || "";
          const born = personData.birthday || "";
          const died = personData.death || "";
          const photoUrl = personData["photo url"] || "";
          const initials = getInitials(firstName, lastName);
          const dates = formatDates(born, died);
          const isDateUnknown = !born && !died;

          const bgColor = gender === "F" ? "#b8917a" : "#7c9a92";
          const fullName = `${firstName} ${lastName}`.trim();

          // Find the card-inner element created by the library
          const cardInner = this.querySelector(".card-inner") as HTMLElement;
          if (!cardInner) return;

          // Replace its content with our custom design
          cardInner.innerHTML = `
            <div class="white-card" style="
              width: ${CARD_W}px;
              height: ${CARD_H}px;
              background: #ffffff;
              border: 1px solid #e8e3dd;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 12px 8px 10px;
              cursor: pointer;
              font-family: 'Inter', sans-serif;
              box-sizing: border-box;
            ">
              ${
                photoUrl
                  ? `<img src="${photoUrl}" style="
                      width: 44px; height: 44px; border-radius: 50%;
                      object-fit: cover; margin-bottom: 8px;
                    " />`
                  : `<div style="
                      width: 44px; height: 44px; border-radius: 50%;
                      background: ${bgColor}; display: flex;
                      align-items: center; justify-content: center;
                      margin-bottom: 8px; flex-shrink: 0;
                    ">
                      <span style="
                        color: #ffffff; font-size: 15px; font-weight: 600;
                        letter-spacing: 0.5px;
                      ">${initials}</span>
                    </div>`
              }
              <div style="
                font-size: 11px; font-weight: 600; color: #2c2c2c;
                text-align: center; max-width: ${CARD_W - 16}px;
                display: -webkit-box; -webkit-line-clamp: 2;
                -webkit-box-orient: vertical; overflow: hidden;
                line-height: 1.25; margin-bottom: 3px;
                word-break: break-word;
              ">${fullName}</div>
              <div style="
                font-size: 10px; color: #8a8279; text-align: center;
                ${isDateUnknown ? "font-style: italic;" : ""}
              ">${dates}</div>
            </div>
          `;

          // Strip library's default background/padding so our card shows cleanly
          cardInner.style.cssText = "background:transparent !important; padding:0; border-radius:0; box-shadow:none; width:" + CARD_W + "px; height:" + CARD_H + "px; min-height:0; overflow:visible;";
        });

      // Expose zoom controls
      zoomRef.current = {
        zoomIn: () => {
          const svg = containerRef.current?.querySelector("svg.main_svg") as SVGSVGElement;
          if (svg) f3.handlers.manualZoom({ amount: 1, svg, transition_time: 300 });
        },
        zoomOut: () => {
          const svg = containerRef.current?.querySelector("svg.main_svg") as SVGSVGElement;
          if (svg) f3.handlers.manualZoom({ amount: -1, svg, transition_time: 300 });
        },
        fitToScreen: () => {
          chart.updateTree({ tree_position: "fit", transition_time: 500 });
        },
      };

      chart.updateTree({ initial: true, tree_position: "fit" });

      // Zoom limits + paper-dot parallax.
      //
      // Key facts about family-chart's internals:
      //  - The d3-zoom behavior is attached to #f3Canvas (NOT .f3). So the
      //    __zoomObj reference (for setting scaleExtent) lives there.
      //  - Zoom/pan is applied to `svg .view` via inline CSS `style.transform`
      //    (not the SVG `transform` attribute), so we watch `style` mutations.
      requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;
        const f3Canvas = container.querySelector("#f3Canvas") as
          | (HTMLDivElement & {
              __zoomObj?: {
                scaleExtent: (r: [number, number]) => unknown;
                translateExtent: (
                  r: [[number, number], [number, number]]
                ) => unknown;
              };
            })
          | null;
        if (f3Canvas?.__zoomObj) {
          f3Canvas.__zoomObj.scaleExtent([0.4, 2.0]);
          // Pan boundary in world (tree) coordinates. Asymmetric on y because
          // family-chart places the root near y=0 and grows children downward
          // — we need much more room below the origin than above it.
          f3Canvas.__zoomObj.translateExtent([
            [-1800, -700],
            [1800, 2400],
          ]);
        }

        const view = container.querySelector("svg .view") as SVGGElement | null;
        if (!view) return;

        // Dots pan with the tree but keep a constant tile size regardless
        // of zoom — the paper grain stays at fixed screen density.
        const syncFromTransform = () => {
          const transform = view.style.transform || "";
          let tx = 0;
          let ty = 0;
          const tMatch = transform.match(/translate\(([^)]+)\)/);
          if (tMatch) {
            const parts = tMatch[1].split(/[,\s]+/).map(parseFloat);
            tx = parts[0] || 0;
            ty = parts[1] || 0;
          }
          container.style.setProperty(
            "background-position",
            `${tx}px ${ty}px, center center`,
            "important"
          );
        };

        syncFromTransform();
        const observer = new MutationObserver(syncFromTransform);
        observer.observe(view, {
          attributes: true,
          attributeFilter: ["style"],
        });
        bgObserverRef.current = observer;
      });
    })();

    return () => {
      chartRef.current = null;
      bgObserverRef.current?.disconnect();
      bgObserverRef.current = null;
    };
  }, [data, handlePersonClick, zoomRef]);

  return (
    <div
      className="f3"
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    />
  );
}
