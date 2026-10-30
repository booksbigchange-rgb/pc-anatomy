/**
 * The chosen shield, cropped and resized from the original artwork sheet
 * (public/bigchange-logo-original.png, kept unchanged) so headers load 25 KB, not 1.5 MB.
 */
export default function AcademyLogo() {
  return (
    <span className="academy-logo">
      {/* Vite serves this artwork directly; Next Image is not available. */}
      {/* oxlint-disable-next-line next/no-img-element */}
      <img
        src={`${import.meta.env.BASE_URL}bigchange-logo-shield.png`}
        alt="BigChange Academy — navy and gold shield with graduation cap, books and laurel"
        width="132"
        height="144"
      />
    </span>
  );
}
