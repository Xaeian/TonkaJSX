// scripts/ui/Login.jsx

/**
 * Login dropdown under a trigger Button, driven by a `session` such as `createSession` makes:
 * `login(user, pass)`, `logout()`, and `onChange(fn)` reporting `{status, user, error}`.
 * Signed in, the trigger names the user and a click on it signs out.
 *
 * @param {object} props
 * @param {object} props.session
 */
const Login = ({ session, class: className, ...rest }) => {
  let logged = false;
  function submit() {
    const user = userIn.value.trim();
    const pass = passIn.value;
    if(!user || !pass) return;
    session.login(user, pass);
  }
  const userIn = (
    <Input ghost size="sm" icon="person" placeholder="Username"
      onEnter={() => passIn.focus()} />
  );
  const passIn = (
    <PasswordInput ghost size="sm" icon="key" placeholder="Password" onEnter={submit} />
  );
  const errorEl = <div class="login-error"></div>;
  const panel = (
    <div class="login-panel" hidden>
      <stack gap="no" class="login-fields">{userIn}{passIn}{errorEl}</stack>
      <button class="login-submit" onClick={submit}>
        <span class="icon" translate={false}>login</span>
      </button>
    </div>
  );
  const btn = (
    <Button icon="lock" onClick={() => { if(logged) session.logout(); else panel.toggle(); }}>
      Login
    </Button>
  );
  const el = <div {...rest} class={["login", className]}>{btn}{panel}</div>;

  UI.overlay(panel, {
    portal: false,
    dismiss: (e) => !btn.contains(e.target),
    onOpen: () => (userIn.value ? passIn : userIn).focus(),
  });
  function showLogged(username) {
    logged = true;
    panel.close();
    btn.icon = "person";
    btn.label = username;
    btn.title = "Logout";
    btn.classList.add("login-logged");
    userIn.value = "";
    passIn.value = "";
    errorEl.textContent = "";
  }
  function showAnon() {
    logged = false;
    btn.icon = "lock";
    btn.label = "Login";
    btn.title = null;
    btn.classList.remove("login-logged");
    errorEl.textContent = "";
  }
  session.onChange((state) => {
    if(state.status === "auth") showLogged(state.user.username);
    else if(state.status === "anon") showAnon();
    else if(state.status === "error") errorEl.textContent = state.error || "Login failed";
  });
  return el;
};
