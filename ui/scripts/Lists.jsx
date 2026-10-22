// scripts/Lists.jsx

const TASKS = [
  ["red", "priority_high", "Fix login bug"],
  ["amber", "schedule", "Review PR #142"],
  ["green", "check_circle", "Deploy to staging"],
  ["blue", "mail", "Answer support thread"],
  ["purple", "bug_report", "Reproduce cache issue"],
  ["teal", "menu_book", "Update docs"],
];

const Lists = () => {

  //---------------------------------------------------------------------------------- Dynamic list

  const tasks = TASKS.slice(0, 3);
  let added = tasks.length;
  const list = <stack gap="sm"></stack>;
  const empty = (
    <Empty icon="check" title="All done" description="Add a task to start over." />
  );
  const count = <Badge variant="tint" size="sm" mono>3</Badge>;
  function render() {
    list.replaceChildren(...tasks.map(([color, icon, text], i) => (
      <Panel inline stripe color={color} icon={icon}
        actions={<IconConfirmBtn variant="ghost"
          onConfirm={() => { tasks.splice(i, 1); render(); }} />}>
        {text}
      </Panel>
    )));
    list.hidden = !tasks.length;
    empty.hidden = !!tasks.length;
    count.text = tasks.length;
  }
  function add() {
    tasks.push(TASKS[added++ % TASKS.length]);
    render();
  }
  render();

  // the same rows in both containers, so the containers alone tell them apart
  const ITEMS = [["red", "item one"], ["amber", "item two"], ["green", "item three"]];
  const rows = () => ITEMS.map(([color, text]) => (
    <Panel inline stripe color={color} icon="key">{text}</Panel>
  ));

  //------------------------------------------------------------------------------------------ View

  return (
    <stack>
      <Panel title="Dynamic list" icon="checklist" meta={count}
        actions={<Button variant="primary" icon="add" onClick={add}>Add</Button>}>
        <p>
          List re-renders from array: add a row, delete one in two clicks,
          empty it to see placeholder.
        </p>
        {list}
        {empty}
      </Panel>

      <Panel title="list and stack" icon="view_agenda">
        <p>
          A <code>&lt;list&gt;</code> fuses rows into one bordered card with dividers;
          a <code>&lt;stack&gt;</code> keeps them apart by <code>gap</code>.
        </p>
        <row split align="start">
          <Panel title="<list>" size="sm"><list>{rows()}</list></Panel>
          <Panel title='<stack gap="sm">' size="sm"><stack gap="sm">{rows()}</stack></Panel>
        </row>
      </Panel>

      <Panel title="Empty states" icon="inbox">
        <p>
          An <code>Empty</code> stands where a list has nothing to show:
          an icon, a title, a description, then its children, an action for one.
        </p>
        <row split align="stretch">
          <Empty icon="inbox" title="No messages" description="New messages will appear here." />
          <Empty size="sm" icon="search_off" title="No results">
            <Button size="sm" icon="refresh">Clear filters</Button>
          </Empty>
        </row>
      </Panel>
    </stack>
  );
};
