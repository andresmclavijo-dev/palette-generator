export default function SEOContent() {
  return (
    <section
      className="hidden sm:block w-full"
      style={{ backgroundColor: '#FAFAF8' }}
      aria-label="About Paletta"
    >
      <div className="mx-auto" style={{ maxWidth: 720, padding: '48px 24px' }}>
        <h2
          className="text-xl font-semibold"
          style={{ color: '#1a1a2e' }}
        >
          The color palette generator built for modern workflows
        </h2>
        <p
          className="text-sm mt-3"
          style={{ color: '#4B5563', lineHeight: 1.7 }}
        >
          Paletta is a free, AI-powered color palette generator that puts
          accessibility at the center of every palette you create. Generate
          harmonious color schemes in one click, fine-tune individual shades,
          and export directly to Tailwind CSS config, plain CSS custom
          properties, JSON tokens, SVG swatches, or PNG — whatever your
          project needs. Every palette is checked against WCAG contrast
          ratios so your colors look great and work for everyone.
        </p>

        <hr
          className="border-gray-200 my-8"
          style={{ borderTopWidth: 1 }}
          aria-hidden="true"
        />

        <h2
          className="text-xl font-semibold"
          style={{ color: '#1a1a2e' }}
        >
          Built for Tailwind CSS
        </h2>
        <p
          className="text-sm mt-3"
          style={{ color: '#4B5563', lineHeight: 1.7 }}
        >
          Need a Tailwind CSS color palette with a full 50–900 shade scale?
          Paletta generates production-ready shade ramps from any base color
          and exports them as a Tailwind config snippet you can paste straight
          into <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">tailwind.config.js</code>.
          Designers preview the scale visually; developers copy it and ship —
          no manual hex-picking required.
        </p>

        <hr
          className="border-gray-200 my-8"
          style={{ borderTopWidth: 1 }}
          aria-hidden="true"
        />

        <h2
          className="text-xl font-semibold"
          style={{ color: '#1a1a2e' }}
        >
          From palette to Figma in seconds
        </h2>
        <p
          className="text-sm mt-3"
          style={{ color: '#4B5563', lineHeight: 1.7 }}
        >
          Generate a color palette, preview it on real UI templates, then
          export the values and drop them into your Figma design tokens.
          Paletta bridges the gap between inspiration and implementation so
          your design system stays consistent from canvas to code. A
          dedicated Figma plugin is coming soon to make the handoff even
          faster.
        </p>
      </div>
    </section>
  )
}
