"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main style={{ maxWidth: 720, margin: "4rem auto", padding: "1.5rem" }}>
      <h1>Jadual tidak dapat dipaparkan</h1>
      <p>
        Terdapat masalah dengan kandungan jadual yang diterbitkan. Sila hubungi
        pihak masjid atau cuba semula.
      </p>
      <button className="button button--outline" onClick={reset}>
        Cuba semula
      </button>
    </main>
  );
}
