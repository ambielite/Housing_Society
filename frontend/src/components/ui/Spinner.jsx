export function Spinner() {
  return <span className="spinner" role="status" aria-label="Loading" />;
}

export function FullPageLoader() {
  return (
    <div className="full-page-loader">
      <Spinner />
    </div>
  );
}
