/** Display the chosen shield from the original artwork sheet without redrawing it. */
export default function AcademyLogo() {
  return (
    <span className="academy-logo">
      {/* Vite serves this original artwork directly; Next Image is not available. */}
      {/* oxlint-disable-next-line next/no-img-element */}
      <img
        src={`${import.meta.env.BASE_URL}bigchange-logo-original.png`}
        alt="BigChange Academy — navy and gold shield with graduation cap, books and laurel"
        width="1536"
        height="1024"
      />
    </span>
  );
}
