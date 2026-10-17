'use client';
export default function Error({ reset }) {
  return (
    <div className="next-state" role="alert">
      <h2>This page could not be loaded.</h2>
      <button className="rbt-btn" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
