export default function SEOContent() {
  return (
    <section
      className="w-full py-12 px-6 pb-32 sm:pb-12 bg-surface-warm"
      aria-label="About Paletta"
    >
      <div className="mx-auto" style={{ maxWidth: 720 }}>
        <h2 className="text-xl font-semibold text-foreground">
          The color palette generator built for modern workflows
        </h2>
        <p className="text-sm mt-3 text-muted-foreground" style={{ lineHeight: 1.7 }}>
          Paletta is a free, AI-powered color palette generator that puts
          accessibility at the center of every palette you create. Generate
          harmonious color schemes in one click, fine-tune individual shades,
          and get production-ready code for Tailwind CSS config, plain CSS custom
          properties, or SVG swatches — whatever your
          project needs. Every palette is checked against WCAG contrast
          ratios so your colors look great and work for everyone.
        </p>

        <hr
          className="border-border my-8"
          style={{ borderTopWidth: 1 }}
          aria-hidden="true"
        />

        <h2 className="text-xl font-semibold text-foreground">
          Built for Tailwind CSS
        </h2>
        <p className="text-sm mt-3 text-muted-foreground" style={{ lineHeight: 1.7 }}>
          Need a Tailwind CSS color palette with a full 50–900 shade scale?
          Paletta generates production-ready shade ramps from any base color
          and exports them as a Tailwind config snippet you can paste straight
          into <code className="text-xs bg-border-light px-1 py-0.5 rounded">tailwind.config.js</code>.
          Designers preview the scale visually; developers copy it and ship —
          no manual hex-picking required.
        </p>

        <hr
          className="border-border my-8"
          style={{ borderTopWidth: 1 }}
          aria-hidden="true"
        />

        <h2 className="text-xl font-semibold text-foreground">
          From palette to Figma in seconds
        </h2>
        <p className="text-sm mt-3 text-muted-foreground" style={{ lineHeight: 1.7 }}>
          Generate a color palette, preview it on real UI templates, then
          use it directly in Figma with the Paletta plugin. Create variables,
          check contrast, and keep your design system consistent from
          canvas to code — all without leaving Figma.
        </p>

        <hr
          className="border-border my-8"
          style={{ borderTopWidth: 1 }}
          aria-hidden="true"
        />

        <h2 className="text-xl font-semibold text-foreground">
          Design for everyone
        </h2>
        <p className="text-sm mt-3 text-muted-foreground" style={{ lineHeight: 1.7 }}>
          Paletta checks every palette against WCAG 2.1 contrast ratios
          automatically. See at a glance which color pairs pass AA and AAA
          standards, then preview your palette through five color-vision
          simulations — including protanopia, deuteranopia, and tritanopia.
          Accessibility isn't a Pro add-on; it's built into every palette
          you create.
        </p>
      </div>
    </section>
  )
}
