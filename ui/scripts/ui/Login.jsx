// scripts/ui/Login.jsx

/**
 * Login dropdown under a trigger Button. Two modes:
 *   standalone   the app drives it through `onSubmit({user, pass})`, `onLogout()`
 *                and the mutators `.logged(username)`, `.logout()`, `.error(msg)`
 *   session      `session` drives it: a manager with `login(user, pass)`, `logout()`
 *                and `onChange(fn)` reporting `{status, user, error}`;
 *                the standalone props and mutators are ignored
 *
 * Both: .open(), .close(), .toggle(), .isLogged
 *
 * @param {Object} props
 * @param {object} [props.session]
 * @param {string} [props.icon="lock"]
 * @param {string} [props.label="Login"]
 * @param {string} [props.title]
 * @param {"primary"|"danger"|"ghost"} [props.variant]
 * @param {"sm"|"lg"} [props.size]
 * @param {"left"|"center"|"right"} [props.align="right"]
 * @param {number} [props.offset=14]   px between the trigger and the panel
 * @param {({user:string, pass:string}) => void} [props.onSubmit]
 * @param {() => void} [props.onLogout]
 */
const Login = ({
  session, icon = "lock", label = "Login", title, variant, size, align = "right", offset = 14,
  onSubmit, onLogout, class: className, ...rest
}) => {
  let logged = false;
  const submit = () => {
    const user = userIn.value.trim();
    const pass = passIn.value;
    if(!user || !pass) return;
    if(session) session.login(user, pass);
    else onSubmit?.({ user, pass });
  };
  const userIn = (
    <Input ghost size="sm" icon="person" placeholder="Username"
      onEnter={() => passIn.focus()} />
  );
  const passIn = (
    <PasswordInput ghost size="sm" icon="key" placeholder="Password" onEnter={submit} />
  );
  const errorEl = <div class="login-error"></div>;
  const panel = (
    <div class={["login-panel", "login-" + align]} hidden
      style={{ "--login-offset": offset + "px" }}>
      <stack gap="no" class="login-fields">{userIn}{passIn}{errorEl}</stack>
      <button class="login-submit" onClick={submit}><span class="icon">login</span></button>
    </div>
  );
  const btn = (
    <Button icon={icon} variant={variant} size={size} title={title} onClick={() => {
      if(!logged) panel.toggle();
      else if(session) session.logout();
      else onLogout?.();
    }}>{label}</Button>
  );
  const el = <div {...rest} class={["login", className]}>{btn}{panel}</div>;

  UI.overlay(panel, {
    portal: false,
    dismiss: (e) => !btn.contains(e.target),
    onOpen: () => (userIn.value ? passIn : userIn).focus(),
  });
  const showLogged = (username) => {
    logged = true;
    panel.close();
    btn.icon = "person";
    btn.label = username;
    btn.title = "Logout";
    btn.classList.add("login-logged");
    userIn.value = "";
    passIn.value = "";
    errorEl.textContent = "";
  };
  const showAnon = () => {
    logged = false;
    btn.icon = icon;
    btn.label = label;
    btn.title = title ?? null;
    btn.classList.remove("login-logged");
    errorEl.textContent = "";
  };
  if(session) session.onChange((state) => {
    if(state.status === "auth") showLogged(state.user.username);
    else if(state.status === "anon") showAnon();
    else if(state.status === "error") errorEl.textContent = state.error || "Login failed";
  });

  el.error = (msg) => { errorEl.textContent = msg || ""; };
  el.logged = (user) => { if(!session) showLogged(user); };
  el.logout = () => { if(!session) showAnon(); };
  el.open = panel.open;
  el.close = panel.close;
  el.toggle = panel.toggle;
  UI.prop(el, "isLogged", () => logged);
  return el;
};
