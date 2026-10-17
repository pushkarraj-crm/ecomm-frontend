import Link from 'next/link';
export default function NotFound() {
  return (
    <section className="rbt-section-gap2">
      <div className="container text-center">
        <h1>Page not found</h1>
        <p>Let’s get you back to the store.</p>
        <Link className="rbt-btn" href="/">
          Go home
        </Link>
      </div>
    </section>
  );
}
