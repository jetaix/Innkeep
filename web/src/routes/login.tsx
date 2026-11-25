import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { rpc, unwrap } from "../api/client";
import { color } from "../tokens.stylex";

export const Route = createFileRoute("/login")({ component: LoginPage });

const styles = stylex.create({
  main: {
    maxWidth: "24rem",
    minHeight: "100dvh",
    marginInline: "auto",
    padding: "3rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "0.75rem",
  },
  title: { fontSize: "1.25rem", fontWeight: 600, margin: 0 },
  field: {
    height: "2.5rem",
    padding: "0 0.75rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.lineStrong,
    borderRadius: 6,
    backgroundColor: color.bg,
    color: color.ink,
    // 16 px keeps a phone from zooming into the field.
    fontSize: "1rem",
  },
  button: {
    height: "2.5rem",
    borderWidth: 0,
    borderRadius: 6,
    backgroundColor: color.ink,
    color: color.inverse,
    fontWeight: 500,
    cursor: "pointer",
    opacity: { default: 1, ":disabled": 0.6 },
  },
  error: { color: color.critical, margin: 0 },
});

function LoginPage() {
  const navigate = useNavigate();
  const signIn = useMutation({
    mutationFn: (password: string) => unwrap(rpc.session.$post({ json: { password } })),
    onSuccess: async (_data, _password, _context, { client }) => {
      await client.invalidateQueries();
      await navigate({ to: "/overview" });
    },
  });
  return (
    <form
      {...stylex.props(styles.main)}
      onSubmit={(event) => {
        event.preventDefault();
        signIn.mutate(String(new FormData(event.currentTarget).get("password") ?? ""));
      }}
    >
      <h1 {...stylex.props(styles.title)}>Innkeep</h1>
      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        {...stylex.props(styles.field)}
      />
      {signIn.isError && (
        <p role="alert" {...stylex.props(styles.error)}>
          {signIn.error.message}
        </p>
      )}
      <button type="submit" disabled={signIn.isPending} {...stylex.props(styles.button)}>
        Sign in
      </button>
    </form>
  );
}
