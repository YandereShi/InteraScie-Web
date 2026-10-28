import "../css/AccountCheckError.css";

function AccountCheckError({ onRetry, retrying, inline = false }) {
  return (
    <section className={`accountcheckerror${inline ? " accountcheckerrorinline" : ""}`} aria-busy={retrying}>
      <p role="alert">Unable to verify your account. Check your connection and try again.</p>
      <button type="button" onClick={onRetry} disabled={retrying}>
        {retrying ? "Checking..." : "Try again"}
      </button>
    </section>
  );
}

export default AccountCheckError;
