/** Display the school wordmark from the supplied transparent artwork without redrawing it. */
export default function AcademyLogo() {
  return (
    <span className="academy-logo">
      {/* Vite serves this original artwork directly; Next Image is not available. */}
      {/* oxlint-disable-next-line next/no-img-element */}
      <img
        src={`${import.meta.env.BASE_URL}bigchange-school-logo.png`}
        alt="BigChange Academy — gold graduation cap, books and laurel"
        width="500"
        height="500"
      />
    </span>
  );
}
