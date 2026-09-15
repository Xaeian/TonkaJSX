// scripts/ui/Modal.jsx

// modals stack; the body scroll is unlocked by the last one to close
let _modalCount = 0;

/**
 * Dialog with a backdrop, focus trap and scroll lock.
 * Escape, the backdrop and the close button dismiss it unless `noClose` is set.
 * `noClickAway` keeps the backdrop out of it and leaves the other two, for a dialog holding
 * work that a stray click beside it must not throw away.
 *
 * Mutators: .open(), .close(), .toggle(), .opened
 *
 * @param {Object} props
 * @param {string} [props.title]
 * @param {"sm"|"lg"|"xl"} [props.size]
 * @param {boolean} [props.noClose]
 * @param {boolean} [props.noClickAway]  a click outside leaves it open
 * @param {JSX.Element|JSX.Element[]} [props.actions]  head buttons, left of the close button
 * @param {JSX.Element|JSX.Element[]} [props.footer]
 * @param {(opened:boolean) => void} [props.onChange]
 */
const Modal = ({ title, size, noClose, noClickAway, actions, footer, onChange,
  class: className, children, ...rest }) => {
  const closeBtn = noClose ? null
    : <IconBtn icon="close" title="Close" onClick={() => root.close()} />;
  const dialog = (
    <div class={["modal-dialog", size]} role="dialog" aria-modal="true" tabIndex="-1">
      {title || actions || closeBtn ? (
        <div class="modal-head">
          {title ? <h3 class="modal-title">{title}</h3> : null}
          {actions ? <div class="modal-actions">{actions}</div> : null}
          {closeBtn}
        </div>
      ) : null}
      <div class="modal-body">{children}</div>
      {footer ? <div class="modal-foot">{footer}</div> : null}
    </div>
  );
  const root = <div {...rest} class={["modal", className]} hidden>{dialog}</div>;

  // Tab cycles inside the dialog
  const focusable = () => UI.focusable(dialog);
  const trap = (e) => {
    if(e.key !== "Tab") return;
    const list = focusable();
    if(!list.length) { e.preventDefault(); return; }
    const first = list[0], last = list[list.length - 1];
    const active = document.activeElement;
    if(e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  };
  root.addEventListener("click", (e) => {
    if(e.target === root && !noClose && !noClickAway) root.close();
  });

  UI.overlay(root, {
    // a predicate still listens for Escape, and answers no to every pointer outside
    dismiss: noClose ? false : noClickAway ? () => false : true,
    onOpen: () => {
      if(_modalCount++ === 0) document.body.classList.add("modal-locked");
      document.addEventListener("keydown", trap);
      requestAnimationFrame(() => (focusable()[0] || dialog).focus());
      onChange?.(true);
    },
    onClose: () => {
      if(--_modalCount === 0) document.body.classList.remove("modal-locked");
      document.removeEventListener("keydown", trap);
      onChange?.(false);
    },
  });
  return root;
};
