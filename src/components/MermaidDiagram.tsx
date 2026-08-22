import { useEffect, useId, useRef, useState } from "react";

type MermaidDiagramProps = {
  chart: string;
};

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const reactId = useId();
  const diagramId = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "neutral",
        });

        const result = await mermaid.render(diagramId, chart);
        if (cancelled) return;

        setSvg(result.svg);
        setFailed(false);
        requestAnimationFrame(() => {
          if (containerRef.current) result.bindFunctions?.(containerRef.current);
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, diagramId]);

  if (failed) {
    return (
      <div className="mermaid-error">
        <p>Diagram failed to render.</p>
        <pre>
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-diagram"
      aria-busy={!svg}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
