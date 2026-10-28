var e={answerHtml:`<h2>简答</h2>
<ul>
<li>React 协调列表时按 key 匹配新旧元素：key 相同就复用组件实例和 DOM，key 不同就卸载旧的、创建新的。</li>
<li>key 只需要在兄弟元素之间唯一，并且在多次渲染之间保持稳定。</li>
<li>用下标当 key 时，在列表头部插入或重新排序后，组件内部状态（输入框草稿、勾选、焦点）会留在原来的位置，显示到别的数据上。</li>
<li>列表只会追加、从不重排，且条目没有内部状态时，下标可以用；其他情况用数据自带的 ID。</li>
<li>不要在渲染时生成 key，例如 <code>Math.random()</code> 或 <code>crypto.randomUUID()</code>，那样每次渲染都会重建所有条目。</li>
</ul>
<h2>下标导致状态错位</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">TodoList</span>(<span class="hljs-params">{ todos }</span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span>&gt;</span>
      {todos.map((todo, index) =&gt; (
        <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{index}</span>&gt;</span>
          {todo.text} <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">placeholder</span>=<span class="hljs-string">&quot;备注&quot;</span> /&gt;</span>
        <span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
      ))}
    <span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>假设列表是 <code>[A, B]</code>，用户在 A 的输入框里输入了&quot;重要&quot;。之后在头部插入 C，列表变成 <code>[C, A, B]</code>：</p>
<ul>
<li>key 0 原来对应 A，现在对应 C。React 认为 key 0 的元素还在，于是复用它的 <code>&lt;input&gt;</code>。</li>
<li>结果&quot;重要&quot;显示在 C 这一行。</li>
</ul>
<p>改成 <code>key={todo.id}</code> 后，A 的 key 不变，React 会移动 A 对应的 DOM，输入框内容跟着 A 走。</p>
<h2>key 的其他用法</h2>
<p>key 不只用于列表。给同一个位置的组件换 key，可以让 React 丢弃旧实例、重新创建：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;<span class="hljs-title class_">ProfileForm</span> key={userId} userId={userId} /&gt;
</code></pre></div>
<p>切换用户时表单状态全部重置，不需要写 Effect 去手动清空。</p>
<h2>常见追问</h2>
<ul>
<li>key 会作为 prop 传给组件吗？不会，组件内读不到 <code>props.key</code>，需要的话另传一个 prop。</li>
<li>数据没有 ID 怎么办？在数据进入应用时（例如从接口取到后）生成一次 ID 并保存，而不是在渲染时生成。</li>
<li>Fragment 能加 key 吗？可以，要写成 <code>&lt;Fragment key={id}&gt;</code>，简写 <code>&lt;&gt;</code> 不能加 key。</li>
</ul>`};export{e as default};